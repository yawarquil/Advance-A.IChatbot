import { useEffect } from 'react';
import { Settings } from '../types/chat';

export const useTheme = (settings: Settings) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-purple');
    
    // Add current theme class
    root.classList.add(`theme-${settings.theme}`);
    
    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        light: '#ffffff',
        dark: '#1f2937',
        blue: '#1e40af',
        purple: '#7c3aed',
      };
      metaThemeColor.setAttribute('content', colors[settings.theme]);
    }
  }, [settings.theme]);
};