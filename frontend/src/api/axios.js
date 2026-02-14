import axios from 'axios';

// Determine API base URL based on environment
const getBaseURL = () => {
  // In production, use environment variable or default to relative path
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, proxy handles /api
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  
  // Production fallback (relative path works when frontend and backend are on same domain)
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
