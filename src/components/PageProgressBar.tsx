// src/components/PageProgressBar.tsx
"use client";

import NProgress from 'nprogress';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PageProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress (e.g., hide spinner)
    // Ensure this runs only once or is idempotent
    NProgress.configure({ showSpinner: false });
  }, []);

  useEffect(() => {
    // Finish any existing progress when the effect runs for a new path
    NProgress.done();
    // Start progress for the new route
    NProgress.start();

    // Cleanup function: ensure progress is finished when component unmounts
    // or before the effect runs for the next path change.
    return () => {
      NProgress.done();
    };
  }, [pathname, searchParams]); // Re-run effect when path or search params change

  return null; // This component does not render anything itself
}
