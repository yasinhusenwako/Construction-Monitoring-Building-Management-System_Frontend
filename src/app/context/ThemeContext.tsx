'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Theme Context - Dark Mode Management
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides theme switching functionality using next-themes
 * - Persists theme preference to localStorage
 * - Supports system preference detection
 * - Smooth transitions between light/dark modes
 * - INSA color palette optimized for both themes
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="insa-buildms-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
