import axios from 'axios';
const tokenKey = 'hr-increment.access-token';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5180/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(tokenKey);
  if (token && token !== 'development-session') config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Employee-Data-Source'] = 'hr-staff';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(tokenKey);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);
