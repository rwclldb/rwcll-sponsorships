import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sameSponsor } from "@/lib/sponsors";

export type LogoSource = {
  id: string;
  season: string;
  company_name: string;
  email: string;
  logo_path: string;
  created_at: string;
};

/** Every sign-up that has a logo, newest first. */
export async function getLogoSources(supabase: SupabaseClient): Promise<LogoSource[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, season, company_name, email, logo_path, created_at")
    .not("logo_path", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as LogoSource[];
}

/** Logos from this sponsor's other sign-ups (same email or same company name), newest first. */
export function pastLogosFor(
  reg: { id: string; email: string; company_name: string },
  sources: LogoSource[],
): (LogoSource & { match: "email" | "name" })[] {
  return sources
    .filter((s) => s.id !== reg.id)
    .map((s) => ({ ...s, match: sameSponsor(reg, s) }))
    .filter((s): s is LogoSource & { match: "email" | "name" } => s.match !== null);
}

/** Copies a stored logo into a sign-up (as its own file) and replaces any logo it had. */
export async function copyLogo(
  supabase: SupabaseClient,
  fromPath: string,
  to: { id: string; season: string; logo_path: string | null },
) {
  const ext = fromPath.split(".").pop() ?? "bin";
  const newPath = `${to.season}/${crypto.randomUUID()}.${ext}`;
  const { error: copyError } = await supabase.storage.from("logos").copy(fromPath, newPath);
  if (copyError) throw new Error(`Couldn't copy the logo: ${copyError.message}`);
  const { error } = await supabase.from("registrations").update({ logo_path: newPath }).eq("id", to.id);
  if (error) {
    await supabase.storage.from("logos").remove([newPath]);
    throw new Error(`Couldn't save the logo: ${error.message}`);
  }
  if (to.logo_path) await supabase.storage.from("logos").remove([to.logo_path]);
}
