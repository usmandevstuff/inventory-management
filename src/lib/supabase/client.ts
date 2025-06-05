
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your .env.local file (and Vercel/other hosting)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced logging for debugging
console.log('[Supabase Client Init] Attempting to load Supabase environment variables.');
console.log('[Supabase Client Init] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('[Supabase Client Init] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '******** (loaded)' : undefined);


if (!supabaseUrl) {
  console.error("CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL in client.ts. Supabase client cannot be initialized.");
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey) {
  console.error("CRITICAL: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in client.ts. Supabase client cannot be initialized.");
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

// This function is intended to be called ONCE per application lifecycle,
// ideally in a context or a top-level component.
export function createClientComponentClient(): SupabaseClient {
  console.log('[Supabase Client Factory] Creating Supabase browser client with URL:', supabaseUrl);
  const client = createBrowserClient(
    supabaseUrl!, // Assert non-null because we checked above
    supabaseAnonKey! // Assert non-null
  );
  console.log('[Supabase Client Factory] Supabase browser client created.');
  return client;
}
