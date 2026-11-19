import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SponsorLinks } from "@/lib/sponsors";

/** All sponsor links as a member key → group key map. */
export async function getSponsorLinks(supabase: SupabaseClient): Promise<SponsorLinks> {
  const { data, error } = await supabase.from("sponsor_links").select("member_key, group_key");
  if (error) throw error;
  return new Map((data ?? []).map((l) => [l.member_key, l.group_key]));
}
