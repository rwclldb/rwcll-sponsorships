import "server-only";
import { escapeHtml as e } from "@/lib/email";
import { formatDate, money } from "@/lib/format";

/** Everything the sign-up emails need. */
export type SignupEmailData = {
  season: string;
  number: string;
  createdAt: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  playerInfo: string | null;
  needsDivisionHelp: boolean;
  items: { kind: string; name: string; price_cents: number }[];
  totalCents: number;
  hasLogo: boolean;
  adminUrl: string;
  invoiceUrl: string;
};

const amount = (c: number) => (c < 0 ? `−${money(-c)}` : money(c));
const td = 'style="padding:6px 10px;border-bottom:1px solid #e5e9e5;vertical-align:top"';
const th = 'style="padding:6px 10px;border-bottom:1px solid #e5e9e5;text-align:left;color:#646b65;font-weight:normal;white-space:nowrap;vertical-align:top"';

function itemsTable(d: SignupEmailData) {
  const rows = d.items
    .map(
      (i) =>
        `<tr><td ${td}>${e(i.name)}</td><td ${td} align="right">${amount(i.price_cents)}</td></tr>`,
    )
    .join("");
  const help = d.needsDivisionHelp
    ? `<tr><td ${td} colspan="2"><em>Wants a team sponsorship but doesn't know which division. Please follow up.</em></td></tr>`
    : "";
  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:520px">
${rows}${help}
<tr><td ${td}><strong>Total</strong></td><td ${td} align="right"><strong>${money(d.totalCents)}</strong></td></tr>
</table>`;
}

function itemsText(d: SignupEmailData) {
  return [
    ...d.items.map((i) => `  - ${i.name}: ${amount(i.price_cents)}`),
    ...(d.needsDivisionHelp ? ["  - Wants a team but doesn't know which division (follow up)"] : []),
    `  Total: ${money(d.totalCents)}`,
  ].join("\n");
}

/** Sent to the people listed in Settings when someone signs up. */
export function newSponsorAlert(d: SignupEmailData) {
  const details: [string, string][] = [
    ["Sponsor", d.companyName],
    ["Contact", d.contactName],
    ["Email", d.email],
    ["Phone", d.phone],
    ["Address", d.address],
    ["Player in league", d.playerInfo || "No"],
    ["Logo", d.hasLogo ? "Uploaded (see admin page)" : "Not yet, will send later"],
    ["Invoice #", d.number],
    ["Signed up", formatDate(d.createdAt)],
  ];
  const subject = `New ${d.season} sponsor: ${d.companyName} (${money(d.totalCents)})`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222622">
<h2 style="margin:0 0 4px">New sponsor sign-up</h2>
<p style="margin:0 0 16px;color:#646b65">Redwood City Little League · ${e(d.season)} season</p>
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:520px;margin-bottom:16px">
${details
  .map(([k, v]) => `<tr><th ${th}>${e(k)}</th><td ${td}>${e(v).replace(/\r?\n/g, "<br>")}</td></tr>`)
  .join("\n")}
</table>
<h3 style="margin:0 0 6px">Sponsoring</h3>
${itemsTable(d)}
<p style="margin:20px 0 6px">
  <a href="${d.adminUrl}" style="background:#2eaf4a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Open in the admin page</a>
</p>
<p style="color:#646b65;font-size:12px">Sponsor's invoice: <a href="${d.invoiceUrl}">${d.invoiceUrl}</a><br>
Replying to this email goes to the sponsor.</p>
</div>`;
  const text = `New ${d.season} sponsor sign-up

${details.map(([k, v]) => `${k}: ${v.replace(/\r?\n/g, ", ")}`).join("\n")}

Sponsoring:
${itemsText(d)}

Admin page: ${d.adminUrl}
Sponsor's invoice: ${d.invoiceUrl}`;
  return { subject, html, text };
}

/** Sent to the sponsor right after they sign up. */
export function sponsorThankYou(d: SignupEmailData) {
  const subject = `Thank you for sponsoring Redwood City Little League (#${d.number})`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222622">
<p>Hi ${e(d.contactName)},</p>
<p>Thank you for sponsoring Redwood City Little League for the ${e(d.season)} season! We received your sign-up for <strong>${e(d.companyName)}</strong>:</p>
${itemsTable(d)}
<p style="margin:20px 0">
  <a href="${d.invoiceUrl}" style="background:#2eaf4a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">View your invoice and payment instructions</a>
</p>
${d.hasLogo ? "" : "<p>If you have a logo for your team or banner, just reply to this email with it attached.</p>"}
<p>Thank you,<br>Redwood City Little League</p>
</div>`;
  const text = `Hi ${d.contactName},

Thank you for sponsoring Redwood City Little League for the ${d.season} season! We received your sign-up for ${d.companyName}:
${itemsText(d)}

Your invoice and payment instructions: ${d.invoiceUrl}
${d.hasLogo ? "" : "\nIf you have a logo for your team or banner, just reply to this email with it attached.\n"}
Thank you,
Redwood City Little League`;
  return { subject, html, text };
}
