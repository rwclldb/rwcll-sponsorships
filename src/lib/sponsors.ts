import type { RegistrationRow } from "@/lib/admin-data";

/** member key → group key, from the sponsor_links table. */
export type SponsorLinks = Map<string, string>;

type SponsorLike = { email: string; company_name: string };

/** A sign-up's own sponsor key: its email, or "company:<name>" when it has no email. */
export function baseKey(r: SponsorLike) {
  return r.email.trim().toLowerCase() || `company:${r.company_name.trim().toLowerCase()}`;
}

/** The sponsor a sign-up belongs to, after following any links. */
export function sponsorKey(r: SponsorLike, links: SponsorLinks) {
  const key = baseKey(r);
  return links.get(key) ?? key;
}

export type PastSponsor = {
  /** The sponsor's key (after links). */
  key: string;
  /** Most recent email (blank if none on file). */
  email: string;
  /** Every email used across the linked records, newest first. */
  emails: string[];
  /** The separate records joined into this sponsor (more than one = linked). */
  members: { key: string; label: string }[];
  company_name: string;
  /** Other names used in other years. */
  other_names: string[];
  contact_name: string;
  phone: string;
  address: string;
  /** Newest first. */
  seasons: string[];
  total_cents: number;
};

/** One entry per sponsor (email, or company when no email, joined by links), using their most recent details. */
export function groupSponsors(regs: RegistrationRow[], links: SponsorLinks = new Map()): PastSponsor[] {
  const groups = new Map<string, PastSponsor>();
  const sorted = [...regs].sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const r of sorted) {
    if (r.status === "cancelled") continue;
    const own = baseKey(r);
    const key = links.get(own) ?? own;
    const email = r.email.trim().toLowerCase();
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        email,
        emails: [],
        members: [],
        company_name: r.company_name,
        other_names: [],
        contact_name: r.contact_name,
        phone: r.phone,
        address: r.address,
        seasons: [],
        total_cents: 0,
      };
      groups.set(key, g);
    }
    if (!g.seasons.includes(r.season)) g.seasons.push(r.season);
    g.total_cents += r.total_cents;
    if (email && !g.emails.includes(email)) g.emails.push(email);
    if (!g.members.some((m) => m.key === own)) {
      g.members.push({ key: own, label: email || `${r.company_name.trim()} (no email)` });
    }
    if (
      normalizeCompany(r.company_name) !== normalizeCompany(g.company_name) &&
      !g.other_names.includes(r.company_name.trim())
    ) {
      g.other_names.push(r.company_name.trim());
    }
    // Fill gaps in the newest sign-up from older ones.
    g.email ||= email;
    g.contact_name ||= r.contact_name;
    g.phone ||= r.phone;
    g.address ||= r.address;
  }

  for (const s of groups.values()) s.seasons.sort().reverse();
  return [...groups.values()].sort((a, b) => a.company_name.localeCompare(b.company_name));
}

/** Sponsors that aren't linked but have the same company name: likely the same business. */
export function suggestLinks(sponsors: PastSponsor[]): PastSponsor[][] {
  const byName = new Map<string, PastSponsor[]>();
  for (const s of sponsors) {
    const n = normalizeCompany(s.company_name);
    if (!n) continue;
    byName.set(n, [...(byName.get(n) ?? []), s]);
  }
  return [...byName.values()].filter((g) => g.length > 1);
}

/** "Mayers Jewelers, Inc. (MJ)" → "mayers jewelers" for comparing company names across years. */
export function normalizeCompany(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|inc|incorporated|llc|co|corp|corporation|company|ltd)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether two sign-ups look like the same sponsor: same email, linked, or same company name. */
export function sameSponsor(
  a: SponsorLike,
  b: SponsorLike,
  links: SponsorLinks = new Map(),
): "email" | "linked" | "name" | null {
  const ea = a.email.trim().toLowerCase();
  if (ea && ea === b.email.trim().toLowerCase()) return "email";
  if (sponsorKey(a, links) === sponsorKey(b, links)) return "linked";
  const na = normalizeCompany(a.company_name);
  if (na && na === normalizeCompany(b.company_name)) return "name";
  return null;
}
