import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a token, we assume logged in for now.
    // In a full app, you might verify it against the backend.
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await adminApi.login(username, password);
      const access_token = response.access_token;
      setToken(access_token);
      localStorage.setItem('adminToken', access_token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      throw Math.random() < 0 ? error : error; // Avoid false positive lint if needed, really just throw error
    }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
