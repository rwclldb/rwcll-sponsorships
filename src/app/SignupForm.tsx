"use client";

import { useActionState, useState } from "react";
import { bannerDiscount, describeTiers, discountLabel } from "@/lib/discount";
import { money } from "@/lib/format";
import type { Package } from "@/lib/types";
import { submitRegistration, type SignupState } from "./actions";

export function SignupForm({ packages, discountTiers }: { packages: Package[]; discountTiers: number[] }) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(submitRegistration, {});
  const v = state.values ?? {};
  const [selected, setSelected] = useState<string[]>([]);
  const [hasPlayer, setHasPlayer] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);

  const chosen = packages.filter((p) => selected.includes(p.id));
  const discount = bannerDiscount(discountTiers, chosen);
  const total = chosen.reduce((sum, p) => sum + p.price_cents, 0) - discount;
  const discountText = describeTiers(discountTiers);
  const teams = packages.filter((p) => p.kind === "team");
  const banners = packages.filter((p) => p.kind === "banner");

  function toggle(id: string, on: boolean) {
    setSelected((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));
  }

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state.error && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">
          {state.error}
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Your information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Company / sponsor name"
            name="company_name"
            defaultValue={v.company_name}
            required
            hint="This is the name we'll use for the team or banner."
          />
          <Field label="Your name" name="contact_name" defaultValue={v.contact_name} required />
          <Field label="Email" name="email" type="email" defaultValue={v.email} required />
          <Field label="Mobile phone" name="phone" type="tel" defaultValue={v.phone} required />
        </div>
        <div>
          <label className="label" htmlFor="address">
            Mailing address
          </label>
          <textarea id="address" name="address" rows={3} required className="input" defaultValue={v.address} />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">Sponsorship opportunities</h2>
          <p className="text-sm text-muted">Check all that apply.</p>
        </div>

        {teams.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-semibold">Sponsor a team</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {teams.map((p) => (
                <PackageOption key={p.id} pkg={p} checked={selected.includes(p.id)} onToggle={toggle} />
              ))}
            </div>
          </fieldset>
        )}

        <label className="flex items-start gap-3 rounded-md border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
          <input
            type="checkbox"
            name="needs_division_help"
            checked={needsHelp}
            onChange={(e) => setNeedsHelp(e.target.checked)}
            className="mt-1 size-4 accent-brand"
          />
          <span>
            <span className="font-medium">I want to sponsor a team but don&apos;t know which division</span>
            <span className="block text-sm text-muted">
              We&apos;ll contact you to help choose, then update your invoice.
            </span>
          </span>
        </label>

        {banners.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-semibold">Banner</legend>
            {discountText && (
              <p className="mb-2 text-sm text-brand-dark">
                Sponsoring a team too? Save on the banner: {discountText}.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {banners.map((p) => (
                <PackageOption key={p.id} pkg={p} checked={selected.includes(p.id)} onToggle={toggle} />
              ))}
            </div>
          </fieldset>
        )}

        {discount > 0 && (
          <p className="flex justify-between border-t border-line pt-3 text-brand-dark">
            <span>{discountLabel(chosen)}</span>
            <span>−{money(discount)}</span>
          </p>
        )}
        <p className="flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">A couple more things</h2>
        <fieldset>
          <legend className="label">Do you have a player in the league?</legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="has_player"
                value="no"
                checked={!hasPlayer}
                onChange={() => setHasPlayer(false)}
                className="accent-brand"
              />
              No
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="has_player"
                value="yes"
                checked={hasPlayer}
                onChange={() => setHasPlayer(true)}
                className="accent-brand"
              />
              Yes
            </label>
          </div>
        </fieldset>
        {hasPlayer && (
          <Field
            label="Player name and division"
            name="player_info"
            defaultValue={v.player_info}
            required
            hint="For example: Sam Smith, AAA"
          />
        )}

        <div>
          <label className="label" htmlFor="logo">
            Logo (optional)
          </label>
          <input id="logo" name="logo" type="file" className="input text-sm" accept="image/*,.pdf,.ai,.eps,.svg" />
          <p className="mt-1 text-sm text-muted">
            Up to 4 MB. High-resolution or vector files (PDF, AI, EPS, SVG) work best. You can also send it later.
          </p>
        </div>

        {/* Spam trap: hidden from people, but bots tend to fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px]">
          <label>
            Leave this empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </section>

      <div className="flex flex-col items-start gap-2">
        <button type="submit" className="btn px-6 py-3 text-lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit sponsorship"}
        </button>
        <p className="text-sm text-muted">
          Next you&apos;ll see payment instructions (Zelle or check) and a printable invoice.
        </p>
      </div>
    </form>
  );
}

function PackageOption({
  pkg,
  checked,
  onToggle,
}: {
  pkg: Package;
  checked: boolean;
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          name="package"
          value={pkg.id}
          checked={checked}
          className="size-4 accent-brand"
          onChange={(e) => onToggle(pkg.id, e.target.checked)}
        />
        <span className="font-medium">{pkg.name}</span>
      </span>
      <span className="text-muted">{money(pkg.price_cents)}</span>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className="input" />
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
