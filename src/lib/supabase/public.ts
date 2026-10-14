import { createClient } from "@supabase/supabase-js";

// Public unauthenticated client for static product catalog and category reads.
// Does NOT touch cookies, enabling full Next.js static prerendering & CDN caching.
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createClient(supabaseUrl, supabaseKey);
}
