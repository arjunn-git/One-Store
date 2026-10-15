import { createClient } from "@supabase/supabase-js";

// Server-only client with service role key.
// NEVER import this file in client components.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        "placeholder-anon-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
