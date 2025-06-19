import React, { createContext, useState, useContext, useEffect } from 'react';

// Define theme colors for each choice
export const themeColors = {
    1: {
        name: 'blue',
        primary: '#3498db',
        secondary: '#2980b9',
        light: '#74b9e7',
        text: '#fff',
        decoration: '#2574a9',
        hover: '#217dbb',
        border: '#5dade2',
        background: '#f3f9fd',
        cardBg: '#e8f4fc'
      },
      2: {
        name: 'pink',
        primary: '#e84393',
        secondary: '#d63031',
        light: '#f078b6',
        text: '#fff',
        decoration: '#c2185b',
        hover: '#e02c73',
        border: '#f8a5c2',
        background: '#fef6f9',
        cardBg: '#fde8f1'
      },
      3: {
        name: 'green',
        primary: '#2ecc71',
        secondary: '#27ae60',
        light: '#7ddeac',
        text: '#fff',
        decoration: '#1e8449',
        hover: '#25a25a',
        border: '#82e0aa',
        background: '#f4fcf6',
        cardBg: '#ebf7ef'
      },
      4: {
        name: 'purple',
        primary: '#9b59b6',
        secondary: '#8e44ad',
        light: '#c39bd3',
        text: '#fff',
        decoration: '#7d3c98',
        hover: '#8545a9',
        border: '#bb8fce',
        background: '#f9f5fb',
        cardBg: '#f2e6f7'
      },
      5: {
        name: 'orange',
        primary: '#ffb52b',
        secondary: '#e67e22',
        light: '#ffcb6b',
        text: '#fff',
        decoration: '#d35400',
        hover: '#f39c12',
        border: '#ffce81',
        background: '#fff9ef',
        cardBg: '#fff2db'
      }
    };
// Default theme
const DEFAULT_THEME = 5; // Orange

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeChoice, setThemeChoice] = useState(DEFAULT_THEME);

  useEffect(() => {
    // Try to load theme from localStorage on initial load
    const savedTheme = localStorage.getItem('themeChoice');
    if (savedTheme) {
      setThemeChoice(parseInt(savedTheme, 10));
    }
  }, []);

  const updateTheme = (choice) => {
    // Validate the choice is within available themes
    const validChoice = themeColors[choice] ? choice : DEFAULT_THEME;
    setThemeChoice(validChoice);
    localStorage.setItem('themeChoice', validChoice);
  };

  // Current theme based on the themeChoice
  const currentTheme = themeColors[themeChoice] || themeColors[DEFAULT_THEME];

  return (
    <ThemeContext.Provider value={{ themeChoice, currentTheme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);