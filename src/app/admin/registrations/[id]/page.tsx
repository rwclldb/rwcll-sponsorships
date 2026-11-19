import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentBadge, StatusBadge } from "@/components/Badges";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FileDropzone } from "@/components/FileDropzone";
import { paymentStatus } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDate, invoiceNumber, METHOD_LABELS, money, todayISO } from "@/lib/format";
import { getSponsorLinks } from "@/lib/links";
import { getLogoSources, pastLogosFor } from "@/lib/logos";
import type { Package, Payment, Registration, RegistrationItem } from "@/lib/types";
import {
  addItem,
  addPayment,
  copyLogoFrom,
  deletePayment,
  deleteRegistration,
  removeItem,
  updateRegistration,
  uploadLogo,
} from "../../actions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RegistrationPage(props: PageProps<"/admin/registrations/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await props.params;
  if (!UUID_RE.test(id)) notFound();

  const { data: reg } = await supabase
    .from("registrations")
    .select("*, registration_items(*), payments(*)")
    .eq("id", id)
    .maybeSingle<Registration & { registration_items: RegistrationItem[]; payments: Payment[] }>();
  if (!reg) notFound();

  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("season", reg.season)
    .order("sort_order")
    .returns<Package[]>();

  // Logos from this sponsor's other sign-ups, plus short-lived preview links for image files.
  const [logoSources, links] = await Promise.all([getLogoSources(supabase), getSponsorLinks(supabase)]);
  const pastLogos = pastLogosFor(reg, logoSources, links).slice(0, 6);
  const previewPaths = [reg.logo_path, ...pastLogos.map((l) => l.logo_path)].filter(
    (p): p is string => !!p && /\.(png|jpe?g|gif|webp|svg)$/i.test(p),
  );
  const { data: signed } = previewPaths.length
    ? await supabase.storage.from("logos").createSignedUrls(previewPaths, 600)
    : { data: [] };
  const preview = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl as string]));

  // Sponsorships alphabetically, discount line last.
  const items = reg.registration_items.sort(
    (a, b) => Number(a.kind === "discount") - Number(b.kind === "discount") || a.name.localeCompare(b.name),
  );
  const payments = reg.payments.sort((a, b) => a.received_on.localeCompare(b.received_on));
  const total = items.reduce((s, i) => s + i.price_cents, 0);
  const paid = payments.reduce((s, p) => s + p.amount_cents, 0);
  const balance = total - paid;
  const pay = paymentStatus({ total_cents: total, paid_cents: paid, imported: reg.imported });

  return (
    <div className="space-y-6">
      <Link href="/admin" className="link text-sm">
        ← All sponsors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{reg.company_name}</h1>
          <p className="text-muted">
            #{invoiceNumber(reg.season, reg.number)} · signed up {formatDate(reg.created_at)}
          </p>
          <div className="mt-2 flex gap-2">
            <StatusBadge status={reg.status} />
            <PaymentBadge status={pay} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/invoice/${reg.public_token}`} target="_blank" className="btn-secondary">
            Invoice / receipt ↗
          </a>
          {reg.email && (
            <a href={`mailto:${reg.email}`} className="btn-secondary">
              Email sponsor
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sponsorships */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold">Sponsoring</h2>
          {reg.needs_division_help && (
            <p className="rounded-md bg-amber-100 p-3 text-sm text-amber-900">
              The sponsor wants a team but didn&apos;t know which division. Add the division below once decided,
              then untick &quot;Needs help choosing a division&quot; under Details.
            </p>
          )}
          <table className="table">
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className={i.kind === "discount" ? "text-brand-dark" : undefined}>
                  <td>{i.name}</td>
                  <td className="text-right">
                    {i.price_cents < 0 ? `−${money(-i.price_cents)}` : money(i.price_cents)}
                  </td>
                  <td className="w-0 text-right">
                    <form action={removeItem}>
                      <input type="hidden" name="id" value={i.id} />
                      <ConfirmButton
                        message={
                          i.kind === "discount"
                            ? "Remove the banner discount for this sponsor? (It comes back if you add or remove a division.)"
                            : `Remove ${i.name} from this sponsor?`
                        }
                      >
                        Remove
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold">Total</td>
                <td className="text-right font-semibold">{money(total)}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <form action={addItem} className="flex gap-2">
            <input type="hidden" name="registration_id" value={reg.id} />
            <select name="package_id" className="input" required defaultValue="">
              <option value="" disabled>
                Add a division or banner…
              </option>
              {(packages ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}: {money(p.price_cents)}
                  {p.active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            <button className="btn-secondary">Add</button>
          </form>
        </section>

        {/* Payments */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold">Payments</h2>
          {payments.length === 0 ? (
            <p className="text-muted">No payments recorded yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{formatDate(p.received_on)}</td>
                    <td>
                      {METHOD_LABELS[p.method]}
                      {p.reference && <span className="text-muted"> · {p.reference}</span>}
                      {p.recorded_by && <div className="text-xs text-muted">recorded by {p.recorded_by}</div>}
                    </td>
                    <td className="text-right">{money(p.amount_cents)}</td>
                    <td className="w-0 text-right">
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton message="Delete this payment record?">Delete</ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="flex justify-between font-semibold">
            <span>{balance >= 0 ? "Balance due" : "Overpaid by"}</span>
            <span>{money(Math.abs(balance))}</span>
          </p>

          <form action={addPayment} className="space-y-3 rounded-md border border-line p-3">
            <p className="font-semibold">Record a payment</p>
            <input type="hidden" name="registration_id" value={reg.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="amount">
                  Amount ($)
                </label>
                <input
                  id="amount"
                  name="amount"
                  required
                  inputMode="decimal"
                  pattern="\$?[0-9,]+(\.[0-9]{1,2})?"
                  defaultValue={balance > 0 ? (balance / 100).toFixed(2) : ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="method">
                  Method
                </label>
                <select id="method" name="method" className="input" defaultValue="zelle">
                  <option value="zelle">Zelle</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="reference">
                  Check # / reference
                </label>
                <input id="reference" name="reference" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="received_on">
                  Date received
                </label>
                <input
                  id="received_on"
                  name="received_on"
                  type="date"
                  required
                  defaultValue={todayISO()}
                  className="input"
                />
              </div>
            </div>
            <button className="btn">Record payment</button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Details</h2>
          <form action={updateRegistration} className="space-y-3">
            <input type="hidden" name="id" value={reg.id} />
            <Field label="Company / sponsor name" name="company_name" value={reg.company_name} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact name" name="contact_name" value={reg.contact_name} required />
              <Field label="Phone" name="phone" value={reg.phone} required />
            </div>
            <Field label="Email" name="email" type="email" value={reg.email} required />
            <div>
              <label className="label" htmlFor="address">
                Address
              </label>
              <textarea id="address" name="address" rows={3} defaultValue={reg.address} className="input" required />
            </div>
            <Field label="Player in the league (name and division)" name="player_info" value={reg.player_info ?? ""} />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="needs_division_help"
                defaultChecked={reg.needs_division_help}
                className="size-4 accent-brand"
              />
              Needs help choosing a division
            </label>
            <div>
              <label className="label" htmlFor="status">
                Status
              </label>
              <select id="status" name="status" defaultValue={reg.status} className="input">
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="notes">
                Internal notes (sponsors never see these)
              </label>
              <textarea id="notes" name="notes" rows={4} defaultValue={reg.notes ?? ""} className="input" />
            </div>
            <button className="btn">Save details</button>
          </form>
        </section>

        <div className="space-y-6">
          {/* Logo */}
          <section className="card space-y-3">
            <h2 className="text-lg font-bold">Logo</h2>
            {reg.logo_path ? (
              <div className="flex items-center gap-3">
                {preview.get(reg.logo_path) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.get(reg.logo_path)}
                    alt=""
                    className="h-16 w-24 rounded border border-line bg-white object-contain"
                  />
                )}
                <a href={`/admin/logo/${reg.id}`} target="_blank" className="link">
                  View / download logo ↗
                </a>
              </div>
            ) : (
              <p className="text-muted">No logo yet.</p>
            )}
            <form action={uploadLogo} className="space-y-2">
              <input type="hidden" name="id" value={reg.id} />
              <FileDropzone
                name="logo"
                required
                prompt={reg.logo_path ? "Drag a new logo here to replace it, or click" : "Drag the logo here, or click to choose"}
              />
              <button className="btn-secondary">{reg.logo_path ? "Replace logo" : "Upload logo"}</button>
            </form>

            {pastLogos.length > 0 && (
              <div className="space-y-2 border-t border-line pt-3">
                <p className="font-semibold">Logos from other seasons</p>
                <ul className="space-y-2">
                  {pastLogos.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-md bg-paper p-2">
                      {preview.get(l.logo_path) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview.get(l.logo_path)}
                          alt=""
                          className="h-12 w-20 rounded border border-line bg-white object-contain"
                        />
                      ) : (
                        <span className="flex h-12 w-20 items-center justify-center rounded border border-line bg-white text-xs text-muted uppercase">
                          {l.logo_path.split(".").pop()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <Link href={`/admin/registrations/${l.id}`} className="font-medium hover:underline">
                          {l.season}: {l.company_name}
                        </Link>
                        <div className="text-muted">
                          {l.match === "email"
                            ? "Same email"
                            : l.match === "linked"
                              ? "Linked sponsor"
                              : "Same company name"}{" "}
                          ·{" "}
                          <a href={`/admin/logo/${l.id}`} target="_blank" className="link">
                            view
                          </a>
                        </div>
                      </div>
                      <form action={copyLogoFrom}>
                        <input type="hidden" name="id" value={reg.id} />
                        <input type="hidden" name="from_id" value={l.id} />
                        {reg.logo_path ? (
                          <ConfirmButton
                            message="Replace this sponsor's current logo with this one?"
                            className="btn-secondary py-1 text-sm"
                          >
                            Use this logo
                          </ConfirmButton>
                        ) : (
                          <button className="btn-secondary py-1 text-sm">Use this logo</button>
                        )}
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="text-lg font-bold text-red-800">Delete</h2>
            <p className="text-sm text-muted">
              For spam or duplicate sign-ups only. To keep a record of a sponsor who backed out, set the status to
              Cancelled instead.
            </p>
            <form action={deleteRegistration}>
              <input type="hidden" name="id" value={reg.id} />
              <ConfirmButton
                message={`Permanently delete ${reg.company_name} and its payments? This can't be undone.`}
                className="btn-secondary text-red-700"
              >
                Delete this sign-up
              </ConfirmButton>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={value} required={required} className="input" />
    </div>
  );
}
