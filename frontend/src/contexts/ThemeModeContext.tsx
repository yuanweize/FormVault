import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeModeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  setColorMode: (mode: PaletteMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

interface ThemeModeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'formvault_theme_mode';

export const ThemeModeProvider: React.FC<ThemeModeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback in environments where localStorage or matchMedia is restricted
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore write errors
    }
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setColorMode = (newMode: PaletteMode) => {
    setMode(newMode);
  };

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
      setColorMode,
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export default ThemeModeProvider;
