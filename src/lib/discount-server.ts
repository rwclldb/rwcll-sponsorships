import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bannerDiscount, cleanTiers, discountLabel } from "@/lib/discount";

/** The season's banner discount tiers in cents ([] = no discount). */
export async function getBannerTiers(db: SupabaseClient, season: string): Promise<number[]> {
  const { data } = await db.from("season_discounts").select("banner_tiers").eq("season", season).maybeSingle();
  return cleanTiers(data?.banner_tiers ?? []);
}

/**
 * Recomputes a sign-up's banner discount line from its current teams/banner and its season's
 * tiers. Call after anything changes the sign-up's sponsorships.
 */
export async function syncDiscount(db: SupabaseClient, registrationId: string) {
  const { data: reg, error } = await db
    .from("registrations")
    .select("season, registration_items(id, kind, price_cents)")
    .eq("id", registrationId)
    .single();
  if (error || !reg) throw new Error(`Couldn't load the sign-up: ${error?.message}`);

  const items = (reg.registration_items as { id: string; kind: string; price_cents: number }[]).filter(
    (i) => i.kind !== "discount",
  );
  const amount = bannerDiscount(await getBannerTiers(db, reg.season), items);

  const { error: delError } = await db
    .from("registration_items")
    .delete()
    .eq("registration_id", registrationId)
    .eq("kind", "discount");
  if (delError) throw new Error(`Couldn't update the discount: ${delError.message}`);
  if (amount > 0) {
    const { error: insError } = await db.from("registration_items").insert({
      registration_id: registrationId,
      kind: "discount",
      name: discountLabel(items),
      price_cents: -amount,
    });
    if (insError) throw new Error(`Couldn't add the discount: ${insError.message}`);
  }
}
