import Link from "next/link";
import { PaymentBadge, StatusBadge } from "@/components/Badges";
import { ConfirmButton } from "@/components/ConfirmButton";
import { getRegistrations, getSeasons, paymentStatus } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { getSponsorLinks } from "@/lib/links";
import { getLogoSources, pastLogosFor } from "@/lib/logos";
import { copyPastLogos } from "./actions";

const FILTERS = [
  { value: "", label: "All active" },
  { value: "new", label: "New" },
  { value: "unpaid", label: "Owes money" },
  { value: "paid", label: "Paid" },
  { value: "nologo", label: "No logo yet" },
  { value: "help", label: "Needs division help" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminHome(props: PageProps<"/admin">) {
  const { supabase } = await requireAdmin();
  const sp = await props.searchParams;
  const { data: settings } = await supabase.from("settings").select("current_season").eq("id", 1).single();
  const currentSeason = settings?.current_season ?? "";
  const season = typeof sp.season === "string" && sp.season ? sp.season : currentSeason;
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const [all, seasons, logoSources, links] = await Promise.all([
    getRegistrations(supabase, season),
    getSeasons(supabase, currentSeason),
    getLogoSources(supabase),
    getSponsorLinks(supabase),
  ]);
  // Sponsors with no logo this season but one on file from another sign-up.
  const pastLogoIds = new Set(
    all.filter((r) => !r.logo_path && pastLogosFor(r, logoSources, links).length > 0).map((r) => r.id),
  );
  const copyableCount = all.filter((r) => r.status !== "cancelled" && pastLogoIds.has(r.id)).length;
  const active = all.filter((r) => r.status !== "cancelled");

  const rows = (filter === "cancelled" ? all.filter((r) => r.status === "cancelled") : active).filter((r) => {
    const pay = paymentStatus(r);
    if (filter === "new" && r.status !== "new") return false;
    if (filter === "unpaid" && !(pay === "unpaid" || pay === "partial")) return false;
    if (filter === "paid" && pay !== "paid" && pay !== "overpaid") return false;
    if (filter === "nologo" && r.logo_path) return false;
    if (filter === "help" && !r.needs_division_help) return false;
    if (q) {
      const hay = `${r.company_name} ${r.contact_name} ${r.email} ${r.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const pledged = active.reduce((s, r) => s + r.total_cents, 0);
  const received = active.reduce((s, r) => s + r.paid_cents, 0);
  // Imported sign-ups never had payments tracked, so they don't count as owed.
  const outstanding = active
    .filter((r) => paymentStatus(r) !== "untracked")
    .reduce((s, r) => s + Math.max(r.total_cents - r.paid_cents, 0), 0);
  const untracked = active.filter((r) => paymentStatus(r) === "untracked").length;

  // Count sponsorships per package (division / banner).
  const counts = new Map<string, number>();
  for (const r of active)
    for (const i of r.registration_items)
      if (i.kind !== "discount") counts.set(i.name, (counts.get(i.name) ?? 0) + 1);
  const helpCount = active.filter((r) => r.needs_division_help).length;

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ season, ...(filter && { filter }), ...(q && { q }), ...extra });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `?${p}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{season} sponsors</h1>
          {season !== currentSeason && <p className="text-sm text-muted">Viewing a past season.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex items-center gap-2">
            <label htmlFor="season" className="text-sm text-muted">
              Season
            </label>
            <select id="season" name="season" defaultValue={season} className="input w-auto py-1.5">
              {seasons.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="btn-secondary py-1.5">Go</button>
          </form>
          <a href={`/admin/export?season=${encodeURIComponent(season)}`} className="btn-secondary py-1.5">
            Download CSV
          </a>
          <Link href={`/admin/registrations/new?season=${encodeURIComponent(season)}`} className="btn py-1.5">
            + Add sponsor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sponsors" value={String(active.length)} />
        <Stat label="Pledged" value={money(pledged)} />
        <Stat label="Received" value={money(received)} />
        <Stat label="Outstanding" value={money(outstanding)} />
      </div>
      {untracked > 0 && (
        <p className="-mt-3 text-sm text-muted">
          {untracked} sign-up{untracked === 1 ? " was" : "s were"} imported from the old Google Form, where payments
          weren&apos;t tracked. They aren&apos;t counted as outstanding.
        </p>
      )}

      {(counts.size > 0 || helpCount > 0) && (
        <div className="card">
          <h2 className="mb-2 font-semibold">By division / banner</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {[...counts.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([name, n]) => (
                <span key={name} className="rounded-md bg-paper px-2 py-1">
                  {name}: <strong>{n}</strong>
                </span>
              ))}
            {helpCount > 0 && (
              <Link href={qs({ filter: "help" })} className="rounded-md bg-amber-100 px-2 py-1">
                Division undecided: <strong>{helpCount}</strong>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={qs({ filter: f.value })}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === f.value ? "border-brand bg-brand text-white" : "border-line bg-white hover:bg-paper"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto">
          <input type="hidden" name="season" value={season} />
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Search name, email, phone" className="input w-64 py-1.5" />
        </form>
      </div>

      {copyableCount > 0 && (
        <form
          action={copyPastLogos}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm"
        >
          <input type="hidden" name="season" value={season} />
          <span>
            {copyableCount} sponsor{copyableCount === 1 ? " has" : "s have"} no logo for {season} but sent one in
            another season.
          </span>
          <ConfirmButton
            message={`Copy the most recent past logo onto ${copyableCount} sponsor${copyableCount === 1 ? "" : "s"}? You can check or change each one on the sponsor's page.`}
            className="btn-secondary py-1 text-sm"
          >
            Use past logos
          </ConfirmButton>
        </form>
      )}

      <div className="card overflow-x-auto p-0 sm:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sponsor</th>
              <th>Sponsoring</th>
              <th className="text-right">Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Logo</th>
              <th>Signed up</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">
                  No sponsors match.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper">
                <td className="text-muted">{r.number}</td>
                <td>
                  <Link href={`/admin/registrations/${r.id}`} className="font-semibold text-brand-dark hover:underline">
                    {r.company_name}
                  </Link>
                  <div className="text-muted">{r.contact_name}</div>
                </td>
                <td>
                  {r.registration_items
                    .filter((i) => i.kind !== "discount")
                    .map((i) => i.name)
                    .join(", ")}
                  {r.needs_division_help && (
                    <span className="badge ml-1 bg-amber-100 text-amber-900">division undecided</span>
                  )}
                </td>
                <td className="text-right">{money(r.total_cents)}</td>
                <td>
                  <PaymentBadge status={paymentStatus(r)} />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  {r.logo_path ? (
                    "✓"
                  ) : pastLogoIds.has(r.id) ? (
                    <span className="badge bg-sky-100 text-sky-900">past logo available</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 sm:p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
