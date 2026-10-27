import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in client components ("use client").
 * RLS policies enforce what each signed-in user can see.
 */
export function createClient() {
  // Fallbacks only exist so `next build` can pre-render pages without env vars;
  // real values come from .env.local / Vercel environment variables.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-anon-key"
  );
}