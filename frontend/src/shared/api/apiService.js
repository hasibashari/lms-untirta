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

// Global Request Tracking for Loading Bar
let activeRequests = 0;
const notifyLoading = (isLoading) => {
  if (isLoading) activeRequests++;
  else activeRequests = Math.max(0, activeRequests - 1);
  
  // Dispatch custom event for GlobalLoadingBar
  window.dispatchEvent(new CustomEvent('api-loading', { detail: activeRequests > 0 }));
};

api.interceptors.request.use(
  config => {
    notifyLoading(true);
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
    notifyLoading(false);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    notifyLoading(false);
    return response.data;
  },
  error => {
    notifyLoading(false);
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
