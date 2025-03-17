
const API_URL =!import.meta.env.PROD? import.meta.env.VITE_API_PUBLIC_URL : import.meta.env.VITE_API_LOCAL_URL ;

const GET_TOMBS = `${API_URL}/tombs` 
const GET_TOMB = (id) => `${API_URL}/tombs/${id}`;
const GET_DECEASED = (id) => `${API_URL}/tombs/${id}/deceased`;
const SEARCH_DECEASED = () => `${API_URL}/deceased/search/deceased`

export {
    GET_TOMBS,
    GET_TOMB,
    GET_DECEASED,
    SEARCH_DECEASED
}