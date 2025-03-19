import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type AccentColor = "blue" | "green" | "purple" | "orange";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage first
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme) return storedTheme;
    
    // If not found, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    return "light";
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const storedColor = localStorage.getItem("accentColor") as AccentColor;
    return storedColor || "blue";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    
    // Handle system theme preference
    if (theme === "system") {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    
    // Add listener for system theme changes if in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("accentColor", accentColor);
    
    // Remove any existing accent color classes
    document.documentElement.classList.remove(
      "accent-blue",
      "accent-green",
      "accent-purple",
      "accent-orange"
    );
    
    // Add the new accent color class
    document.documentElement.classList.add(`accent-${accentColor}`);
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}; 