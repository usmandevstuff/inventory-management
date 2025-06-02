
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter 
} from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user?: string, pass?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'threadcount_auth_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_KEY);
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const login = (user?: string, pass?: string) => {
    // Mock login: In a real app, call an API
    // For now, any username/password is fine
    if(user && pass){ // Basic check that some credentials were provided
      try {
        localStorage.setItem(AUTH_KEY, 'mock_token');
      } catch (error) {
         console.error("Failed to access localStorage:", error);
      }
      setIsAuthenticated(true);
      router.push('/dashboard');
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
    setIsAuthenticated(false);
    router.push('/login');
  };
  


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
