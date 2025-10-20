import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme] = useState('dark'); // Force dark theme only

  useEffect(() => {
    // Always set to dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('pos_theme', 'dark');
  }, []);

  const value = {
    theme: 'dark',
    setTheme: () => {}, // No-op function
    toggleTheme: () => {}, // No-op function
    isDark: true // Always true
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};