
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client'; // Updated client
import type { AuthChangeEvent, Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  supabase: SupabaseClient; // Expose the client
  isAuthenticated: boolean;
  user: User | null;
  login: (email?: string, pass?: string) => Promise<void>;
  signup: (email?: string, pass?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean; // Indicates if the initial session check is ongoing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Memoize the Supabase client creation to ensure it's only created once.
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial session is checked
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setIsLoading(false); // Update loading state on any auth change
        
        if (event === 'SIGNED_IN') {
          // If login was successful and onAuthStateChange picked it up,
          // router.refresh() should have already been called by the login function.
          // The middleware would then handle redirection.
          // We can add an extra refresh here if needed, but it might be redundant.
          // router.refresh(); 
        } else if (event === 'SIGNED_OUT') {
          // router.refresh(); // Ensure middleware re-evaluates after sign out
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const login = async (email?: string, password?: string): Promise<void> => {
    if (!email || !password) {
        toast({ title: "Login Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    console.log("Attempting login for:", email); // Browser console log
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive"});
      console.error('Login error:', error.message, error); // Log the full error object
    } else if (data && data.session) {
      // Successful login according to Supabase client
      console.log('Login successful (client-side):', data.session.user?.email); // Browser console log
      // The onAuthStateChange listener will/should update the user state.
      // Router.refresh() will trigger middleware to read the new session cookie and redirect.
      toast({ title: "Login Succeeded (Client)", description: "Refreshing session...", variant: "default", duration: 3000 }); // Temporary feedback
      router.refresh(); // This is crucial for middleware to pick up the new session
    } else {
      // This case should ideally not happen if there's no error and no session.
      toast({ title: "Login Ambiguous", description: "Login did not return an error or a session.", variant: "destructive"});
      console.error('Login ambiguous: No error, no session. Data:', data);
    }
  };

  const signup = async (email?: string, password?: string) => {
    if (!email || !password) {
        toast({ title: "Signup Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, 
      }
    });

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive"});
      console.error('Signup error:', error.message);
    } else if (data.user) {
        toast({ 
          title: "Signup Successful!", 
          description: "Please check your email to verify your account if required by your settings.",
          variant: "default",
          duration: 10000 
        });
      router.refresh();
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
        console.error('Logout error:', error.message);
    }
    // setUser(null); // onAuthStateChange will handle this
    router.refresh(); 
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings?view=update_password`, 
    });
    if (error) {
      toast({ title: "Password Reset Failed", description: error.message, variant: "destructive"});
      console.error('Password Reset error:', error.message);
    } else {
      toast({ title: "Password Reset Email Sent", description: "Check your email for a link to reset your password.", variant: "default"});
    }
  };

  const updateUserEmail = async (newEmail: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ title: "Email Update Failed", description: error.message, variant: "destructive"});
      console.error('Email Update error:', error.message);
      return false;
    }
    toast({ title: "Email Update Initiated", description: "Please check both your old and new email addresses for confirmation links.", variant: "default", duration: 10000 });
    router.refresh();
    return true;
  };
  
  const updateUserPassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Password Update Failed", description: error.message, variant: "destructive"});
      console.error('Password Update error:', error.message);
      return false;
    }
    toast({ title: "Password Updated Successfully", description: "Your password has been changed.", variant: "default"});
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

