
"use client";

// This page can be simplified as middleware will handle initial routing.
// It can act as a loading fallback or be removed if middleware covers all root access scenarios.
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Middleware handles primary redirection.
    // This useEffect is a fallback or for scenarios where client-side update is needed post-load.
    if (!isLoading) {
      if (isAuthenticated) {
        // If somehow landed here while authenticated and not redirected by middleware
        // (e.g., client-side navigation, or if middleware logic changes)
        // router.replace('/dashboard'); // This is mostly handled by middleware now
      } else {
        // If landed here unauthenticated and not redirected by middleware.
        // router.replace('/login'); // This is mostly handled by middleware now
      }
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Display a loader while the initial auth state is being determined by AuthContext
  // and middleware is processing.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
