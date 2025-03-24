import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import { useTomb } from '../context/TombContext';
import { SEARCH_DECEASED } from '../config/api';
import modalBackground from '../assets/ui_element/left_modal.webp';
import logo from '../assets/ui_element/logo_st_paul.svg';
import calendarIcon from '../assets/ui_element/calendar_icon.svg';
import { formatDate } from '../utils/DateUtils';
import Button from "./Button";

function UserInterface({ handleTombFocus,applicationStart }) {
    const [lastname, setLastname] = useState("");
    const [firstname, setFirstname] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [deathdate, setDeathdate] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cachedData, setCachedData] = useState(null);
    const { selectTomb, focusOnTomb } = useTomb();
    const [isBirthdateFocused, setIsBirthdateFocused] = useState(false);
    const [isDeathdateFocused, setIsDeathdateFocused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);


    // Index des données pour une recherche plus rapide
    const searchIndex = useMemo(() => {
        if (!cachedData) return null;

        const index = {
            byLastName: new Map(),
            byFirstName: new Map(),
            byBirthDate: new Map(),
            byDeathDate: new Map(),
            allDeceased: [],
            searchableText: new Map()
        };

        cachedData.forEach(person => {
            const indexedPerson = {
                ...person,
                tombId: person.tombId
            };
            index.allDeceased.push(indexedPerson);

            // Index de recherche textuelle
            const searchText = `${person.firstname || ''} ${person.lastname || ''}`.toLowerCase();
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
                const birthDate = person.birthdate.split('T')[0];
                if (!index.byBirthDate.has(birthDate)) {
                    index.byBirthDate.set(birthDate, []);
                }
                index.byBirthDate.get(birthDate).push(indexedPerson);
            }

            if (person.deathDate) {
                const deathDate = person.deathDate.split('T')[0];
                if (!index.byDeathDate.has(deathDate)) {
                    index.byDeathDate.set(deathDate, []);
                }
                index.byDeathDate.get(deathDate).push(indexedPerson);
            }
        });

        return index;
    }, [cachedData]);

    // Chargement initial des données
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(SEARCH_DECEASED());
                setCachedData(response.data);
            } catch (error) {
                console.error("Erreur de chargement initial des données:", error);
                setError("Une erreur est survenue lors du chargement initial des données.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            setError("");
            setResults([]);

            // Si nous avons des critères de recherche
            const hasSearchCriteria = lastname || firstname || birthdate || deathdate;

            // Si nous avons des données en cache et l'index
            if (searchIndex && hasSearchCriteria) {

                let matches = new Set();
                const searchTerms = [lastname, firstname].filter(term => term).map(term => term.toLowerCase());

                // Si on a des termes de recherche textuels
                if (searchTerms.length > 0) {
                    searchIndex.allDeceased.forEach(person => {
                        const fullName = `${person.firstname || ''} ${person.lastname || ''}`.toLowerCase();
                        if (searchTerms.every(term => fullName.includes(term))) {
                            matches.add(person);
                        }
                    });
                } else {
                    // Si aucun terme textuel, on part de toutes les données
                    searchIndex.allDeceased.forEach(person => matches.add(person));
                }

                // Filtrer par date de naissance si spécifiée
                if (birthdate) {
                    const formattedBirthDate = new Date(birthdate).toISOString().split('T')[0];
                    matches = new Set(
                        Array.from(matches).filter(person => {
                            if (!person.birthdate) return false;
                            const personBirthDate = new Date(person.birthdate).toISOString().split('T')[0];
                            return personBirthDate === formattedBirthDate;
                        })
                    );
                }

                // Filtrer par date de décès si spécifiée
                if (deathdate) {
                    const formattedDeathDate = new Date(deathdate).toISOString().split('T')[0];
                    matches = new Set(
                        Array.from(matches).filter(person => {
                            if (!person.deathDate) return false;
                            const personDeathDate = new Date(person.deathDate).toISOString().split('T')[0];
                            return personDeathDate === formattedDeathDate;
                        })
                    );
                }

                // console.log('Résultats filtrés:', Array.from(matches));
                setResults(Array.from(matches));
            } else {
                // Si pas de cache ou d'index, ou pas de critères, utiliser l'API
                const searchParams = new URLSearchParams();
                if (lastname) searchParams.append('lastname', lastname);
                if (firstname) searchParams.append('firstname', firstname);
                if (birthdate) {
                    const formattedBirthdate = new Date(birthdate).toISOString().split('T')[0];
                    searchParams.append('birthdate', formattedBirthdate);
                }
                if (deathdate) {
                    const formattedDeathdate = new Date(deathdate).toISOString().split('T')[0];
                    searchParams.append('deathdate', formattedDeathdate);
                }

                const url = `${SEARCH_DECEASED()}?${searchParams.toString()}`;
                // console.log('URL de l\'API:', url);
                const response = await axios.get(url);
                // console.log('Résultats de l\'API:', response.data);
                setResults(response.data);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche:", error);
            setError("Une erreur est survenue lors de la recherche.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocate = (person) => {
        if (person && person.tombId) {
            // console.log('Données de la personne:', person);
            // console.log('ID de la tombe:', person.tombId);

            // Sélectionner la tombe dans le contexte avec uniquement la personne sélectionnée
            selectTomb(person.tombId, [person]);

            // Définir les couleurs de la section
            const sectionColors = {
                13: '#EF507E',
                14: '#FFE771',
                15: '#B89AD7',
                16: '#E0C2B6',
            };

            // Déclencher l'animation de focus
            focusOnTomb(person.tombId, sectionColors);

            // Appeler la fonction handleTombFocus du parent
            if (handleTombFocus && typeof handleTombFocus === 'function') {
                handleTombFocus(person.tombId);
            }
        } else {
            console.error('Données de la personne invalides:', person);
        }
    };
    useEffect(() => {
        if (!applicationStart) {
          // Un petit délai pour permettre au composant de se rendre avant d'animer
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 50);
          return () => clearTimeout(timer);
        } else {
          setIsVisible(false);
        }
      }, [applicationStart]);

    const modalPositionClass = isVisible ? "left-0" : "left-full";


    return (
        <div id="ui" className={`hidden lg:w-full lg:block absolute pl-3 py-6 h-full z-50`}>
            <div className="w-full pl-[26px] pr-[2.1vw] h-full relative">
                <img src={modalBackground} alt="modal gauche background" className="h-full w-full object-fill absolute top-0 left-0" />

                <h1 className="absolute font-orbitron -left-[44px] top-[11vh] font-black text-[1.6em] -rotate-90 leading-none">GIDEON</h1>

                <div className="h-full w-full font-avenir relative flex flex-col text-dark-green">

                    <div id="logo_container" className="w-full flex justify-end mt-0.5">
                        <img src={logo} alt="Saint paul logo" width={150} height={120} />
                    </div>

                    <div className="w-full h-full">
                        <div className="flex flex-col">
                            <h2 className=" flex ml-[2.2vw] w-full text-[1.3em] font-normal mt-[5.8vh] mb-[5vh]">Rechercher un défunt</h2>
                            <form className="pr-[1vw]">
                                <input
                                    type="text"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    placeholder="Nom"
                                    className="w-full font-normal border-b-white placeholder:text-dark-green text-[1.5em] h-7 border-b mb-7 focus:outline-none bg-transparent text-dark-green"
                                />
                                <input
                                    type="text"
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                    placeholder="Prénom"
                                    className="w-full font-normal placeholder:text-dark-green h-7 text-[1.5em] border-b-white border-b mb-7 focus:outline-none bg-transparent text-dark-green"
                                />

                                <div className="relative mb-7 flex items-center">
                                    {!birthdate && !isBirthdateFocused && (
                                        <div
                                            className="absolute left-0 text-dark-green text-[1.5em] cursor-text"
                                            onClick={() => {
                                                setIsBirthdateFocused(true);
                                                document.getElementById("birthdate-input").focus();
                                            }}
                                        >
                                            Date de naissance
                                        </div>
                                    )}
                                    <input
                                        id="birthdate-input"
                                        type="date"
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        onFocus={() => setIsBirthdateFocused(true)}
                                        onBlur={() => !birthdate && setIsBirthdateFocused(false)}
                                        className="w-full font-normal placeholder:text-[1.5em] text-[1.5em] border-b-white border-b h-7 bg-transparent text-dark-green focus:outline-none"
                                    />
                                    <img src={calendarIcon} alt="calendrier icône" className="pointer-events-none h-[30px] w-[30px] mb-[0.5vh] mr-3 object-fill absolute right-0 " />

                                </div>

                                <div className="relative flex items-center">
                                    {!deathdate && !isDeathdateFocused && (
                                        <div
                                            className="absolute left-0 placeholder:text-[1.5em] text-[1.5em] cursor-text"
                                            onClick={() => {
                                                setIsDeathdateFocused(true);
                                                document.getElementById("deathdate-input").focus();
                                            }}
                                        >
                                            Date de décès
                                        </div>
                                    )}
                                    <input
                                        id="deathdate-input"
                                        type="date"
                                        value={deathdate}
                                        onChange={(e) => setDeathdate(e.target.value)}
                                        onFocus={() => setIsDeathdateFocused(true)}
                                        onBlur={() => !deathdate && setIsDeathdateFocused(false)}
                                        className="w-full font-normal placeholder:text-[1.5em] text-[1.5em] border-b-white border-b h-7 bg-transparent text-dark-green focus:outline-none"
                                    />
                                    <img src={calendarIcon} alt="calendrier icône" className="pointer-events-none h-[30px] w-[30px] mb-[0.5vh] mr-3 object-fill absolute right-0" />
                                </div>
                                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                                {isLoading && <p className="text-center mt-2">Chargement...</p>}
                            </form>


                            {results.length > 0 && (
                                <div className="w-full mt-2 overflow-hidden z-20 text-dark-green">
                                    <h3 className="text-center mb-2">
                                        {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                                    </h3>
                                    <ul className="max-h-[18vh] overflow-y-auto space-y-1">
                                        {results.map((person, index) => (
                                            <li
                                                key={`${person.id}-${index}`}
                                                className="border-b border-white/20  hover:bg-[#0E1C36]/30 transition-all duration-150 rounded cursor-pointer"
                                                onClick={() => handleLocate(person)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{person.firstname} {person.lastname}</span>
                                                    <div className="text-sm opacity-80">
                                                        <span className="flex flex-col">
                                                            <span>{person.birthdate && `Né(e) le ${formatDate(person.birthdate)}`}</span>
                                                            <span>{person.deathDate && `Décédé(e) le ${formatDate(person.deathDate)}`}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='w-full mb-[4.5vh]' onClick={handleSearch}>
                        <Button btnValue="Rechercher" className='font-extralight'/>
                    </div>
                </div>
            </div>
        </div>
    );
}

UserInterface.propTypes = {
    handleTombFocus: PropTypes.func.isRequired
};

export default UserInterface;