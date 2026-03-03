import axios from 'axios';

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

    // Auto-logout on 401 (expired / invalid token)
    if (status === 401 && _onUnauthorized) {
      _onUnauthorized();
      return Promise.reject(new Error('Sesi telah berakhir, silakan login kembali'));
    }

    const message = error.response?.data?.message || 'Terjadi kesalahan';

    return Promise.reject(new Error(message));
  }
);

export default api;
