import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    // Safely initialize from local storage
    try {
      const saved = localStorage.getItem('userInfo');
      if (!saved || saved === 'undefined') return null;
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to parse user info from local storage:', error);
      localStorage.removeItem('userInfo');
      return null;
    }
  });

  const login = (userData) => {
    setUserInfo(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const logout = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
