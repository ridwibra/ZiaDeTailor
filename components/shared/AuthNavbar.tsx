"use client";

import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Pacifico } from "next/font/google";
import { SITE_NAME } from "@/utils/constants";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
});

const AuthNavbar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = mounted && theme === "dark";

  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50
        flex items-center justify-between
        pr-10 pb-1
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-700
        transition-colors duration-300 
      "
    >
      {/* LEFT — logo + brand */}
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/images/logo.jpeg"
          alt="Logo"
          width={120}
          height={120}
          className="rounded-md"
          loading="eager"
          priority
        />

        <p
          className={`
            text-2xl md:text-3xl font-bold
            text-gray-900 dark:text-gray-100
            tracking-wide
            ${pacifico.className}
          `}
        >
          {SITE_NAME}
        </p>
      </Link>

      {/* RIGHT — theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="
          relative w-8 h-8
          flex items-center justify-center
          rounded-full
          bg-gray-100 dark:bg-gray-800
          shadow-sm
          transition-all duration-300
          hover:scale-105
        "
      >
        <Moon
          className={`
            absolute w-4 h-4 text-gray-700 dark:text-gray-300
            transition-all duration-300
            ${isDark ? "opacity-0 scale-0 -rotate-90" : "opacity-100 scale-100 rotate-0"}
          `}
        />

        <Sun
          className={`
            absolute w-4 h-4 text-gray-700 dark:text-gray-300
            transition-all duration-300
            ${isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 rotate-90"}
          `}
        />
      </button>
    </nav>
  );
};

export default AuthNavbar;
