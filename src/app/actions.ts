"use server";

import { redirect } from "next/navigation";
import { escapeHtml, sendEmail } from "@/lib/email";
import { invoiceNumber, money } from "@/lib/format";
import { getActivePackages, getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";

export type SignupState = {
  error?: string;
  values?: Record<string, string>;
};

const MAX_LOGO_BYTES = 4 * 1024 * 1024;
const LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf", "ai", "eps", "tif", "tiff", "heic"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string, max = 500) {
  return String(formData.get(name) ?? "")
    .trim()
    .slice(0, max);
}

export async function submitRegistration(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const values = {
    company_name: text(formData, "company_name", 200),
    contact_name: text(formData, "contact_name", 200),
    email: text(formData, "email", 200).toLowerCase(),
    phone: text(formData, "phone", 50),
    address: text(formData, "address", 500),
    player_info: text(formData, "player_info", 300),
  };
  const fail = (error: string): SignupState => ({ error, values });

  // Bots fill in the hidden "website" field. Pretend it worked.
  if (text(formData, "website")) redirect("/");

  if (!values.company_name || !values.contact_name || !values.phone || !values.address) {
    return fail("Please fill in all of the required fields.");
  }
  if (!EMAIL_RE.test(values.email)) return fail("Please enter a valid email address.");

  const hasPlayer = formData.get("has_player") === "yes";
  if (hasPlayer && !values.player_info) return fail("Please enter your player's name and division.");

  const settings = await getSettings();
  if (!settings.registration_open) return fail("Sorry, sponsor registration is currently closed.");

  const season = settings.current_season;
  const packageIds = formData.getAll("package").map(String);
  const packages = (await getActivePackages(season)).filter((p) => packageIds.includes(p.id));
  const needsDivisionHelp = formData.get("needs_division_help") === "on";
  if (packages.length === 0 && !needsDivisionHelp) {
    return fail("Please choose at least one sponsorship opportunity.");
  }

  const db = createServiceClient();

  // Optional logo upload.
  let logoPath: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const ext = (logo.name.split(".").pop() ?? "").toLowerCase();
    if (!LOGO_EXTENSIONS.includes(ext)) {
      return fail("Logo must be an image or PDF/AI/EPS/SVG file. You can also send it to us later.");
    }
    if (logo.size > MAX_LOGO_BYTES) {
      return fail("That logo file is larger than 4 MB. Please choose a smaller file or send it to us later.");
    }
    logoPath = `${season}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from("logos")
      .upload(logoPath, logo, { contentType: logo.type || "application/octet-stream" });
    if (error) {
      console.error("Logo upload failed", error);
      return fail("We couldn't upload your logo. Please try again, or submit without it and send it later.");
    }
  }

  const { data: reg, error: regError } = await db
    .from("registrations")
    .insert({
      season,
      email: values.email,
      company_name: values.company_name,
      contact_name: values.contact_name,
      phone: values.phone,
      address: values.address,
      player_info: hasPlayer ? values.player_info : null,
      needs_division_help: needsDivisionHelp,
      logo_path: logoPath,
    })
    .select("id, number, public_token")
    .single();

  if (regError || !reg) {
    console.error("Registration insert failed", regError);
    if (logoPath) await db.storage.from("logos").remove([logoPath]);
    return fail("Something went wrong saving your sponsorship. Please try again.");
  }

  if (packages.length > 0) {
    const { error: itemsError } = await db.from("registration_items").insert(
      packages.map((p) => ({
        registration_id: reg.id,
        package_id: p.id,
        kind: p.kind,
        name: p.name,
        price_cents: p.price_cents,
      })),
    );
    if (itemsError) {
      console.error("Registration items insert failed", itemsError);
      await db.from("registrations").delete().eq("id", reg.id);
      if (logoPath) await db.storage.from("logos").remove([logoPath]);
      return fail("Something went wrong saving your sponsorship. Please try again.");
    }
  }

  if (settings.email_notifications) {
    const base = await siteUrl();
    const invoiceUrl = `${base}/invoice/${reg.public_token}`;
    const total = packages.reduce((sum, p) => sum + p.price_cents, 0);
    const lines = packages.map((p) => `<li>${escapeHtml(p.name)} — ${money(p.price_cents)}</li>`).join("");
    const helpLine = needsDivisionHelp ? "<li>Team sponsorship, division to be decided</li>" : "";
    const number = invoiceNumber(season, reg.number);

    await Promise.all([
      sendEmail({
        to: [values.email],
        subject: `Thank you for sponsoring Redwood City Little League (#${number})`,
        html: `<p>Hi ${escapeHtml(values.contact_name)},</p>
<p>Thank you for sponsoring Redwood City Little League for the ${escapeHtml(season)} season! We received your registration for <strong>${escapeHtml(values.company_name)}</strong>:</p>
<ul>${lines}${helpLine}</ul>
<p><strong>Total: ${money(total)}</strong></p>
<p><a href="${invoiceUrl}">View your invoice and payment instructions</a></p>
<p>Thank you,<br>Redwood City Little League</p>`,
      }),
      sendEmail({
        to: settings.notify_emails
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        replyTo: values.email,
        subject: `New sponsor: ${values.company_name} (${money(total)})`,
        html: `<p><strong>${escapeHtml(values.company_name)}</strong> signed up as a sponsor.</p>
<ul>${lines}${helpLine}</ul>
<p>Contact: ${escapeHtml(values.contact_name)}, ${escapeHtml(values.email)}, ${escapeHtml(values.phone)}</p>
<p><a href="${base}/admin/registrations/${reg.id}">Open in the admin page</a></p>`,
      }),
    ]);
  }

  redirect(`/invoice/${reg.public_token}?new=1`);
}
