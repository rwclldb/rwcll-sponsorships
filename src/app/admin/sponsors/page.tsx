import { getRegistrations } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { groupSponsors } from "@/lib/sponsors";

export default async function PastSponsorsPage() {
  const { supabase } = await requireAdmin();
  const [regs, { data: settings }] = await Promise.all([
    getRegistrations(supabase),
    supabase.from("settings").select("current_season").eq("id", 1).single(),
  ]);
  const sponsors = groupSponsors(regs);
  const current = settings?.current_season;
  const notYetBack = sponsors.filter((s) => !s.seasons.includes(current ?? ""));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Past sponsors</h1>
          <p className="text-muted">Everyone who has sponsored in any season, one row per email address.</p>
        </div>
        <a href="/admin/export?type=sponsors" className="btn-secondary">
          Download CSV
        </a>
      </div>

      <section className="card space-y-2">
        <h2 className="font-semibold">
          Haven&apos;t signed up for {current} yet ({notYetBack.length})
        </h2>
        <p className="text-sm text-muted">Copy these into the BCC line of an email to invite them back.</p>
        <textarea
          readOnly
          rows={3}
          className="input font-mono text-sm"
          value={notYetBack.map((s) => s.email).join(", ")}
        />
      </section>

      <div className="card overflow-x-auto p-0 sm:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Sponsor</th>
              <th>Contact</th>
              <th>Seasons</th>
              <th className="text-right">Total sponsored</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  No sponsors yet.
                </td>
              </tr>
            )}
            {sponsors.map((s) => (
              <tr key={s.email}>
                <td className="font-semibold">{s.company_name}</td>
                <td>
                  {s.contact_name}
                  <div className="text-muted">
                    <a href={`mailto:${s.email}`} className="link">
                      {s.email}
                    </a>{" "}
                    · {s.phone}
                  </div>
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
