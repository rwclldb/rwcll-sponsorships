import { ConfirmButton } from "@/components/ConfirmButton";
import { getRegistrations } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { getSponsorLinks } from "@/lib/links";
import { groupSponsors, suggestLinks } from "@/lib/sponsors";
import { linkSponsors, unlinkSponsor } from "../actions";

export default async function PastSponsorsPage() {
  const { supabase } = await requireAdmin();
  const [regs, links, { data: settings }] = await Promise.all([
    getRegistrations(supabase),
    getSponsorLinks(supabase),
    supabase.from("settings").select("current_season").eq("id", 1).single(),
  ]);
  const sponsors = groupSponsors(regs, links);
  const suggestions = suggestLinks(sponsors);
  const current = settings?.current_season;
  const notYetBack = sponsors.filter((s) => s.email && !s.seasons.includes(current ?? ""));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Past sponsors</h1>
          <p className="text-muted">
            Everyone who has sponsored in any season, one row per sponsor. If the same business shows up twice
            (different emails in different years), tick both and link them.
          </p>
        </div>
        <a href="/admin/export?type=sponsors" className="btn-secondary">
          Download CSV
        </a>
      </div>

      <section className="card space-y-2">
        <h2 className="font-semibold">
          Haven&apos;t signed up for {current} yet ({notYetBack.length})
        </h2>
        <p className="text-sm text-muted">
          Copy these into the BCC line of an email to invite them back (each sponsor&apos;s most recent email).
        </p>
        <textarea
          readOnly
          rows={3}
          className="input font-mono text-sm"
          value={notYetBack.map((s) => s.email).join(", ")}
        />
      </section>

      {suggestions.length > 0 && (
        <section className="card space-y-3">
          <div>
            <h2 className="font-semibold">Possibly the same sponsor ({suggestions.length})</h2>
            <p className="text-sm text-muted">
              These have the same company name but different emails. Link them if they&apos;re the same business.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {suggestions.map((group) => (
              <li key={group.map((s) => s.key).join("|")} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{group[0].company_name}</span>
                  <div className="text-muted">
                    {group.map((s) => `${s.email || "no email"} (${s.seasons.join(", ")})`).join(" · ")}
                  </div>
                </div>
                <form action={linkSponsors}>
                  {group.map((s) => (
                    <input key={s.key} type="hidden" name="key" value={s.key} />
                  ))}
                  <button className="btn-secondary py-1 text-sm">Link these</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form id="link-form" action={linkSponsors} className="flex flex-wrap items-center gap-3 text-sm">
        <button className="btn-secondary py-1.5">Link ticked sponsors</button>
        <span className="text-muted">Tick two or more rows that are the same business.</span>
      </form>

      <div className="card overflow-x-auto p-0 sm:p-0">
        <table className="table">
          <thead>
            <tr>
              <th className="w-0" />
              <th>Sponsor</th>
              <th>Contact</th>
              <th>Seasons</th>
              <th className="text-right">Total sponsored</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No sponsors yet.
                </td>
              </tr>
            )}
            {sponsors.map((s) => (
              <tr key={s.key}>
                <td>
                  <input
                    type="checkbox"
                    name="key"
                    value={s.key}
                    form="link-form"
                    aria-label={`Select ${s.company_name}`}
                    className="size-4 accent-brand"
                  />
                </td>
                <td>
                  <span className="font-semibold">{s.company_name}</span>
                  {s.other_names.length > 0 && (
                    <div className="text-xs text-muted">also: {s.other_names.join(", ")}</div>
                  )}
                  {s.members.length > 1 && (
                    <details className="mt-1 text-xs">
                      <summary className="cursor-pointer text-brand-dark">Linked: {s.members.length} records</summary>
                      <ul className="mt-1 space-y-1">
                        {s.members.map((m) => (
                          <li key={m.key} className="flex items-center gap-2">
                            <span className="text-muted">{m.label}</span>
                            <form action={unlinkSponsor}>
                              <input type="hidden" name="key" value={m.key} />
                              <ConfirmButton
                                message={`Split ${m.label} back out into its own sponsor?`}
                                className="btn-danger px-1 py-0 text-xs"
                              >
                                unlink
                              </ConfirmButton>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </td>
                <td>
                  {s.contact_name}
                  <div className="text-muted">
                    {s.email ? (
                      <a href={`mailto:${s.email}`} className="link">
                        {s.email}
                      </a>
                    ) : (
                      "no email on file"
                    )}
                    {s.phone && ` · ${s.phone}`}
                  </div>
                  {s.emails.length > 1 && (
                    <div className="text-xs text-muted">also: {s.emails.filter((e) => e !== s.email).join(", ")}</div>
                  )}
                </td>
                <td>{s.seasons.join(", ")}</td>
                <td className="text-right">{money(s.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
