
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your .env.local file (and Vercel/other hosting)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

// This function is intended to be called ONCE per application lifecycle,
// ideally in a context or a top-level component.
// If you need to create a client in multiple places, consider memoization or a singleton pattern.
export function createClientComponentClient(): SupabaseClient {
  return createBrowserClient(
    supabaseUrl!, // Assert non-null because we checked above
    supabaseAnonKey! // Assert non-null
  );
}
