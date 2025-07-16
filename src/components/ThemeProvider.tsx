import React, { createContext, useContext, ReactNode } from 'react';
import { Settings } from '../types/chat';

interface ThemeContextType {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  settings,
  updateSettings,
}) => {
  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};