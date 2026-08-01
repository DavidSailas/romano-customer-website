import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this from a "use client" file — the service role
// key bypasses Row Level Security. It's only safe inside API routes / webhooks.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Throwing here still crashes the route (unavoidable — the client can't be
  // built without these), but this message actually tells you what's missing
  // instead of a generic Supabase error, and it'll show up clearly in your
  // terminal (not just as HTML in the browser).
  throw new Error(
    `[lib/supabase/admin] Missing env var(s): ${[
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
    ]
      .filter(Boolean)
      .join(", ")}. Add them to .env.local and fully restart the dev server (env vars are only read on startup).`
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
