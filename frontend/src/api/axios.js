/**
 * ============================================
 * PropLedger - Axios Configuration
 * ============================================
 * Configures Axios instance with base URL and authentication
 * Automatically injects JWT token from localStorage for all requests
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

import axios from "axios";

/**
 * Create Axios instance with default configuration
 * Base URL is set from environment variable or defaults to localhost
 */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * Request Interceptor
 * Automatically injects JWT token from localStorage as Authorization header
 * This is required for iOS Safari which blocks cross-site cookies (SameSite=None)
 * due to Intelligent Tracking Prevention (ITP)
 */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * Response Interceptor
 * Handle subscription expiry and premium required errors
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const message = error.response?.data?.message;
      
      if (error.response?.data?.subscriptionExpired || (message?.includes('expired') && !message?.includes('Trial'))) {
        // Subscription expired - redirect to upgrade page
        localStorage.setItem('subscriptionExpired', 'true');
        window.location.href = '/subscription-expired';
      } else if (error.response?.data?.trialLimitReached) {
        // Trial limit reached
        alert('⚠️ Trial limit reached! You can only create 9 deals in 7-day trial. Please upgrade to add more deals.');
        window.location.href = '/subscription-expired';
      } else if (message?.includes('Premium subscription required') && !message?.includes('Trial')) {
        // Show alert for premium required (but not for trial users)
        alert('⚠️ Your subscription has expired. Please renew to continue adding deals and payments.');
        window.location.href = '/subscription-expired';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
