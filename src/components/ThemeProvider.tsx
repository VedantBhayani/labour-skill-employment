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

export const ThemeProvider = ({ 
  children,
  defaultTheme = "system" 
}: { 
  children: React.ReactNode;
  defaultTheme?: Theme;
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // Try to get the theme from localStorage first
      const storedTheme = localStorage.getItem("theme") as Theme;
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
        return storedTheme;
      }
    } catch (e) {
      console.error("Error reading theme from localStorage:", e);
    }
    
    // If not found or invalid, use default or system
    return defaultTheme;
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    try {
      const storedColor = localStorage.getItem("accentColor") as AccentColor;
      if (storedColor && (storedColor === "blue" || storedColor === "green" || storedColor === "purple" || storedColor === "orange")) {
        return storedColor;
      }
    } catch (e) {
      console.error("Error reading accent color from localStorage:", e);
    }
    return "blue";
  });

  // Apply theme immediately on mount and whenever theme changes
  useEffect(() => {
    const applyTheme = () => {
      try {
        localStorage.setItem("theme", theme);
        
        // Force light mode if black screen is detected (fallback)
        const forceLight = window.matchMedia && 
          window.matchMedia('(prefers-color-scheme: dark)').matches && 
          document.body.offsetHeight === 0;
          
        if (forceLight) {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.backgroundColor = "white";
          document.body.style.backgroundColor = "white";
          document.body.style.color = "black";
          return;
        }
        
        // Handle system theme preference
        if (theme === "system") {
          const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle("dark", isDark);
          document.documentElement.style.backgroundColor = isDark ? "" : "white";
          document.body.style.backgroundColor = isDark ? "" : "white";
        } else {
          document.documentElement.classList.toggle("dark", theme === "dark");
          document.documentElement.style.backgroundColor = theme === "dark" ? "" : "white";
          document.body.style.backgroundColor = theme === "dark" ? "" : "white";
        }
      } catch (error) {
        console.error("Error setting theme:", error);
        // Fallback to light theme in case of error
        document.documentElement.classList.remove("dark");
        document.documentElement.style.backgroundColor = "white";
        document.body.style.backgroundColor = "white";
        document.body.style.color = "black";
      }
    };
    
    // Apply theme immediately
    applyTheme();
    
    // Add listener for system theme changes if in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
        document.documentElement.style.backgroundColor = e.matches ? "" : "white";
        document.body.style.backgroundColor = e.matches ? "" : "white";
      };
      
      try {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      } catch (e) {
        // Legacy browser support
        mediaQuery.addListener(handleChange as any);
        return () => mediaQuery.removeListener(handleChange as any);
      }
    }
  }, [theme]);

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Error setting accent color:", error);
    }
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