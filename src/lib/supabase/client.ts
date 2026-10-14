import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a dummy client in development if env vars are not yet configured
    // to prevent build-time crashes before keys are supplied.
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
