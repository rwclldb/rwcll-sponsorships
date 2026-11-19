import { money } from "@/lib/format";

type Item = { kind: string; price_cents: number };

/** Drops trailing zero tiers: [5000, 0, 0] → [5000]. */
export function cleanTiers(tiers: number[]) {
  const out = [...tiers];
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

/**
 * Banner discount for a sponsor who also sponsors teams. tiers[0] comes off for the 1st team,
 * tiers[1] for the 2nd, and so on (they add up). Never more than the banner's price.
 * Returns a positive number of cents (0 = no discount).
 */
export function bannerDiscount(tiers: number[], items: Item[]) {
  const banner = items.find((i) => i.kind === "banner");
  const teams = items.filter((i) => i.kind === "team").length;
  if (!banner || teams === 0) return 0;
  const total = tiers.slice(0, teams).reduce((sum, t) => sum + t, 0);
  return Math.min(total, banner.price_cents);
}

export function discountLabel(items: Item[]) {
  const teams = items.filter((i) => i.kind === "team").length;
  return `Banner discount (sponsoring ${teams} team${teams === 1 ? "" : "s"})`;
}

/** "$50 off with 1 team, $125 off with 2 teams, $225 off with 3 or more teams" */
export function describeTiers(rawTiers: number[]) {
  const tiers = cleanTiers(rawTiers);
  if (tiers.length === 0) return "";
  let total = 0;
  return tiers
    .map((t, i) => {
      total += t;
      const n = i + 1;
      const last = i === tiers.length - 1;
      return `${money(total)} off with ${n}${last ? " or more" : ""} team${n === 1 && !last ? "" : "s"}`;
    })
    .join(", ");
}
