import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 401 auto-logout hook ---
let _onUnauthorized = null;

export const setOnUnauthorized = (fn) => {
  _onUnauthorized = fn;
};


api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan';

    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (status === 401 && _onUnauthorized && !error.config?._skipAuthRedirect && !isLoginEndpoint) {
      _onUnauthorized();
      toast.error('Sesi telah berakhir, silakan login kembali');
      return Promise.reject(new Error('Sesi telah berakhir'));
    }

    if (status !== 401) {
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
