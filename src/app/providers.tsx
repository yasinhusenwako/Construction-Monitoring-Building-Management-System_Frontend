"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { KeycloakAuthProvider } from "@/contexts/KeycloakAuthContext";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { DynamicMetadata } from "@/components/common/DynamicMetadata";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <SystemSettingsProvider>
            <DynamicMetadata />
            <KeycloakAuthProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <Toaster />
            </KeycloakAuthProvider>
          </SystemSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
