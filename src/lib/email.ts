import "server-only";
import nodemailer from "nodemailer";

type Email = { to: string[]; subject: string; html: string; text?: string; replyTo?: string };
export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Two ways to send, both free:
 *  - SMTP, e.g. a Google/Gmail account with an app password:
 *      SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_USER=you@rwcll.org SMTP_PASS=<app password>
 *  - Resend (https://resend.com), which needs DNS records on the sending domain: RESEND_API_KEY
 * EMAIL_FROM sets the sender, e.g. "RWCLL Sponsorships <sponsors@rwcll.org>" (for Gmail it must be
 * the account's own address or one of its aliases; defaults to SMTP_USER).
 */
function provider(): "smtp" | "resend" | null {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return "resend";
  return null;
}

export function emailConfigured() {
  return provider() !== null;
}

function fromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "";
}

/** Sends an email. Never throws; reports what went wrong instead. */
export async function sendEmailDetailed({ to, subject, html, text, replyTo }: Email): Promise<SendResult> {
  const how = provider();
  if (!how) return { ok: false, error: "Email sending isn't set up on the server (no SMTP or Resend settings)." };
  if (to.length === 0) return { ok: false, error: "No recipients." };
  try {
    if (how === "smtp") {
      const port = Number(process.env.SMTP_PORT || 465);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: fromAddress(), to, subject, html, text, replyTo });
      return { ok: true };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to, subject, html, text, reply_to: replyTo }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Email failed", res.status, body);
      return { ok: false, error: `Resend refused the email (${res.status}): ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Email failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Sends an email; returns true if it went out. */
export async function sendEmail(email: Email) {
  return (await sendEmailDetailed(email)).ok;
}

/** "a@x.org, b@y.com; c@z.net" → valid, de-duplicated addresses. */
export function parseEmailList(list: string) {
  return [
    ...new Set(
      list
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)),
    ),
  ];
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
