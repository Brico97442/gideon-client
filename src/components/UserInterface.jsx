import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import { useTomb } from '../context/TombContext';
import { SEARCH_DECEASED } from '../config/api';

function UserInterface({ handleTombFocus }) {
    const [lastname, setLastname] = useState("");
    const [firstname, setFirstname] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [deathdate, setDeathdate] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [cachedData, setCachedData] = useState(null);
    const { selectTomb, focusOnTomb } = useTomb();

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
                console.error(" initial loading data error:", error);
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

            // Si nous avons des données en cache, utiliser l'index local
            if (searchIndex) {
                const searchTerms = [lastname, firstname].filter(term => term).map(term => term.toLowerCase());
                const matches = new Set();

                if (searchTerms.length > 0) {
                    searchIndex.searchableText.forEach((person, text) => {
                        if (searchTerms.every(term => text.includes(term))) {
                            matches.add(person);
                        }
                    });
                }

                // Filtrer par dates si spécifiées
                let filteredResults = Array.from(matches);
                if (birthdate) {
                    filteredResults = filteredResults.filter(person => 
                        person.birthdate && person.birthdate.startsWith(birthdate)
                    );
                }
                if (deathdate) {
                    filteredResults = filteredResults.filter(person => 
                        person.deathDate && person.deathDate.startsWith(deathdate)
                    );
                }

                setResults(filteredResults);
            } else {
                // Si pas de cache, utiliser l'API
                const searchParams = new URLSearchParams();
                if (lastname) searchParams.append('lastname', lastname);
                if (firstname) searchParams.append('firstname', firstname);
                if (birthdate) searchParams.append('birthdate', birthdate);
                if (deathdate) searchParams.append('deathdate', deathdate);

                const response = await axios.get(`${SEARCH_DECEASED()}?${searchParams.toString()}`);
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
            console.log('Données de la personne:', person);
            console.log('ID de la tombe:', person.tombId);

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

    return (
        <div id="ui" className="hidden lg:block absolute left-0 pl-5 py-6 h-full z-50">
            <div className="shape-container-background w-full h-full p-4">
                <div className="shape-container relative font-orbitron uppercase flex flex-col items-center justify-between h-full w-[460px] text-white">
                    <div className="shape-border"></div>
                    <div className="shape-inner bg-gradient-to-b from-[#3D52CA]/80  via-[#001278]/80 to-[#3D52CA]/80">
                        <div className="w-full flex flex-col p-7">
                            <h1 className="font-bold text-[42px] w-full text-center tracking-[0.4em] h-[94px] border-b">GIDEON</h1>
                            <h2 className="font-orbitron mt-6 mb-[67px] text-xl tracking-wide font-normal">Rechercher un défunt</h2>

                            <input
                                type="text"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                placeholder="Nom"
                                className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                            />
                            <input
                                type="text"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                placeholder="Prénom"
                                className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                            />
                            <input
                                type="date"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                                className="w-full border-b mb-4 h-10 placeholder:uppercase focus:outline-none bg-transparent text-white"
                            />
                            <input
                                type="date"
                                value={deathdate}
                                onChange={(e) => setDeathdate(e.target.value)}
                                className="w-full border-b mb-4 h-10 placeholder:uppercase focus:outline-none bg-transparent text-white"
                            />

                            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                            {results.length > 0 && (
                                <div className="w-full mt-4 overflow-hidden z-20">
                                    <h3 className="text-center text-lg mb-2">
                                        {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                                    </h3>
                                    <ul className="max-h-40 overflow-y-auto space-y-2">
                                        {results.map((person, index) => (
                                            <li
                                                key={`${person.id}-${index}`}
                                                className="border-b border-white/20 py-2 px-3 hover:bg-[#0E1C36]/30 transition-all duration-150 rounded cursor-pointer"
                                                onClick={() => handleLocate(person)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{person.firstname} {person.lastname}</span>
                                                    <div className="text-sm opacity-80">
                                                        <span>
                                                            {person.birthdate && `Né(e) le ${new Date(person.birthdate).toLocaleDateString()}`}
                                                            {person.deathDate && ` - Décédé(e) le ${new Date(person.deathDate).toLocaleDateString()}`}
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
                    <button
                        onClick={handleSearch}
                        className="w-[400px] bg-[#0E1C36] h-[76px] hover:bg-[#0E1C36]/70 absolute bottom-[18px] text-white rounded-lg transition-all duration-150 mb-4"
                    >
                        Rechercher
                    </button>
                </div>
            </div>
        </div>
    );
}

UserInterface.propTypes = {
    handleTombFocus: PropTypes.func.isRequired
};

export default UserInterface;
