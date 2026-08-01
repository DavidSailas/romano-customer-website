import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for Server Components / server-side code that only
 * needs anon/public-level access (e.g. reading categories for a page).
 *
 * This intentionally has NO "use client" directive. Importing the
 * browser client (lib/supabase/client.ts, which IS "use client") from
 * a Server Component causes Next.js to swap it for a client-reference
 * stub — the object exists but its methods aren't real, which is why
 * you'll see errors like "supabase.from is not a function" even
 * though the code looks correct.
 *
 * Use this file instead anywhere you call Supabase from a Server
 * Component, a Route Handler, or other server-only code that just
 * needs the anon key (not the service role key — for that, use
 * lib/supabase/admin.ts).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase/server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to .env.local — see SUPABASE-SETUP.md."
  );
}

export const supabaseServer = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
