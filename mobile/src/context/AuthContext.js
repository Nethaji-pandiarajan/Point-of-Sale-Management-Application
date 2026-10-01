import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { setAuthToken, setOnUnauthorized } from '../api/apiClient';
import { tokenStorage } from '../api/tokenStorage';
import { tableApi } from '../api/tableApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Clear auth state and storage
  const logout = useCallback(async () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    await tokenStorage.clearAll();
    await authApi.logout();
  }, []);

  // Listen for 401 Unauthorized from any API request
  useEffect(() => {
    setOnUnauthorized((errorMsg) => {
      console.warn('[AuthContext] 401 Unauthorized from backend, resetting session:', errorMsg);
      logout();
    });
  }, [logout]);

  // Restore and validate session on app startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await tokenStorage.getToken();
        const storedUser = await tokenStorage.getUser();

        if (storedToken && storedUser) {
          // Temporarily attach token for verification
          setAuthToken(storedToken);

          // Verify token against backend with real request
          try {
            const profileRes = await authApi.getProfile();
            const freshUser = (profileRes && profileRes.user) ? { ...storedUser, ...profileRes.user } : storedUser;
            if (isMounted) {
              setTokenState(storedToken);
              setUser({
                ...freshUser,
                shift: freshUser.shift || 'Dinner (5:00 PM – 11:30 PM)',
                floor: freshUser.floor || 'Floor A',
              });
              await tokenStorage.setUser(freshUser);
            }
          } catch (verifyErr) {
            if (verifyErr.status === 401) {
              console.warn('[AuthContext] Stored token invalid or expired. Prompting login.');
              await tokenStorage.clearAll();
              setAuthToken(null);
              if (isMounted) {
                setTokenState(null);
                setUser(null);
              }
            } else {
              // Network error or server temporarily unreachable - preserve session
              if (isMounted) {
                setTokenState(storedToken);
                setUser(storedUser);
              }
            }
          }
        } else {
          // No stored credentials
          setAuthToken(null);
          if (isMounted) {
            setTokenState(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Error during session restoration:', err.message);
        await tokenStorage.clearAll();
        setAuthToken(null);
        if (isMounted) {
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      if (res && res.token && res.user) {
        const userData = {
          ...res.user,
          shift: 'Dinner (5:00 PM – 11:30 PM)',
          floor: 'Floor A',
        };

        // Persist token and user in storage
        await tokenStorage.setToken(res.token);
        await tokenStorage.setUser(userData);

        setAuthToken(res.token);
        setTokenState(res.token);
        setUser(userData);

        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      console.warn('[AuthContext] Login failed:', err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        shift: user ? user.shift : 'Shift Active',
        floor: user ? user.floor : 'Floor A',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
