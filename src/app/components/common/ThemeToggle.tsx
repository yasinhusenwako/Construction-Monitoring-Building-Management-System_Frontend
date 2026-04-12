'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Theme Toggle Component
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides a button to switch between light, dark, and system themes
 * - Shows current theme icon
 * - Smooth transitions with INSA color styling
 * - Persists preference to localStorage
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
        <Sun size={18} className="text-[#1A3580] dark:text-[#F5B800]" />
      </button>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg hover:bg-secondary transition-colors group relative"
      title={`Current: ${theme} (${currentTheme}) - Click to switch`}
    >
      {theme === 'light' && (
        <Sun size={18} className="text-[#1A3580] dark:text-[#F5B800] transition-colors" />
      )}
      {theme === 'dark' && (
        <Moon size={18} className="text-[#1A3580] dark:text-[#F5B800] transition-colors" />
      )}
      {theme === 'system' && (
        <Monitor size={18} className="text-[#1A3580] dark:text-[#F5B800] transition-colors" />
      )}
    </button>
  );
}
