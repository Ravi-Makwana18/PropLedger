/**
 * ============================================
 * PropLedger - Axios Configuration
 * ============================================
 * Configures Axios instance with base URL and authentication
 * Automatically injects JWT token from localStorage for all requests
 *
 * @author Ravi Makwana
 * @version 1.1.0
 */

import axios from 'axios';

/**
 * Create Axios instance with default configuration
 * Base URL is set from environment variable or defaults to localhost
 */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically injects JWT token from localStorage as Authorization header
 * Required for iOS Safari which blocks cross-site cookies (SameSite=None)
 * due to Intelligent Tracking Prevention (ITP)
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles 401 Unauthorized globally — clears token and redirects to login
 * so expired sessions never leave the user on a broken authenticated page.
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('pl_user');
      sessionStorage.clear();
      // Only redirect if not already on an auth page
      const authPaths = ['/login', '/register'];
      if (!authPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
