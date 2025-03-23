import { useEffect, useState } from 'react';

// A simple hook to return different values based on color mode (light/dark)
export function useColorModeValue(lightValue: string, darkValue: string): string {
  const [value, setValue] = useState(lightValue);

  useEffect(() => {
    // Check if we can use matchMedia
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setValue(isDarkMode ? darkValue : lightValue);

      // Listen for changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setValue(e.matches ? darkValue : lightValue);
      };

      // Add listener
      mediaQuery.addEventListener('change', handleChange);

      // Clean up
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Default to light value if matchMedia not available
    return undefined;
  }, [lightValue, darkValue]);

  return value;
} 