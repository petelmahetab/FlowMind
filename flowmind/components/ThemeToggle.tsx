"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration fix — server pe theme pata nahi hoti
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-gray-600 shadow-sm text-yellow-500"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="Light"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-gray-600 shadow-sm text-indigo-500"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="Dark"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-200"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="System"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}