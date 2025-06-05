
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface UserProfileUpdateData {
  fullName?: string;
  storeName?: string;
}

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
  updateUserProfile: (data: UserProfileUpdateData) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useMemo(() => {
    console.log("AuthContext: Initializing Supabase client via useMemo.");
    return createClientComponentClient();
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext: useEffect for initial session and auth state change runs.");
    const getInitialSession = async () => {
      console.log("AuthContext: Attempting to get initial session.");
      if (!supabase) {
        console.error("AuthContext: Supabase client not initialized in getInitialSession.");
        setIsLoading(false);
        return;
      }
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

    if (!supabase) {
      console.error("AuthContext: Supabase client not available for onAuthStateChange listener setup.");
      return;
    }
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("AuthContext: onAuthStateChange event:", event, "Session:", session ? `User: ${session.user.email}, Metadata: ${JSON.stringify(session.user.user_metadata)}` : "No session");
        setUser(session?.user ?? null);
        if (isLoading) setIsLoading(false);
      }
    );

    return () => {
      console.log("AuthContext: Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, isLoading]);

  const login = async (email?: string, password?: string): Promise<void> => {
    if (!supabase) {
        console.error("AuthContext: Supabase client not available for login.");
        toast({ title: "Login Failed", description: "Supabase client not initialized.", variant: "destructive"});
        return;
    }
    if (!email || !password) {
        toast({ title: "Login Failed", description: "Email and password are required.", variant: "destructive"});
        return;
    }
    console.log("AuthContext: Attempting login for:", email);
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    

    if (error) {
      setIsLoading(false);
      toast({ title: "Login Failed", description: error.message, variant: "destructive"});
      console.error('AuthContext: Login error:', error.message, 'Full error object:', error);
    } else if (data && data.session) {
      console.log('AuthContext: Login successful (client-side Supabase response). User:', data.session.user?.email);
      console.log('AuthContext: Full session data from signInWithPassword:', data.session);
      console.log('AuthContext: Full user data from signInWithPassword:', data.user);
      // setUser will be updated by onAuthStateChange. This line ensures isLoading is false.
      setIsLoading(false); 
      toast({ title: "Login Succeeded (Client)", description: "Redirecting to dashboard...", duration: 3000 });
      
      // Allow onAuthStateChange to process before forced navigation
      setTimeout(() => {
        console.log("AuthContext: Post-login attempt, current document.cookie (may not show HttpOnly auth tokens):", document.cookie);
        if (typeof window !== "undefined") {
          console.log("AuthContext: Forcing redirect to /dashboard via window.location.href");
          window.location.href = '/dashboard'; 
        }
      }, 100);

    } else {
      setIsLoading(false);
      toast({ title: "Login Ambiguous", description: "Login did not return an error or a session. Check console.", variant: "destructive"});
      console.error('AuthContext: Login ambiguous. No error, but no session/user data returned. Full response data:', data);
    }
  };

  const signup = async (email?: string, password?: string) => {
    if (!supabase) {
        console.error("AuthContext: Supabase client not available for signup.");
        toast({ title: "Signup Failed", description: "Supabase client not initialized.", variant: "destructive"});
        return;
    }
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
      router.refresh();
    } else {
      console.warn("AuthContext: Signup response did not contain user data but no error. Data:", data)
      toast({
          title: "Signup Response Incomplete",
          description: "Signup process completed without error, but user data was not immediately available. If email verification is required, please check your email.",
          duration: 10000
      });
    }
  };

  const logout = async () => {
    if (!supabase) {
        console.error("AuthContext: Supabase client not available for logout.");
        toast({ title: "Logout Failed", description: "Supabase client not initialized.", variant: "destructive"});
        return;
    }
    console.log("AuthContext: Attempting logout.");
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
        console.error('AuthContext: Logout error:', error.message);
    } else {
      console.log("AuthContext: Logout successful. Client session cleared.");
      if (typeof window !== "undefined") {
        console.log("AuthContext: Forcing redirect to /login via window.location.href after logout.");
        window.location.href = '/login'; 
      }
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    if (!supabase) {
        console.error("AuthContext: Supabase client not available for password reset.");
        toast({ title: "Password Reset Failed", description: "Supabase client not initialized.", variant: "destructive"});
        return;
    }
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
    if (!supabase || !user) {
      console.error("AuthContext: Supabase client or user not available for email update.");
      toast({ title: "Email Update Failed", description: "Client or user not available.", variant: "destructive"});
      return false;
    }
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
    if (!supabase || !user) {
      console.error("AuthContext: Supabase client or user not available for password update.");
      toast({ title: "Password Update Failed", description: "Client or user not available.", variant: "destructive"});
      return false;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Password Update Failed", description: error.message, variant: "destructive"});
      return false;
    }
    toast({ title: "Password Updated Successfully", description: "Your password has been changed."});
    router.refresh(); 
    return true;
  };

  const updateUserProfile = async (profileData: UserProfileUpdateData): Promise<boolean> => {
    if (!supabase || !user) {
      console.error("AuthContext: Supabase client or user not available for profile update.");
      toast({ title: "Profile Update Failed", description: "Client or user not available.", variant: "destructive" });
      return false;
    }

    const updateData: { full_name?: string; store_name?: string } = {};
    if (profileData.fullName !== undefined) {
      updateData.full_name = profileData.fullName;
    }
    if (profileData.storeName !== undefined) {
      updateData.store_name = profileData.storeName;
    }

    if (Object.keys(updateData).length === 0) {
      toast({ title: "No Changes", description: "No profile information was provided to update." });
      return true; // No actual update needed
    }

    const { data, error } = await supabase.auth.updateUser({ data: updateData });

    if (error) {
      toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
      console.error('AuthContext: Profile update error:', error.message);
      return false;
    }
    
    // Manually update the local user state's metadata immediately
    // because onAuthStateChange might be slow or not granular enough for metadata-only updates
    if (data.user) {
        setUser(prevUser => prevUser ? ({
            ...prevUser,
            user_metadata: {
                ...prevUser.user_metadata,
                ...updateData // merge the new data
            }
        }) : null);
    }


    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    // router.refresh(); // Refresh to reflect changes in server components if necessary
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
        updateUserProfile,
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
