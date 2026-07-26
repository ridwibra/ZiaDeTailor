"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-gray-100 dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-300
      "
    >
      {/* Moon Icon */}
      <Moon
        size={16}
        className="
          text-gray-700 dark:text-gray-400
          transition-all duration-300
          absolute
          opacity-100 scale-100 rotate-0
          dark:opacity-0 dark:scale-0 dark:-rotate-90
        "
      />

      {/* Sun Icon */}
      <Sun
        size={16}
        className="
          text-yellow-500 dark:text-yellow-300
          transition-all duration-300
          absolute
          opacity-0 scale-0 rotate-90
          dark:opacity-100 dark:scale-100 dark:rotate-0
        "
      />
    </button>
  );
}
