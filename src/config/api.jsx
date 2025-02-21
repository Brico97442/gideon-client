const API_URL = import.meta.env.VITE_API_URL;

const GET_TOMBS = `${API_URL}/tombs` 
const GET_TOMB = (id) => `${API_URL}/tombs/${id}`;


export {
    GET_TOMBS,
    GET_TOMB
}