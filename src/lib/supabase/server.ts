import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for server components and route handlers.
 * Reads/writes the auth session cookies of the current request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Fallbacks only exist so builds/previews work without env vars;
  // real values come from .env.local / Vercel environment variables.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware refreshes the session.
          }
        },
      },
    }
  );
}