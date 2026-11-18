import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'paper', label: 'Warm Paper', mode: 'light', desc: 'Zero-glare warm alabaster' },
  { id: 'daylight', label: 'Crisp Daylight', mode: 'light', desc: 'High-clarity neutral studio' },
  { id: 'obsidian', label: 'Geist Obsidian', mode: 'dark', desc: 'Pure achromatic matte carbon' },
  { id: 'graphite', label: 'Graphite Slate', mode: 'dark', desc: 'Eye-care low-contrast charcoal' },
];

const ThemeContext = createContext(null);

function getInitialTheme() {
  const saved = localStorage.getItem('chronos_theme');
  if (saved && THEMES.some(t => t.id === saved)) {
    return saved;
  }
  // Circadian default: daytime 07:00-19:00 uses paper, evening uses obsidian
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 19) {
    return 'paper';
  }
  // Check OS dark mode preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'obsidian';
  }
  return 'paper';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chronos_theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (THEMES.some(t => t.id === newTheme)) {
      setThemeState(newTheme);
    }
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setThemeState(THEMES[nextIndex].id);
  };

  const currentThemeMeta = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, currentThemeMeta, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

