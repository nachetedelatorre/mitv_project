import axios from 'axios';
const API = axios.create({ baseURL: 'https://mitvproject-production.up.railway.app/api' });
export default API;
