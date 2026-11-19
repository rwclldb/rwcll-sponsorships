import { notFound } from "next/navigation";
import { LeagueLogo } from "@/components/LeagueLogo";
import { PrintButton } from "@/components/PrintButton";
import { formatDate, invoiceNumber, METHOD_LABELS, money } from "@/lib/format";
import { getSettings, zelleQrUrl } from "@/lib/public-data";
import { createServiceClient } from "@/lib/supabase/service";
import type { Payment, Registration, RegistrationItem } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The invoice/receipt for a sign-up's private link. Used by the normal page and the embedded
 * (league website) version; `embedded` swaps the print button for a link to the full page.
 */
export async function InvoiceView({ token, isNew, embedded }: { token: string; isNew: boolean; embedded?: boolean }) {
  if (!UUID_RE.test(token)) notFound();

  const db = createServiceClient();
  const { data: reg } = await db
    .from("registrations")
    .select("*")
    .eq("public_token", token)
    .maybeSingle<Registration>();
  if (!reg) notFound();

  const [{ data: items }, { data: payments }, settings] = await Promise.all([
    db.from("registration_items").select("*").eq("registration_id", reg.id).order("name").returns<RegistrationItem[]>(),
    db.from("payments").select("*").eq("registration_id", reg.id).order("received_on").returns<Payment[]>(),
    getSettings(),
  ]);

  // Discount lines go after the sponsorships they apply to.
  items?.sort((a, b) => Number(a.kind === "discount") - Number(b.kind === "discount"));
  const total = (items ?? []).reduce((sum, i) => sum + i.price_cents, 0);
  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  const balance = total - paid;
  const paidInFull = total > 0 && balance <= 0;
  const qr = zelleQrUrl(settings);
  const number = invoiceNumber(reg.season, reg.number);

  return (
    <>
      <main className={`mx-auto max-w-3xl print:max-w-none print:p-0 ${embedded ? "px-1 py-2" : "px-4 py-8"}`}>
        {isNew && (
          <div className="no-print mb-6 rounded-xl border border-brand bg-brand/10 p-5">
            <p className="text-lg font-bold">Thank you! Your sponsorship has been received.</p>
            <p className="mt-1">
              Please pay using the instructions below.{" "}
              {embedded
                ? "We've also kept a printable copy of your invoice for you (link at the bottom)."
                : "Bookmark or print this page. It's your invoice, and it will show as a receipt once your payment has been recorded."}
            </p>
          </div>
        )}

        {reg.status === "cancelled" && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
            This sponsorship has been cancelled.
          </div>
        )}

        <article className="card print:border-0 print:p-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div className="flex items-center gap-3">
              <LeagueLogo width={72} />
              <div>
                <p className="text-lg font-bold">Redwood City Little League</p>
                <p className="text-sm text-muted">Redwood City, CA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-wide">{paidInFull ? "RECEIPT" : "INVOICE"}</p>
              <p className="text-sm text-muted">No. {number}</p>
              <p className="text-sm text-muted">Date: {formatDate(reg.created_at)}</p>
              <p className="text-sm text-muted">Season: {reg.season}</p>
            </div>
          </div>

          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Bill to</p>
              <p className="font-semibold">{reg.company_name}</p>
              <p>{reg.contact_name}</p>
              <p className="whitespace-pre-line">{reg.address}</p>
              <p>{reg.email}</p>
              <p>{reg.phone}</p>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.kind === "team" ? "Team sponsorship: " : i.kind === "banner" ? "Banner sponsorship: " : ""}
                    {i.name}
                  </td>
                  <td className="text-right">
                    {i.price_cents < 0 ? `−${money(-i.price_cents)}` : money(i.price_cents)}
                  </td>
                </tr>
              ))}
              {reg.needs_division_help && (
                <tr>
                  <td colSpan={2} className="text-muted italic">
                    Team sponsorship, division to be decided. The league will contact you and update this invoice.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-right font-semibold">Total</td>
                <td className="text-right font-semibold">{money(total)}</td>
              </tr>
              {(payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="text-right text-muted">
                    Payment received {formatDate(p.received_on)} ({METHOD_LABELS[p.method]}
                    {p.reference ? ` ${p.reference}` : ""})
                  </td>
                  <td className="text-right text-muted">−{money(p.amount_cents)}</td>
                </tr>
              ))}
              <tr>
                <td className="text-right text-lg font-bold">{balance > 0 ? "Balance due" : "Balance"}</td>
                <td className="text-right text-lg font-bold">{money(Math.max(balance, 0))}</td>
              </tr>
            </tfoot>
          </table>

          {paidInFull ? (
            <p className="mt-6 rounded-md bg-brand/10 p-4 font-semibold text-brand-dark">
              Paid in full. Thank you for supporting Redwood City Little League!
            </p>
          ) : (
            balance > 0 &&
            reg.status !== "cancelled" && (
              <section className="mt-6 grid items-start gap-6 border-t border-line pt-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-bold">How to pay</h2>
                  <p className="mt-2 whitespace-pre-line">{settings.payment_instructions}</p>
                  <p className="mt-3 text-sm text-muted">Please include invoice number {number} with your payment.</p>
                </div>
                {qr && (
                  <figure className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} alt="Zelle QR code" className="mx-auto h-64 w-64 object-contain print:h-52 print:w-52" />
                    <figcaption className="mt-1 text-sm text-muted">Scan to pay with Zelle</figcaption>
                  </figure>
                )}
              </section>
            )
          )}
        </article>

        <div className="no-print mt-6 flex flex-wrap gap-3">
          {embedded ? (
            <a href={`/invoice/${token}`} target="_blank" rel="noopener" className="btn-secondary">
              Open printable invoice ↗
            </a>
          ) : (
            <PrintButton />
          )}
        </div>
      </main>
    </>
  );
}
