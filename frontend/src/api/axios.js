import axios from "axios";

const API = axios.create({
  baseURL: "https://destination-dholera.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default API;
