import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import icon from "./assets/img/icons8-farol-30.png";
import { DarkThemeProvider, useDarkTheme } from "./dark-theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: icon.src,
  },
  title: "Gerenciador de Escalas -IEVV Musical",
  description: "Gerenciador de Escalas -IEVV Musical",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

function ThemeToggleButton() {
  const { dark, toggle } = useDarkTheme();
  return (
    <button
      onClick={toggle}
      style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}
      className="px-3 py-2 rounded bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 shadow hover:scale-105 transition"
      aria-label="Alternar tema escuro"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
