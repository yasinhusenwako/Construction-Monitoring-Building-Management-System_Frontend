'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers, User, UserRole } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem('insa_user');
    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);
        // Always re-hydrate from mockUsers to pick up fresh fields (e.g. divisionId)
        const fresh = mockUsers.find(u => u.id === parsed.id) || parsed;
        setCurrentUser(fresh);
        sessionStorage.setItem('insa_user', JSON.stringify(fresh));
      } catch {
        sessionStorage.removeItem('insa_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 800)); // simulate network delay

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (user.status === 'locked') {
      return { success: false, error: 'Your account has been locked. Contact administrator.' };
    }
    if (user.status === 'inactive') {
      return { success: false, error: 'Your account is inactive. Contact administrator.' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(user);
    sessionStorage.setItem('insa_user', JSON.stringify(user));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('insa_user');
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 800));

    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      department: data.department,
      phone: data.phone,
      avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    sessionStorage.setItem('insa_user', JSON.stringify(newUser));
    return { success: true };
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('insa_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
