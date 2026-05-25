/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginAPI, getMe } from '@/features/auth/authService';
import { setOnUnauthorized } from '@/shared/api/apiService';
import { isTokenExpired, getTokenRemainingMs } from '@/shared/utils/token';

const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  // Auto-logout 30 seconds before the token actually expires
  const EXPIRY_BUFFER_MS = 30_000;
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const expiryTimerRef = useRef(null);

  // ===== AUTO-LOGOUT TIMER =====
  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  // ===== LOGOUT =====
  // Memoized dengan useCallback agar reference stabil
  const logout = useCallback(() => {
    clearExpiryTimer();
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/login', { replace: true });
  }, [navigate, clearExpiryTimer]);

  const scheduleAutoLogout = useCallback((jwt) => {
    clearExpiryTimer();
    const remaining = getTokenRemainingMs(jwt) - EXPIRY_BUFFER_MS;
    if (remaining <= 0) {
      logout();
      return;
    }
    expiryTimerRef.current = setTimeout(() => {
      logout();
    }, remaining);
  }, [clearExpiryTimer, logout]);

  // ===== LOGIN REAL =====
  // Memoized dengan useCallback agar reference stabil
  const login = useCallback(async (email, password) => {
    const res = await loginAPI({ email, password });

    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(newUser);
    scheduleAutoLogout(newToken);

    return newUser; // penting untuk redirect berdasarkan role
  }, [scheduleAutoLogout]);

  // Register logout handler for 401 interceptor (runs once on mount + when logout changes)
  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  // ===== RESTORE AUTH (AUTO LOGIN) =====
  const restoreAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken || isTokenExpired(storedToken)) {
      localStorage.removeItem('token');
      setLoading(false);
      return;
    }

    try {
      // _skipAuthRedirect prevents the 401 interceptor from showing a toast
      // and triggering navigate during silent restore
      const res = await getMe({ _skipAuthRedirect: true });
      setUser(res.data);
      setToken(storedToken);
      scheduleAutoLogout(storedToken);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [scheduleAutoLogout]);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  // Cleanup expiry timer on unmount
  useEffect(() => {
    return () => clearExpiryTimer();
  }, [clearExpiryTimer]);

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
