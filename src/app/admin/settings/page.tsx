import { ConfirmButton } from "@/components/ConfirmButton";
import { getSeasons } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";
import { zelleQrUrl } from "@/lib/public-data";
import type { Package, Settings } from "@/lib/types";
import {
  addAdmin,
  copyPackages,
  removeAdmin,
  saveSettings,
  savePackage,
  uploadZelleQr,
} from "../actions";

export default async function SettingsPage() {
  const { supabase, email: me } = await requireAdmin();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single<Settings>();
  if (!settings) throw new Error("Settings row is missing");

  const season = settings.current_season;
  const [{ data: packages }, { data: admins }, seasons] = await Promise.all([
    supabase.from("packages").select("*").eq("season", season).order("sort_order").returns<Package[]>(),
    supabase.from("admins").select("email").order("email"),
    getSeasons(supabase, season),
  ]);
  const otherSeasons = seasons.filter((s) => s !== season);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Sign-up form</h2>
        <form action={saveSettings} className="space-y-4">
          <div className="max-w-xs">
            <label className="label" htmlFor="current_season">
              Current season
            </label>
            <input
              id="current_season"
              name="current_season"
              defaultValue={season}
              required
              className="input"
            />
            <p className="mt-1 text-sm text-muted">
              New sign-ups are filed under this season. Each season has its own packages and prices (below).
            </p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="registration_open"
              defaultChecked={settings.registration_open}
              className="size-4 accent-brand"
            />
            Sign-up form is open
          </label>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="email_notifications"
                defaultChecked={settings.email_notifications}
                className="size-4 accent-brand"
              />
              Send emails (a thank-you to the sponsor, and a &quot;new sponsor&quot; alert to the addresses below)
            </label>
            {!emailConfigured() && (
              <p className="mt-1 ml-6 text-sm text-amber-800">
                Email sending isn&apos;t set up on the server yet (RESEND_API_KEY), so no emails will go out.
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="notify_emails">
              Send new-sponsor alerts to
            </label>
            <input
              id="notify_emails"
              name="notify_emails"
              defaultValue={settings.notify_emails}
              placeholder="sponsors@rwcll.org, treasurer@rwcll.org"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="payment_instructions">
              Payment instructions (shown on the invoice)
            </label>
            <textarea
              id="payment_instructions"
              name="payment_instructions"
              rows={8}
              defaultValue={settings.payment_instructions}
              className="input"
            />
          </div>
          <button className="btn">Save</button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Zelle QR code</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={zelleQrUrl(settings)}
          alt="Current Zelle QR code"
          className="h-48 w-48 rounded-md border border-line object-contain"
        />
        <p className="text-sm text-muted">
          {settings.zelle_qr_path
            ? "Using the QR code uploaded here."
            : "Using the built-in RWCLL Zelle QR code. Upload a new one only if it changes."}
        </p>
        <form action={uploadZelleQr} className="flex flex-wrap items-center gap-2">
          <input name="qr" type="file" accept="image/*" required className="input max-w-sm text-sm" />
          <button className="btn-secondary">Replace</button>
        </form>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">{season} packages and prices</h2>
          <p className="text-sm text-muted">
            Changing a price only affects new sign-ups. Untick &quot;Active&quot; to hide a package from the form.
          </p>
        </div>

        {(packages ?? []).length === 0 && otherSeasons.length > 0 && (
          <form action={copyPackages} className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 p-3">
            <input type="hidden" name="to_season" value={season} />
            <span>No packages for {season} yet. Copy them from</span>
            <select name="from_season" className="input w-auto py-1.5">
              {otherSeasons.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="btn-secondary py-1.5">Copy</button>
          </form>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[640px] space-y-2">
            <div className="grid grid-cols-[1fr_7rem_6rem_4rem_4rem_5rem] gap-2 px-1 text-sm font-semibold text-muted">
              <span>Name</span>
              <span>Type</span>
              <span>Price ($)</span>
              <span>Order</span>
              <span>Active</span>
              <span />
            </div>
            {(packages ?? []).map((p) => (
              <PackageRow key={p.id} pkg={p} season={season} />
            ))}
            <PackageRow season={season} />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">Admins</h2>
          <p className="text-sm text-muted">
            People who can sign in here. They sign in with their @rwcll.org email and a code sent to it.
          </p>
        </div>
        <ul className="divide-y divide-line">
          {(admins ?? []).map((a) => (
            <li key={a.email} className="flex items-center justify-between py-2">
              <span>
                {a.email}
                {a.email === me.toLowerCase() && <span className="text-muted"> (you)</span>}
              </span>
              {a.email !== me.toLowerCase() && (
                <form action={removeAdmin}>
                  <input type="hidden" name="email" value={a.email} />
                  <ConfirmButton message={`Remove ${a.email} as an admin?`}>Remove</ConfirmButton>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={addAdmin} className="flex max-w-md gap-2">
          <input
            name="email"
            type="email"
            required
            pattern=".+@rwcll\.org"
            title="Must be an @rwcll.org address"
            placeholder="name@rwcll.org"
            className="input"
          />
          <button className="btn-secondary">Add</button>
        </form>
      </section>
    </div>
  );
}

function PackageRow({ pkg, season }: { pkg?: Package; season: string }) {
  return (
    <form
      action={savePackage}
      className="grid grid-cols-[1fr_7rem_6rem_4rem_4rem_5rem] items-center gap-2 rounded-md p-1 odd:bg-paper"
    >
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <input type="hidden" name="season" value={season} />
      <input name="name" defaultValue={pkg?.name} placeholder="New package name" required className="input py-1.5" />
      <select name="kind" defaultValue={pkg?.kind ?? "team"} className="input py-1.5">
        <option value="team">Team</option>
        <option value="banner">Banner</option>
      </select>
      <input
        name="price"
        defaultValue={pkg ? (pkg.price_cents / 100).toFixed(2) : ""}
        required
        inputMode="decimal"
        pattern="\$?[0-9,]+(\.[0-9]{1,2})?"
        className="input py-1.5"
      />
      <input name="sort_order" type="number" defaultValue={pkg?.sort_order ?? 100} className="input py-1.5" />
      <input type="checkbox" name="active" defaultChecked={pkg?.active ?? true} className="size-4 justify-self-center accent-brand" />
      <button className="btn-secondary py-1.5">{pkg ? "Save" : "Add"}</button>
    </form>
  );
}
