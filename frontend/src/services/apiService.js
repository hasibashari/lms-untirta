import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 401 auto-logout hook ---
// AuthContext registers its logout function here so the interceptor can call it
// without importing from the React tree (avoids circular dependency).
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
    // Let browser set Content-Type for FormData (includes multipart boundary)
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
  response => response.data,
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan';

    // Auto-logout on 401 (expired / invalid token)
    // Skip if the request explicitly opted out (e.g. silent auth restore)
    if (status === 401 && _onUnauthorized && !error.config?._skipAuthRedirect) {
      _onUnauthorized();
      toast.error('Sesi telah berakhir, silakan login kembali');
      return Promise.reject(new Error('Sesi telah berakhir'));
    }

    // Default global error handler for other statuses
    if (status !== 401) {
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
