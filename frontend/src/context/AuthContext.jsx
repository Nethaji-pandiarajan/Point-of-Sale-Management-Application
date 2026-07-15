import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchFromApi } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize Auth state from Storage on load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('saleiz_token') || sessionStorage.getItem('saleiz_token');
        const storedUser = localStorage.getItem('saleiz_user') || sessionStorage.getItem('saleiz_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to parse stored auth session:', err);
        // Clear corrupt storage
        localStorage.removeItem('saleiz_token');
        localStorage.removeItem('saleiz_user');
        sessionStorage.removeItem('saleiz_token');
        sessionStorage.removeItem('saleiz_user');
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    setAuthLoading(true);
    try {
      const response = await fetchFromApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const { token: apiToken, user: apiUser } = response;

      if (!apiToken || !apiUser) {
        throw new Error('Invalid server authentication response');
      }

      setToken(apiToken);
      setUser(apiUser);

      // Save session based on Remember Me choice
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('saleiz_token', apiToken);
      storage.setItem('saleiz_user', JSON.stringify(apiUser));

      return apiUser;
    } catch (error) {
      console.error('Login action failure:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear state
    setToken(null);
    setUser(null);

    // Clear all storage locations
    localStorage.removeItem('saleiz_token');
    localStorage.removeItem('saleiz_user');
    sessionStorage.removeItem('saleiz_token');
    sessionStorage.removeItem('saleiz_user');
  }, []);

  const isAuthenticated = useMemo(() => !!token, [token]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    authLoading,
    login,
    logout
  }), [user, token, isAuthenticated, authLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!authLoading && children}
    </AuthContext.Provider>
  );
};
