import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://destination-dholera.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Inject JWT from localStorage as Authorization header on every request.
// This is required for iOS Safari, which blocks cross-site cookies (SameSite=None)
// due to Intelligent Tracking Prevention (ITP).
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API;
