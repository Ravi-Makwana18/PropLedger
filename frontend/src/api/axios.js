import axios from "axios";

console.log("API BASE URL:", process.env.REACT_APP_API_URL); // Debug step

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true
});

export default API;

 

