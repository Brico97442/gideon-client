import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useTomb } from "../context/TombContext";
import { SEARCH_DECEASED } from "../config/api";
import modalBackground from "../assets/ui_element/search_bar.png";
import logo from "../assets/teams_logo/saintpaul.png";
// import calendarIcon from "../assets/ui_element/calendar_icon.svg";
import profilImg from "../assets/ui_element/profilicon.png";
import { formatDate } from "../utils/DateUtils";
import Button from "./Button";
import moment from "moment/moment";

function UserInterface({ handleTombFocus, applicationStart }) {
    const [lastname, setLastname] = useState("");
    const [firstname, setFirstname] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [deathdate, setDeathdate] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cachedData, setCachedData] = useState(null);
    const [allCachedData, setAllCachedData] = useState(null);
    const { selectTomb, focusOnTomb } = useTomb();
    const [isBirthdateFocused, setIsBirthdateFocused] = useState(false);
    const [isDeathdateFocused, setIsDeathdateFocused] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [terms, setTerms] = useState("");

    // Index des données pour une recherche plus rapide
    const searchIndex = useMemo(() => {
        if (!cachedData) return null;

        const index = {
            byLastName: new Map(),
            byFirstName: new Map(),
            byBirthDate: new Map(),
            byDeathDate: new Map(),
            allDeceased: [],
            searchableText: new Map(),
        };

        cachedData.forEach((person) => {
            const indexedPerson = {
                ...person,
                tombId: person.tombId,
            };
            index.allDeceased.push(indexedPerson);

            // Index de recherche textuelle
            const searchText = `${person.firstname || ""} ${person.lastname || ""
                }`.toLowerCase();
            index.searchableText.set(searchText, indexedPerson);

            if (person.lastname) {
                const lastName = person.lastname.toLowerCase();
                if (!index.byLastName.has(lastName)) {
                    index.byLastName.set(lastName, []);
                }
                index.byLastName.get(lastName).push(indexedPerson);
            }

            if (person.firstname) {
                const firstName = person.firstname.toLowerCase();
                if (!index.byFirstName.has(firstName)) {
                    index.byFirstName.set(firstName, []);
                }
                index.byFirstName.get(firstName).push(indexedPerson);
            }

            if (person.birthdate) {
                const birthDate = person.birthdate.split("T")[0];
                if (!index.byBirthDate.has(birthDate)) {
                    index.byBirthDate.set(birthDate, []);
                }
                index.byBirthDate.get(birthDate).push(indexedPerson);
            }

            if (person.deathDate) {
                const deathDate = person.deathDate.split("T")[0];
                if (!index.byDeathDate.has(deathDate)) {
                    index.byDeathDate.set(deathDate, []);
                }
                index.byDeathDate.get(deathDate).push(indexedPerson);
            }
            // if(person){

            //     console.log(person)
            // }
        });

        return index;
    }, [cachedData]);


    const fetchInitialData = async () => {
        setIsLoading(true);
        await axios.get(SEARCH_DECEASED())
            .then((response) => {
                setCachedData(response.data);
                setAllCachedData(response.data);
                // console.log(results);
                setIsLoading(false);
            })
            .catch((error) => {
                // console.log("ERREUR")
            })

    };



    // Chargement initial des données
    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        let filteredCachedData = [...allCachedData]; // Copie du tableau original

        if (terms.trim() !== "") {
            // Normalisation de la recherche
            const searchTerms = terms
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .split(/\s+/); // Sépare les termes par des espaces

            filteredCachedData = filteredCachedData.filter((data) => {

                // Normalisation des champs de recherche
                const normalizeField = (field) =>
                    field ?
                        field.toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                        : '';

                const fullname = normalizeField(`${data.lastname || ''} ${data.firstname || ''}`);
                const birthnameTerm = normalizeField(data.birthname);
                const deathDateTerm = data.deathDate
                    ? moment(data.deathDate).format('DD/MM/YYYY').toLowerCase()
                    : '';
                const birthDateTerm = data.birthdate
                    ? moment(data.birthdate).format('DD/MM/YYYY').toLowerCase()
                    : '';

                // Vérifie si tous les termes de recherche correspondent à au moins un champ
                return searchTerms.every(term =>
                    fullname.includes(term) ||
                    birthnameTerm.includes(term) ||
                    deathDateTerm.includes(term) ||
                    birthDateTerm.includes(term)
                );
            });
        }

        setCachedData(filteredCachedData);
        setResults(filteredCachedData);
        setHasSearched(true);
    };

    const handleLocate = (person) => {
        if (person && person.id) {
            if (handleTombFocus && typeof handleTombFocus === "function") {
                handleTombFocus(person.tombId, person);
            }
            setLastname("");
            setFirstname("");
            setBirthdate("");
            setDeathdate("");
            setResults([]);
            setTerms("");
            setHasSearched(false);
        } else {
            console.error("Données de la personne invalides:", person);
        }
    };

    return (
        <div
            id="ui"
            className={`hidden lg:w-full lg:block absolute h-[131px] z-50`}
        >
            <div className="w-full h-full relative">
                <img
                    src={modalBackground}
                    alt="modal gauche background"
                    className="h-full w-full object-fill absolute top-0 left-0 opacity-95"
                />

                <div className=" w-full font-avenir relative flex items-center justify-center text-dark-green">

                    <h1 className="font-orbitron h-full font-black absolute left-0 pl-[26px] pb-[36px] flex items-end text-[2em] leading-none text-white">
                        GIDEON
                    </h1>


                    <div className="w-[71%] h-[131px]">
                        <div className="flex flex-col relative justify-center">
                            <form className="pt-5">
                                <input
                                    type="text"
                                    onChange={(e) => setTerms(e.target.value)}
                                    value={terms}
                                    placeholder="Recherchez un défunt..."
                                    className="bg-linear-to-r from-white to-lite-blue  w-full h-14 focus:outline-none pl-[70px]  rounded-2xl placeholder:leading-none placeholder:text-black text-[1.6em]"
                                />

                                {error && (
                                    <p className="text-red-500  text-[1.6em] mt-6">{error}</p>
                                )}

                                {hasSearched && results.length === 0 && (
                                    <p className="text-red-500 text-[1.5em] mt-6">
                                        Informations inexistantes veuillez réessayer
                                    </p>
                                )}

                                {/* {isLoading && <p className=" mt-2">Chargement...</p>} */}
                                <div className=" h-10 w-40 absolute hidden right-0 top-0" onClick={handleSearch}>
                                    <Button btnValue="Rechercher" className="font-extralight" />
                                </div>

                            </form>
                        </div>
                        {
                            results.length > 0 &&
                            (
                                <div className="w-full px-36 py-15 overflow-hidden z-20 text-dark-green bg-[#D9D9D9] rounded-4xl">
                                    {/* <h3 className="text-center mb-2">
                                    {results.length} résultat{results.length > 1 ? "s" : ""}{" "}
                                    trouvé{results.length > 1 ? "s" : ""}
                                </h3> */}
                                    <ul className="max-h-[50vh] overflow-y-auto space-y-8">
                                        {results.map((person, index) => (
                                            <li
                                                key={`${person.id}-${index}`}
                                                className="border-b border-white/20 hover:bg-[#0E1C36]/30 transition-all duration-150 cursor-pointer rounded-3xl bg-white py-[14.6px] px-[26px] shadow"
                                                onClick={() => handleLocate(person)}
                                            >
                                                <div className="flex items-center gap-5 relative">
                                                    <img src={profilImg} alt="profil décès" width={58} height={58} className={`object-contain z-50 h-[58px] w-[58px] rounded-full`} />

                                                    <span className="text-[32px]">
                                                        {person.firstname} {person.lastname}
                                                    </span>
                                                    <div className="text-sm opacity-80">
                                                        <span className="flex gap-4 text-[18px] font-bold ">
                                                            <span className=" border-l pl-3">
                                                                {person.birthdate &&
                                                                    `Né(e) le ${formatDate(person.birthdate)}`}
                                                            </span>
                                                            <span className=" border-l pl-3">
                                                                {person.deathDate &&
                                                                    `Décédé(e) le ${formatDate(
                                                                        person.deathDate
                                                                    )}`}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <span className="bg-apple-green rounded-4xl px-2 text-[12px] absolute right-0">DAH-{person.tombId}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </div>

                    <img src={logo} alt="Saint paul logo" className="absolute right-0 w-[200px]" width={200} height={120} />
                </div>
            </div>
        </div>
    );
}

UserInterface.propTypes = {
    handleTombFocus: PropTypes.func.isRequired,
};

export default UserInterface;