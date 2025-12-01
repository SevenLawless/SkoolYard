"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage, default to light mode if no preference saved
    const saved = localStorage.getItem("theme");
    const shouldBeDark = saved === "dark";
    
    setIsDark(shouldBeDark);
    document.documentElement.className = shouldBeDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">Toggle dark mode</span>
    </button>
  );
}
