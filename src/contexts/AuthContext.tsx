
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
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<boolean>;
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
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoading(false);
        if (event === 'SIGNED_IN') {
          // router.refresh(); 
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'USER_UPDATED') {
          // User's email might have changed, or other attributes
          setUser(currentUser); // Ensure local state is up-to-date
        } else if (event === 'PASSWORD_RECOVERY') {
          // This event fires when user lands on the password recovery URL.
          // You might want to redirect them to a password reset form.
          // For now, we handle password reset initiation from the settings page.
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
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`, // Or a specific welcome/pending verification page
      }
    });

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive"});
      console.error('Signup error:', error.message);
    } else if (data.user) {
      if (data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at) {
        toast({ 
          title: "Signup Successful!", 
          description: "Please check your email to verify your account before logging in.",
          variant: "default",
          duration: 10000 // Longer duration for this important message
        });
        router.push('/login'); // Stay on login or redirect to a "check your email" page
      } else if (data.user.email_confirmed_at) { // Auto-confirmed or verification not required
         toast({ title: "Signup Successful!", description: "You are now logged in.", variant: "default"});
         // signInWithPassword might be needed if session is not automatically created by signUp in some Supabase configs
         // For now, assuming onAuthStateChange handles session creation or user is redirected to login.
         // If Supabase auto-signs-in after signup and email confirmation is off, this branch would be hit.
         router.push('/dashboard'); // Or let onAuthStateChange handle it.
      } else {
         toast({ 
          title: "Signup Almost Complete!", 
          description: "Please check your email for a verification link.",
          variant: "default",
          duration: 10000
        });
        router.push('/login');
      }
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
        console.error('Logout error:', error.message);
    }
    setUser(null); 
    // onAuthStateChange will trigger redirect to /login
    setIsLoading(false);
  };

  const sendPasswordResetEmail = async (email: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`, // A page you create to handle the actual password update
    });
    if (error) {
      toast({ title: "Password Reset Failed", description: error.message, variant: "destructive"});
      console.error('Password Reset error:', error.message);
    } else {
      toast({ title: "Password Reset Email Sent", description: "Check your email for a link to reset your password.", variant: "default"});
    }
    setIsLoading(false);
  };

  const updateUserEmail = async (newEmail: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    // Supabase handles sending confirmation to both old and new email addresses.
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ title: "Email Update Failed", description: error.message, variant: "destructive"});
      console.error('Email Update error:', error.message);
      setIsLoading(false);
      return false;
    }
    toast({ title: "Email Update Initiated", description: "Please check your new email address for a confirmation link. You may also need to confirm from your old email address.", variant: "default", duration: 10000 });
    // User object might not update immediately here, onAuthStateChange with 'USER_UPDATED' event will handle it.
    setIsLoading(false);
    return true;
  };
  
  const updateUserPassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Password Update Failed", description: error.message, variant: "destructive"});
      console.error('Password Update error:', error.message);
      setIsLoading(false);
      return false;
    }
    toast({ title: "Password Updated Successfully", description: "Your password has been changed.", variant: "default"});
    setIsLoading(false);
    return true;
  };
  
  return (
    <AuthContext.Provider value={{ 
        isAuthenticated: !!user, 
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

