import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useTomb } from "../context/TombContext";
import { SEARCH_DECEASED } from "../config/api";
import modalBackground from "../assets/ui_element/search_bar.png";
import logo from "../assets/teams_logo/saintpaul.png";
import logoLoupe from "../assets/ui_element/search_icon.png";
// import calendarIcon from "../assets/ui_element/calendar_icon.svg";
import profilImg from "../assets/ui_element/profilicon.png";
import { formatDate } from "../utils/DateUtils";
import Button from "./Button";
import moment from "moment/moment";
import { Suspense } from "react";
import debounce from 'lodash/debounce';

function UserInterface({ handleTombFocus, applicationStart, onInputFocus }) {
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

    // Fonction de recherche optimisée avec useMemo
    const filteredResults = useMemo(() => {
        if (!terms.trim() || !allCachedData) return [];

        const searchTerms = terms
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .split(/\s+/);

        return allCachedData.filter((data) => {
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

            return searchTerms.every(term =>
                fullname.includes(term) ||
                birthnameTerm.includes(term) ||
                deathDateTerm.includes(term) ||
                birthDateTerm.includes(term)
            );
        });
    }, [terms, allCachedData]);

    // Chargement initial des données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(SEARCH_DECEASED());
                setAllCachedData(response.data);
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Mise à jour des résultats avec debounce
    useEffect(() => {
        const updateResults = debounce(() => {
            setResults(filteredResults);
            setHasSearched(terms.trim() !== "");
        }, 300);

        updateResults();
        return () => updateResults.cancel();
    }, [filteredResults, terms]);

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
            className={`hidden lg:w-full lg:block h-[12vh] z-50  pointer-events-none`}
        >
            <div className="w-full h-full relative pointer-events-none">
                <img
                    src={modalBackground}
                    alt="modal gauche background"
                    className="h-full w-full object-fill absolute top-0 left-0 opacity-95 pointer-events-none"
                />

                <div className=" w-full font-avenir relative flex items-center justify-center text-dark-green pointer-events-none">

                    <h1 className="font-orbitron h-full font-black absolute left-0 pl-[26px] items-end pb-[3vh] flex text-[1.7em] leading-none text-white">
                        GIDEON
                    </h1>


                    <div className="w-[71%] h-[11vh] pointer-events-none">
                        <div className="flex flex-col relative justify-center pointer-events-none">
                            <div className="h-full flex items-center absolute  ml-1 z-50">
                                <img src={logoLoupe} alt="Logo loupe" className="object-contain h-[40px] w-[40px]" />
                            </div>

                            <form className="pt-0 flex h-[8vh] items-center" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    onChange={(e) => setTerms(e.target.value)}
                                    value={terms}
                                    placeholder="Recherchez un défunt..."
                                    className="pointer-events-auto bg-linear-to-r from-white to-lite-blue w-full h-[6vh] focus:outline-none pl-[70px] rounded-lg placeholder:leading-none placeholder:text-black text-[1.55em]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                        }
                                    }}
                                    onFocus={() => onInputFocus && onInputFocus()}
                                />

                            </form>
                        </div>
                        {error && (
                            <div className="mt-6 p-3 bg-[#D9D9D9] rounded-lg">
                                <p className="text-red-500 text-[1.6em] pt-6">{error}</p>
                            </div>
                        )}

                        {hasSearched && results.length === 0 && (
                            <div className="mt-6 p-3 bg-[#D9D9D9] rounded-lg">
                                <p className="text-red-500 text-[1.5em]">
                                    Informations inexistantes veuillez réessayer
                                </p>
                            </div>
                        )}
                        {
                            results.length > 0 &&
                            (
                                <div className="w-full px-[8vw] py-[6vh] overflow-hidden z-20 text-black bg-[#D9D9D9] rounded-4xl mt-2 pointer-events-auto">
                                    <ul className="max-h-[59vh] overflow-y-auto space-y-4">
                                        {results.map((person, index) => (
                                            <li
                                                key={`${person.id}-${index}`}
                                                className="border-b border-white/20 hover:bg-[#0E1C36]/30 transition-all duration-150 cursor-pointer rounded-3xl flex items-center bg-white h-[8vh] py-[1vh] px-[1.5vw] shadow"
                                                onClick={() => handleLocate(person)}
                                            >
                                                <div className="flex items-center gap-5 relative w-full">
                                                    <img src={profilImg} alt="profil décès" width={50} height={50} className={`object-contain z-50 h-[50px] w-[50px] rounded-full`} />

                                                    <span className="text-[1.6em] whitespace-nowrap">
                                                        {person.firstname} {person.lastname}
                                                    </span>
                                                    <div className="text-sm opacity-80">
                                                        <span className="flex gap-4 text-[1em] font-bold ">
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

                    <img src={logo} alt="Saint paul logo" className="absolute right-0 w-[150px]" width={150} height={100} />
                </div>
            </div>
        </div>
    );
}

UserInterface.propTypes = {
    handleTombFocus: PropTypes.func.isRequired,
    onInputFocus: PropTypes.func
};

export default UserInterface;