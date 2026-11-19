import type { RegistrationRow } from "@/lib/admin-data";

export type PastSponsor = {
  email: string;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  /** Newest first. */
  seasons: string[];
  total_cents: number;
};

/** One entry per sponsor email, using the details from their most recent sign-up. */
export function groupSponsors(regs: RegistrationRow[]): PastSponsor[] {
  const byEmail = new Map<string, PastSponsor>();
  const sorted = [...regs].sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const r of sorted) {
    if (r.status === "cancelled") continue;
    const key = r.email.toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      if (!existing.seasons.includes(r.season)) existing.seasons.push(r.season);
      existing.total_cents += r.total_cents;
    } else {
      byEmail.set(key, {
        email: key,
        company_name: r.company_name,
        contact_name: r.contact_name,
        phone: r.phone,
        address: r.address,
        seasons: [r.season],
        total_cents: r.total_cents,
      });
    }
  }

  for (const s of byEmail.values()) s.seasons.sort().reverse();
  return [...byEmail.values()].sort((a, b) => a.company_name.localeCompare(b.company_name));
}
