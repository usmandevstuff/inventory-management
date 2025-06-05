
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  supabase: SupabaseClient;
  isAuthenticated: boolean;
  user: User | null;
  login: (email?: string, pass?: string) => Promise<void>;
  signup: (email?: string, pass?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext: useEffect for initial session and auth state change runs.");
    const getInitialSession = async () => {
      console.log("AuthContext: Attempting to get initial session.");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("AuthContext: Error getting initial session:", error.message);
      } else {
        console.log("AuthContext: Initial session fetched.", session ? `User: ${session.user.email}` : "No active session.");
      }
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("AuthContext: onAuthStateChange event:", event, "Session:", session ? `User: ${session.user.email}` : "No session");
        setUser(session?.user ?? null);
        setIsLoading(false); 
      }
    );

    return () => {
      console.log("AuthContext: Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email?: string, password?: string): Promise<void> => {
    if (!email || !password) {
        toast({ title: "Login Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    console.log("AuthContext: Attempting login for:", email);
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive"});
      console.error('AuthContext: Login error:', error.message, error);
    } else if (data && data.session) {
      console.log('AuthContext: Login successful (client-side Supabase response):', data.session.user?.email);
      // setUser(data.session.user); // This will be handled by onAuthStateChange
      toast({ title: "Login Succeeded (Client)", description: "Redirecting to dashboard...", duration: 3000 });
      
      // Critical: Allow onAuthStateChange to fire and update state, then force reload.
      // The cookie should be set by Supabase client at this point.
      // A full page reload ensures the server (and middleware) gets the new cookie.
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = '/dashboard';
        }
      }, 100); // Short delay to ensure state updates can propagate if needed by onAuthStateChange

    } else {
      toast({ title: "Login Ambiguous", description: "Login did not return an error or a session.", variant: "destructive"});
      console.error('AuthContext: Login ambiguous: No error, no session. Data:', data);
    }
  };

  const signup = async (email?: string, password?: string) => {
    if (!email || !password) {
        toast({ title: "Signup Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    console.log("AuthContext: Attempting signup for:", email);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined, 
      }
    });

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive"});
      console.error('AuthContext: Signup error:', error.message);
    } else if (data.user) {
        toast({ 
          title: "Signup Successful!", 
          description: "Please check your email to verify your account if required by your settings.",
          duration: 10000 
        });
      // User state will be updated by onAuthStateChange
      router.refresh(); // Refresh to potentially trigger middleware if on a page like /login
    }
  };

  const logout = async () => {
    console.log("AuthContext: Attempting logout.");
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
        console.error('AuthContext: Logout error:', error.message);
    } else {
      console.log("AuthContext: Logout successful. Client session cleared.");
      // User state will be set to null by onAuthStateChange
      // router.push('/login'); // Ensure navigation happens after state update
      if (typeof window !== "undefined") {
        window.location.href = '/login'; // Force reload to login ensures middleware re-evaluates
      }
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/settings?view=update_password` : undefined, 
    });
    if (error) {
      toast({ title: "Password Reset Failed", description: error.message, variant: "destructive"});
    } else {
      toast({ title: "Password Reset Email Sent", description: "Check your email for a link to reset your password."});
    }
  };

  const updateUserEmail = async (newEmail: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ title: "Email Update Failed", description: error.message, variant: "destructive"});
      return false;
    }
    toast({ title: "Email Update Initiated", description: "Please check both your old and new email addresses for confirmation links.", duration: 10000 });
    router.refresh();
    return true;
  };
  
  const updateUserPassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Password Update Failed", description: error.message, variant: "destructive"});
      return false;
    }
    toast({ title: "Password Updated Successfully", description: "Your password has been changed."});
    router.refresh();
    return true;
  };
  
  return (
    <AuthContext.Provider value={{ 
        supabase, 
        isAuthenticated: !!user && !isLoading, 
        user, 
        login, 
        signup, 
        logout, 
        sendPasswordResetEmail,
        updateUserEmail,
        updateUserPassword,
        isLoading 
    }}>
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
