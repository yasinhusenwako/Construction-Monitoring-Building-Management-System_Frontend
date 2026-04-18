"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types/models";
import { apiRequest } from "@/lib/api";
import {
  clearStoredAuthSession,
  getStoredAuthToken,
  migrateLegacyAuthSession,
  persistAuthSession,
  updateStoredAuthUser,
} from "@/lib/auth-storage";

type BackendRole = "ADMIN" | "USER" | "SUPERVISOR" | "PROFESSIONAL";

interface BackendAuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  divisionId: number | null;
}

type SessionUser = User & {
  userId?: number;
  backendDivisionId?: number | null;
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
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
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapRoleFromBackend(role: BackendRole): UserRole {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "SUPERVISOR":
      return "supervisor";
    case "PROFESSIONAL":
      return "professional";
    default:
      return "user";
  }
}

function mapRoleToBackend(role: UserRole): BackendRole {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "supervisor":
      return "SUPERVISOR";
    case "professional":
      return "PROFESSIONAL";
    default:
      return "USER";
  }
}

function formatUserId(id: number): string {
  return `USR-${String(id).padStart(3, "0")}`;
}

function formatDivisionId(id: number | null | undefined): string | undefined {
  if (id == null) return undefined;
  return `DIV-${String(id).padStart(3, "0")}`;
}

function parseDivisionId(value: string): number | undefined {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { user: storedUser } = migrateLegacyAuthSession();
    const token = getStoredAuthToken();

    if (!storedUser || !token) {
      clearStoredAuthSession();
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as SessionUser;
      setCurrentUser(parsed);
    } catch {
      clearStoredAuthSession();
    }
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
      persistAuthSession(sessionUser, payload.token);
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

  const logout = () => {
    setCurrentUser(null);
    clearStoredAuthSession();
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const backendRole = mapRoleToBackend(data.role);
      const payload = await apiRequest<BackendAuthResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: backendRole,
            divisionId:
              backendRole === "SUPERVISOR" || backendRole === "PROFESSIONAL"
                ? (parseDivisionId(data.department) ?? 1)
                : undefined,
          },
        },
      );
      const sessionUser = toSessionUser(payload);
      setCurrentUser(sessionUser);
      persistAuthSession(sessionUser, payload.token);
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
        login,
        logout,
        register,
        forgotPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
