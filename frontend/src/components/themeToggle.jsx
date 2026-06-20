import React from 'react';
import { useTheme } from '../context/themeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Reusable animated theme toggle button using Framer Motion
 */
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9, rotate: 15 }}
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 text-slate-700 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-800/80 transition-colors focus:outline-none ${className}`}
      aria-label="Toggle Theme Mode"
      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Sun className="h-4.5 w-4.5 text-amber-400" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-indigo-600" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
