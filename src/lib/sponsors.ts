import type { RegistrationRow } from "@/lib/admin-data";

export type PastSponsor = {
  /** Unique id for the row: the email, or "company:<name>" when there's no email. */
  key: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  /** Newest first. */
  seasons: string[];
  total_cents: number;
};

/** One entry per sponsor (by email, or company when there's no email), using their most recent details. */
export function groupSponsors(regs: RegistrationRow[]): PastSponsor[] {
  const byEmail = new Map<string, PastSponsor>();
  const sorted = [...regs].sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const r of sorted) {
    if (r.status === "cancelled") continue;
    // Group by email; sign-ups with no email (some old form entries) group by company name.
    const key = r.email.trim().toLowerCase() || `company:${r.company_name.trim().toLowerCase()}`;
    const existing = byEmail.get(key);
    if (existing) {
      if (!existing.seasons.includes(r.season)) existing.seasons.push(r.season);
      existing.total_cents += r.total_cents;
      // Fill gaps in the newest sign-up from older ones.
      existing.contact_name ||= r.contact_name;
      existing.phone ||= r.phone;
      existing.address ||= r.address;
    } else {
      byEmail.set(key, {
        email: r.email.trim().toLowerCase(),
        key,
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
