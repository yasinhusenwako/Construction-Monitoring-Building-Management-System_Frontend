"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster />
              {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
