"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { authAPI, initSanctum } from "~/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  address?: string;
  phone?: string;
  nationality?: string;
  picture?: string;
  status?: "active" | "inactive";
  identity_card_type?: "passport" | "id_card" | "other";
  identity_card?: string;
  id_card_number?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.data);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      window.location.href = "/auth/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initSanctum();
        await refreshUser();
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
