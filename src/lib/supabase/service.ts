import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client using the secret key. Bypasses row level security, so only
 * use it for the public sign-up flow and public invoice pages, and only return
 * what those pages need.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
