const API_URL = import.meta.env.VITE_API_URL;

const GET_TOMBS = `${API_URL}/tombs` 
const GET_TOMB = (id) => `${API_URL}/tombs/${id}`;
const GET_DECEASED = (id) => `${API_URL}/tombs/${id}/deceased`;

// fetch(GET_DECEASED(13211))
// .then((response) => response.json())
// .then((data) => {
//    console.log(data); // Vérifie si les données arrivent bien ici
// });
export {
    GET_TOMBS,
    GET_TOMB,
    GET_DECEASED
}