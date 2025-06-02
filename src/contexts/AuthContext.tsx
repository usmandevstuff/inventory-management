
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email?: string, pass?: string) => Promise<void>;
  signup: (email?: string, pass?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (event === 'SIGNED_IN') {
          // Forcing a router.refresh() might be needed if StoreContext depends on user for initial load.
          // router.refresh(); 
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
        toast({ title: "Login Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive"});
      console.error('Login error:', error.message);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const signup = async (email?: string, password?: string) => {
    if (!email || !password) {
        toast({ title: "Signup Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      // options: {
      //   // emailRedirectTo: `${window.location.origin}/auth/callback`, // If email confirmation is enabled
      // }
    });
    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive"});
      console.error('Signup error:', error.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      // This case might indicate that email confirmation is pending if enabled in Supabase.
      toast({ title: "Signup Successful", description: "Please check your email to confirm your account.", variant: "default"});
      router.push('/login'); // Or a page indicating to check email
    } else if (data.user) {
      toast({ title: "Signup Successful!", description: "You are now logged in.", variant: "default"});
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null); // Explicitly set user to null
    // onAuthStateChange will trigger redirect
    setIsLoading(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, signup, logout, isLoading }}>
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
