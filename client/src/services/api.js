import axios from 'axios';

const normalizeApiBaseUrl = (value) => {
  if (!value) return '/api';

  const trimmed = value.trim().replace(/\/$/, '');

  if (trimmed.endsWith('/api')) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return `${trimmed}/api`;
  }

  return trimmed.startsWith('/') ? `${trimmed}/api` : `/${trimmed}/api`;
};

// Support production multi-domain deployments via VITE_API_URL env var
const API = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second request timeout
});

// Interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiry globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired - clear session and redirect to login
    if (error.response?.status === 401 && error.response?.data?.message?.includes('expired')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
