import { getRegistrations, paymentStatus } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { invoiceNumber } from "@/lib/format";
import { getSponsorLinks } from "@/lib/links";
import { groupSponsors } from "@/lib/sponsors";

function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s = v == null ? "" : String(v);
          // Stop spreadsheet apps from treating text as a formula.
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

function download(body: string, filename: string) {
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

/**
 * /admin/export?season=2027  → that season's sign-ups
 * /admin/export?type=sponsors → every sponsor ever, one row per email (for email blasts)
 */
export async function GET(req: Request) {
  const { supabase } = await requireAdmin();
  const url = new URL(req.url);

  if (url.searchParams.get("type") === "sponsors") {
    const [regs, links] = await Promise.all([getRegistrations(supabase), getSponsorLinks(supabase)]);
    const sponsors = groupSponsors(regs, links);
    return download(
      csv([
        ["Email", "Other emails", "Company", "Other names", "Contact", "Phone", "Address", "Seasons", "Most recent season"],
        ...sponsors.map((s) => [
          s.email,
          s.emails.filter((e) => e !== s.email).join("; "),
          s.company_name,
          s.other_names.join("; "),
          s.contact_name,
          s.phone,
          s.address,
          s.seasons.join(" "),
          s.seasons[0],
        ]),
      ]),
      "rwcll-past-sponsors.csv",
    );
  }

  const season = url.searchParams.get("season") ?? "";
  const regs = (await getRegistrations(supabase, season)).reverse();
  return download(
    csv([
      [
        "Invoice #", "Signed up", "Status", "Company", "Contact", "Email", "Phone", "Address",
        "Sponsoring", "Division undecided", "Discount", "Total", "Paid", "Balance", "Payment status",
        "Payment details", "Player", "Logo", "Notes",
      ],
      ...regs.map((r) => [
        invoiceNumber(r.season, r.number),
        new Date(r.created_at).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }),
        r.status,
        r.company_name,
        r.contact_name,
        r.email,
        r.phone,
        r.address,
        r.registration_items.filter((i) => i.kind !== "discount").map((i) => i.name).join("; "),
        r.needs_division_help ? "yes" : "",
        dollars(-r.registration_items.filter((i) => i.kind === "discount").reduce((s, i) => s + i.price_cents, 0)),
        dollars(r.total_cents),
        dollars(r.paid_cents),
        dollars(r.total_cents - r.paid_cents),
        paymentStatus(r),
        r.payments
          .map((p) => `${p.received_on} ${p.method}${p.reference ? ` ${p.reference}` : ""} $${dollars(p.amount_cents)}`)
          .join("; "),
        r.player_info,
        r.logo_path ? "yes" : "",
        r.notes,
      ]),
    ]),
    `rwcll-sponsors-${season}.csv`,
  );
}
