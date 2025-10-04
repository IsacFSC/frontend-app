
'use client';
import { createContext, useContext, useEffect, useState } from "react";

const DarkThemeContext = createContext({
  dark: false,
  toggle: () => {},
});

export function useDarkTheme() {
  return useContext(DarkThemeContext);
}

export function DarkThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return (
    <DarkThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkThemeContext.Provider>
  );
}
