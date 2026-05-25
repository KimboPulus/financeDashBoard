import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenKey } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem(tokenKey);
      } finally {
        setBooting(false);
      }
    }

    loadUser();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(tokenKey, data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(tokenKey, data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, booting, login, register, logout, isAuthed: Boolean(user) }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
