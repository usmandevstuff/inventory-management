
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createServerComponentClient(): SupabaseClient {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Server: Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Server: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
  }

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// This client is specifically for Route Handlers and Server Actions
// as they have a different way of accessing cookies (request object).
export function createRouteHandlerClient(request: Request): SupabaseClient {
    const cookieStore = cookies(); // For Server Actions, direct cookies() is fine.
                                 // For Route Handlers, you might need to adapt if not using NextRequest

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("RouteHandler/ServerAction: Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
    }
    if (!supabaseAnonKey) {
      throw new Error("RouteHandler/ServerAction: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
    }

    return createServerClient(
        supabaseUrl!,
        supabaseAnonKey!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}
