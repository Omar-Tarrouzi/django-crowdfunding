import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8000';  // Ajustez selon votre configuration
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios interceptor for token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('AuthContext - Token set in axios headers:', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('AuthContext - No token found, removed from axios headers');
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      console.log('AuthContext - Found token, fetching user info...');
      fetchUserInfo();
    } else {
      console.log('AuthContext - No token found, skipping user info fetch');
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      console.log('AuthContext - Fetching user info...');
      const token = localStorage.getItem('token');
      console.log('AuthContext - Using token:', token);
      
      const response = await axios.get('/api/auth/user/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('AuthContext - User info response:', response.data);
      
      // Ensure the role is properly set
      const userData = {
        ...response.data,
        role: response.data.role?.toLowerCase() // Normalize role to lowercase
      };
      
      console.log('AuthContext - Setting user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext - Error fetching user info:', error);
      console.error('AuthContext - Error details:', error.response?.data);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // After successful login, dispatch a custom event
  const login = (userData, token) => {
    setUser(userData);
    if (token) localStorage.setItem('token', token);
    // Dispatch a custom event to notify header and other components
    window.dispatchEvent(new Event('login'));
  };

  // After logout, dispatch a custom event
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('logout'));
  };

  // On mount, check for token and fetch user if needed
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      // Fetch user info from backend if token exists
      fetch('http://localhost:8000/api/user/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.username) {
            setUser(data);
            window.dispatchEvent(new Event('login'));
          }
        });
    }
  }, [user]);

  // Debug effect to log user state changes
  useEffect(() => {
    console.log('AuthContext - User state changed:', user);
  }, [user]);

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};