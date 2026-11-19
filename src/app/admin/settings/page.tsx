import { ConfirmButton } from "@/components/ConfirmButton";
import { getSeasons } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { describeTiers } from "@/lib/discount";
import { getBannerTiers } from "@/lib/discount-server";
import { emailConfigured } from "@/lib/email";
import { zelleQrUrl } from "@/lib/public-data";
import type { Package, Settings } from "@/lib/types";
import {
  addAdmin,
  copyPackages,
  removeAdmin,
  saveBannerDiscount,
  saveSettings,
  savePackage,
  setMyPassword,
  uploadZelleQr,
} from "../actions";

export default async function SettingsPage(props: PageProps<"/admin/settings">) {
  const { supabase, email: me } = await requireAdmin();
  const { password: passwordStatus, season: seasonParam } = await props.searchParams;
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single<Settings>();
  if (!settings) throw new Error("Settings row is missing");

  const currentSeason = settings.current_season;
  // Packages can be viewed/edited for any season (past years had different prices).
  const pkgSeason = (typeof seasonParam === "string" && seasonParam.trim()) || currentSeason;
  const [{ data: packages }, { data: admins }, seasons] = await Promise.all([
    supabase.from("packages").select("*").eq("season", pkgSeason).order("sort_order").returns<Package[]>(),
    supabase.from("admins").select("email").order("email"),
    getSeasons(supabase, currentSeason),
  ]);
  const otherSeasons = seasons.filter((s) => s !== pkgSeason);
  const tiers = await getBannerTiers(supabase, pkgSeason);
  const tierDescription = describeTiers(tiers);

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
              defaultValue={currentSeason}
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

      <section id="packages" className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{pkgSeason} packages and prices</h2>
            <p className="text-sm text-muted">
              {pkgSeason === currentSeason
                ? "Changing a price only affects new sign-ups. Untick \"Active\" to hide a package from the form."
                : "A past season. These prices are used when you add a sponsor for that year."}
            </p>
          </div>
          <form className="flex items-center gap-2">
            <select name="season" defaultValue={pkgSeason} className="input w-auto py-1.5">
              {[...new Set([pkgSeason, ...seasons])].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="btn-secondary py-1.5">Show</button>
          </form>
        </div>

        {(packages ?? []).length === 0 && otherSeasons.length > 0 && (
          <form action={copyPackages} className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 p-3">
            <input type="hidden" name="to_season" value={pkgSeason} />
            <span>No packages for {pkgSeason} yet. Copy them from</span>
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
              <PackageRow key={p.id} pkg={p} season={pkgSeason} />
            ))}
            <PackageRow season={pkgSeason} />
          </div>
        </div>

        <form action={saveBannerDiscount} className="space-y-3 border-t border-line pt-4">
          <input type="hidden" name="season" value={pkgSeason} />
          <div>
            <h3 className="font-semibold">Banner discount for team sponsors ({pkgSeason})</h3>
            <p className="text-sm text-muted">
              Amount taken off the banner for each team the sponsor also sponsors. The amounts add up. Fill in only
              the 1st team for one flat discount, or leave everything blank for no discount. The discount never goes
              below $0 for the banner. Changes apply to new sign-ups and when you add or remove a division on a
              sponsor.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((label, i) => (
              <div key={label}>
                <label className="label text-xs" htmlFor={`tier-${i}`}>
                  {label} team ($)
                </label>
                <input
                  id={`tier-${i}`}
                  name="tier"
                  inputMode="decimal"
                  pattern="\$?[0-9,]*(\.[0-9]{1,2})?"
                  defaultValue={tiers[i] ? (tiers[i] / 100).toFixed(2) : ""}
                  className="input py-1.5"
                />
              </div>
            ))}
          </div>
          <p className="text-sm">
            {tierDescription ? (
              <>
                Sponsors see: <span className="text-brand-dark">Save on the banner: {tierDescription}.</span>
              </>
            ) : (
              <span className="text-muted">No banner discount for {pkgSeason}.</span>
            )}
          </p>
          <button className="btn-secondary">Save discount</button>
        </form>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">My password</h2>
          <p className="text-sm text-muted">
            Set a password for {me} so you can sign in without waiting for an emailed code.
          </p>
        </div>
        {passwordStatus === "changed" && (
          <p className="rounded-md bg-brand/10 p-3 text-sm font-semibold text-brand-dark">Password updated.</p>
        )}
        <form action={setMyPassword} className="grid max-w-md gap-3">
          <input type="hidden" name="username" value={me} autoComplete="username" />
          <input
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder="New password (10+ characters)"
            className="input"
          />
          <input
            name="confirm"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder="Type it again"
            className="input"
          />
          <button className="btn-secondary justify-self-start">Set password</button>
        </form>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">Admins</h2>
          <p className="text-sm text-muted">
            People who can sign in here, with their @rwcll.org email and either a password or an emailed code. Set a new admin&apos;s first password with <code>scripts/set-admin-password.mjs</code> (see README).
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
