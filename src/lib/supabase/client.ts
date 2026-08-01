"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase browser client.
 *
 * Requires these in your .env.local (see SUPABASE-SETUP.md):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw at import time (breaks the whole app during setup) — just warn loudly.
  console.warn(
    "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to .env.local — see SUPABASE-SETUP.md."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
