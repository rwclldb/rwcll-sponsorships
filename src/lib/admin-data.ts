import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Payment, Registration, RegistrationItem } from "@/lib/types";

export type RegistrationRow = Registration & {
  registration_items: RegistrationItem[];
  payments: Payment[];
  total_cents: number;
  paid_cents: number;
};

export function paymentStatus(r: Pick<RegistrationRow, "total_cents" | "paid_cents"> & { imported?: boolean }) {
  if (r.paid_cents === 0 && r.imported) return "untracked";
  if (r.paid_cents === 0) return r.total_cents === 0 ? "none" : "unpaid";
  if (r.paid_cents < r.total_cents) return "partial";
  if (r.paid_cents > r.total_cents) return "overpaid";
  return "paid";
}

/** Registrations with items, payments, and totals. Pass `season` to limit to one season. */
export async function getRegistrations(supabase: SupabaseClient, season?: string): Promise<RegistrationRow[]> {
  let query = supabase
    .from("registrations")
    .select("*, registration_items(*), payments(*)")
    .order("created_at", { ascending: false });
  if (season) query = query.eq("season", season);
  const { data, error } = await query;
  if (error) throw error;

  return (data as Omit<RegistrationRow, "total_cents" | "paid_cents">[]).map((r) => ({
    ...r,
    total_cents: r.registration_items.reduce((s, i) => s + i.price_cents, 0),
    paid_cents: r.payments.reduce((s, p) => s + p.amount_cents, 0),
  }));
}

export async function getSeasons(supabase: SupabaseClient, current: string) {
  const [{ data: a }, { data: b }] = await Promise.all([
    supabase.from("packages").select("season"),
    supabase.from("registrations").select("season"),
  ]);
  const all = new Set([current, ...(a ?? []).map((r) => r.season), ...(b ?? []).map((r) => r.season)]);
  return [...all].sort().reverse();
}
