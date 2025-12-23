import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginAPI, getMe } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== LOGIN REAL =====
  const login = async (email, password) => {
    const res = await loginAPI({ email, password });

    const { token, user } = res.data;

    localStorage.setItem('token', token);

    setToken(token);
    setUser(user);

    return user; // penting untuk redirect berdasarkan role
  };

  // ===== LOGOUT =====
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // ===== RESTORE AUTH (AUTO LOGIN) =====
  const restoreAuth = async () => {
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
  };

  useEffect(() => {
    restoreAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
}
