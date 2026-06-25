import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 12000,
});

api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,  // unwrap — responses are already { success, data }
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
    }
    const msg = err.response?.data?.error || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default api;
