"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("tt_theme");
    const isDark = 
      savedTheme === "dark" || 
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tt_theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tt_theme", "dark");
      setTheme("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-md active:scale-95 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-400" />
      )}
    </button>
  );
}
