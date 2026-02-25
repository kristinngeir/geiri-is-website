"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    if (value === "light" || value === "dark") return value;
    return null;
  } catch {
    return null;
  }
}

function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
}

function getIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function setIsDark(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = getStoredTheme();
    if (stored) return stored;
    return getIsDark() ? "dark" : "light";
  });

  useEffect(() => {
    if (!theme) return;
    setIsDark(theme === "dark");
  }, [theme]);

  if (!theme) return null;

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const isDark = nextTheme === "dark";
        setIsDark(isDark);
        setStoredTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:text-zinc-200 dark:hover:bg-white/5"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
