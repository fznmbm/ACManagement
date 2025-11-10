// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types/database";

/**
 * Create a Supabase client for client-side (browser) operations
 * This is used in Client Components (components with 'use client')
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance - reuse across the app
 */
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}
