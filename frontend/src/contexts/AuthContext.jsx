import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginAPI, getMe } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== LOGIN REAL =====
  // Memoized dengan useCallback agar reference stabil
  const login = useCallback(async (email, password) => {
    const res = await loginAPI({ email, password });

    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(newUser);

    return newUser; // penting untuk redirect berdasarkan role
  }, []);

  // ===== LOGOUT =====
  // Memoized dengan useCallback agar reference stabil
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  // ===== RESTORE AUTH (AUTO LOGIN) =====
  const restoreAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMe();
      setUser(res.data);
      setToken(storedToken);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  // ===== MEMOIZED CONTEXT VALUE =====
  // Mencegah re-render semua consumers ketika AuthProvider re-render
  // Value hanya berubah ketika user, token, atau loading berubah
  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  }), [user, token, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
