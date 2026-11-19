import Link from "next/link";
import { getSeasons } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { money, todayISO } from "@/lib/format";
import type { Package } from "@/lib/types";
import { copyPackages, createRegistration } from "../../actions";

export default async function NewRegistrationPage(props: PageProps<"/admin/registrations/new">) {
  const { supabase } = await requireAdmin();
  const sp = await props.searchParams;
  const { data: settings } = await supabase.from("settings").select("current_season").eq("id", 1).single();
  const currentSeason = settings?.current_season ?? "";
  const season = (typeof sp.season === "string" && sp.season.trim()) || currentSeason;
  const isPast = season !== currentSeason;

  const [{ data: packages }, seasons] = await Promise.all([
    supabase.from("packages").select("*").eq("season", season).order("sort_order").returns<Package[]>(),
    getSeasons(supabase, currentSeason),
  ]);
  const copyFrom = seasons.filter((s) => s !== season);
  // Past seasons default to a date within that season; it can be changed.
  const defaultDate = !isPast ? todayISO() : /^\d{4}$/.test(season) ? `${season}-02-01` : "";

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin" className="link text-sm">
        ← All sponsors
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Add a sponsor</h1>
        <p className="text-muted">
          For sponsors who didn&apos;t use the online form, or past years that weren&apos;t in an upload.
        </p>
      </div>

      <form className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="season-pick">
            Season
          </label>
          <input
            id="season-pick"
            name="season"
            list="seasons"
            defaultValue={season}
            required
            className="input w-40"
          />
          <datalist id="seasons">
            {seasons.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <button className="btn-secondary">Change season</button>
        <p className="w-full text-sm text-muted">Pick an existing season or type a year, e.g. 2023.</p>
      </form>

      <form action={createRegistration} className="space-y-6">
        <input type="hidden" name="season" value={season} />

        <section className="card space-y-4">
          <h2 className="text-lg font-bold">Sponsorships ({season})</h2>
          {(packages ?? []).length === 0 ? (
            <div className="space-y-2 rounded-md bg-amber-50 p-3 text-sm">
              <p>{season} doesn&apos;t have any packages or prices yet.</p>
              {copyFrom.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span>Copy them from</span>
                  <select name="from_season" form="copy-packages" className="input w-auto py-1.5">
                    {copyFrom.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button form="copy-packages" className="btn-secondary py-1.5">
                    Copy
                  </button>
                </div>
              )}
              <p className="text-muted">
                Then adjust that year&apos;s prices in{" "}
                <Link href={`/admin/settings?season=${encodeURIComponent(season)}`} className="link">
                  Settings
                </Link>{" "}
                if they were different.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {(packages ?? []).map((p) => (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
                >
                  <span className="flex items-center gap-3">
                    <input type="checkbox" name="package" value={p.id} className="size-4 accent-brand" />
                    <span className="font-medium">{p.name}</span>
                  </span>
                  <span className="text-muted">{money(p.price_cents)}</span>
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" name="needs_division_help" className="size-4 accent-brand" />
            Wants a team but the division isn&apos;t decided yet
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-bold">Sponsor details</h2>
          <Field label="Company / sponsor name" name="company_name" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact name" name="contact_name" />
            <Field label="Phone" name="phone" />
          </div>
          <Field label="Email" name="email" type="email" />
          <div>
            <label className="label" htmlFor="address">
              Address
            </label>
            <textarea id="address" name="address" rows={2} className="input" />
          </div>
          <Field label="Player in the league (name and division)" name="player_info" />
          <div>
            <label className="label" htmlFor="logo">
              Logo (optional)
            </label>
            <input id="logo" name="logo" type="file" className="input text-sm" />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-bold">Record keeping</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="signed_up_on">
                Signed up on
              </label>
              <input id="signed_up_on" name="signed_up_on" type="date" defaultValue={defaultDate} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="status">
                Status
              </label>
              <select id="status" name="status" defaultValue="confirmed" className="input">
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="payment_untracked"
              defaultChecked={isPast}
              className="mt-1 size-4 accent-brand"
            />
            <span>
              Payment wasn&apos;t tracked for this sponsor
              <span className="block text-sm text-muted">
                Shows &quot;Not tracked&quot; instead of &quot;Unpaid&quot; and isn&apos;t counted as outstanding.
                Leave unticked if you&apos;ll record their payment.
              </span>
            </span>
          </label>
          <div>
            <label className="label" htmlFor="notes">
              Internal notes
            </label>
            <textarea id="notes" name="notes" rows={3} className="input" />
          </div>
        </section>

        <button className="btn px-6 py-3">Add sponsor</button>
      </form>

      {/* Separate form for the "copy packages" button above (forms can't be nested). */}
      <form id="copy-packages" action={copyPackages}>
        <input type="hidden" name="to_season" value={season} />
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} required={required} className="input" />
    </div>
  );
}
