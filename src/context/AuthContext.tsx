"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { divisions, User, UserRole } from "@/types/models";
import { apiRequest } from "@/lib/api";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  mapRoleFromBackend,
  mapRoleToBackend,
  BackendRole,
} from "@/lib/mappings";
import {
  clearStoredAuthSession,
  migrateLegacyAuthSession,
  persistAuthSession,
  updateStoredAuthUser,
} from "@/lib/auth-storage";

interface BackendAuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  divisionId: number | null;
}

interface BackendSessionProfile {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  divisionId: number | null;
  department?: string;
  phone?: string;
  profession?: string;
}

type SessionUser = User & {
  userId?: number;
  backendDivisionId?: number | null;
};

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  divisionId: string;
  phone: string;
  profession?: string;
}

const ALLOWED_DIVISIONS = new Set(divisions.map((d) => d.id));

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatUserId(id: number): string {
  return `USR-${String(id).padStart(3, "0")}`;
}

function formatDivisionId(id: number | null | undefined): string | undefined {
  if (id == null) return undefined;
  return `DIV-${String(id).padStart(3, "0")}`;
}

function parseDivisionId(value: string): number | undefined {
  if (!ALLOWED_DIVISIONS.has(value)) return undefined;
  const matched = value.match(/DIV-(\d+)/i);
  if (!matched) return undefined;
  return Number(matched[1]);
}

function toAvatar(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toSessionUser(payload: BackendAuthResponse): SessionUser {
  return {
    id: formatUserId(payload.id),
    userId: payload.id,
    name: payload.name,
    email: payload.email,
    password: "",
    role: mapRoleFromBackend(payload.role),
    department: "",
    divisionId: formatDivisionId(payload.divisionId),
    backendDivisionId: payload.divisionId,
    phone: "",
    avatar: toAvatar(payload.name),
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function toSessionUserFromProfile(
  payload: BackendSessionProfile,
  fallback?: SessionUser,
): SessionUser {
  return {
    id: formatUserId(payload.id),
    userId: payload.id,
    name: payload.name,
    email: payload.email,
    password: "",
    role: mapRoleFromBackend(payload.role),
    department: payload.department || fallback?.department || "",
    divisionId: formatDivisionId(payload.divisionId),
    backendDivisionId: payload.divisionId,
    phone: payload.phone || fallback?.phone || "",
    avatar: toAvatar(payload.name),
    status: fallback?.status || "active",
    createdAt: fallback?.createdAt || new Date().toISOString().slice(0, 10),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSystemSettings();

  // Session timeout management
  useEffect(() => {
    if (!currentUser || !settings.sessionTimeout) return;

    const sessionDuration = settings.sessionTimeout * 60 * 60 * 1000; // Convert hours to milliseconds
    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime >= sessionDuration) {
          console.log('Session expired due to inactivity');
          logout();
          alert(`Your session has expired after ${settings.sessionTimeout} hours of inactivity. Please log in again.`);
        }
      }, sessionDuration);
    };

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser, settings.sessionTimeout]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const { user: storedUser } = migrateLegacyAuthSession();
      let fallbackUser: SessionUser | undefined;

      if (storedUser) {
        try {
          fallbackUser = JSON.parse(storedUser) as SessionUser;
        } catch {
          fallbackUser = undefined;
        }
      }

      try {
        // Source of truth is backend cookie session; this prevents stale role mismatches.
        const profile = await apiRequest<BackendSessionProfile>("/api/users/me");
        const sessionUser = toSessionUserFromProfile(profile, fallbackUser);
        setCurrentUser(sessionUser);
        persistAuthSession(sessionUser);
      } catch {
        setCurrentUser(null);
        clearStoredAuthSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = await apiRequest<BackendAuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const sessionUser = toSessionUser(payload);
      setCurrentUser(sessionUser);
      // Token is stored in httpOnly cookie by backend
      persistAuthSession(sessionUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid credentials. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      // Call backend to clear the cookie
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      clearStoredAuthSession();
    }
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const backendRole = mapRoleToBackend(data.role);
      const parsedDivisionId = parseDivisionId(data.divisionId);
      if (backendRole === "SUPERVISOR" && !parsedDivisionId) {
        return {
          success: false,
          error: "Please select one of the three divisions.",
        };
      }
      const payload = await apiRequest<BackendAuthResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: backendRole,
            divisionId: backendRole === "SUPERVISOR" ? parsedDivisionId : undefined,
            phone: data.phone,
            department: data.department,
            profession: backendRole === "PROFESSIONAL" ? data.profession : undefined,
          },
        },
      );
      const sessionUser = toSessionUser(payload);
      setCurrentUser(sessionUser);
      // Token is stored in httpOnly cookie by backend
      persistAuthSession(sessionUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      };
    }
  };

  const forgotPassword = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to process password reset request.",
      };
    }
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
    updateStoredAuthUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        register,
        forgotPassword,
        updateUser,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC1F1A]"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Return a safe default during SSR before providers hydrate
    return {
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => ({ success: false, error: "Not initialized" }),
      logout: () => {},
      register: async () => ({ success: false, error: "Not initialized" }),
      forgotPassword: async () => ({ success: false, error: "Not initialized" }),
      updateUser: () => {},
    } as AuthContextType;
  }
  return ctx;
}
