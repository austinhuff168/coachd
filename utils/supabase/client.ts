import { createBrowserClient } from '@supabase/ssr';

// Grab your public Supabase URL and anon key from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create a Supabase client for use in client components (Next.js "use client")
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}