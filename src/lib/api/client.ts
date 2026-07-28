import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearSessionId, getSessionId, isAuthenticated } from './session';

// Base URL for the API - update this to match your backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fooddely.com';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session-based cart
});

// Request interceptor - adds JWT token and session_id if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage or wherever you store it
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For anonymous users, add session_id to headers for cart-related requests
    // Only add if user is not authenticated and session_id exists
    if (!isAuthenticated() && config.headers) {
      const sessionId = getSessionId();
      if (sessionId && (config.url?.includes('/cart/') || config.url?.includes('/orders/'))) {
        config.headers['X-Session-ID'] = sessionId;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login or clear token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Optionally redirect to login
        // window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

// Helper to set auth token
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    // Clear anonymous session_id when user logs in (they'll use authenticated session)
    clearSessionId();
  }
};

// Helper to clear auth token
export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    // Also clear session_id when logging out
    clearSessionId();
  }
};

// Helper to check if user has token
export const hasAuthToken = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('auth_token');
  }
  return false;
};
