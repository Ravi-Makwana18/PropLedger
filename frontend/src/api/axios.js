import axios from "axios";

// Debug: Confirm API base URL
console.log("API BASE URL:", process.env.REACT_APP_API_URL);

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;

 

