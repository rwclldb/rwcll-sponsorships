"use server";

import { redirect } from "next/navigation";
import { parseEmailList, sendEmail } from "@/lib/email";
import { newSponsorAlert, sponsorThankYou } from "@/lib/email-templates";
import { bannerDiscount, discountLabel } from "@/lib/discount";
import { getBannerTiers } from "@/lib/discount-server";
import { invoiceNumber } from "@/lib/format";
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

  // Embedded on the league website: stay in the embedded pages.
  const base = formData.get("embed") === "1" ? "/embed" : "";

  // Bots fill in the hidden "website" field. Pretend it worked.
  if (text(formData, "website")) redirect(base || "/");

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
    .select("id, number, public_token, created_at")
    .single();

  if (regError || !reg) {
    console.error("Registration insert failed", regError);
    if (logoPath) await db.storage.from("logos").remove([logoPath]);
    return fail("Something went wrong saving your sponsorship. Please try again.");
  }

  const discount = bannerDiscount(await getBannerTiers(db, season), packages);
  if (packages.length > 0) {
    const { error: itemsError } = await db.from("registration_items").insert([
      ...packages.map((p) => ({
        registration_id: reg.id,
        package_id: p.id,
        kind: p.kind,
        name: p.name,
        price_cents: p.price_cents,
      })),
      ...(discount > 0
        ? [{ registration_id: reg.id, kind: "discount", name: discountLabel(packages), price_cents: -discount }]
        : []),
    ]);
    if (itemsError) {
      console.error("Registration items insert failed", itemsError);
      await db.from("registrations").delete().eq("id", reg.id);
      if (logoPath) await db.storage.from("logos").remove([logoPath]);
      return fail("Something went wrong saving your sponsorship. Please try again.");
    }
  }

  const alertTo = settings.email_notifications ? parseEmailList(settings.notify_emails) : [];
  if (alertTo.length || settings.notify_sponsor) {
    const site = await siteUrl();
    const data = {
      season,
      number: invoiceNumber(season, reg.number),
      createdAt: reg.created_at,
      companyName: values.company_name,
      contactName: values.contact_name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      playerInfo: hasPlayer ? values.player_info : null,
      needsDivisionHelp,
      items: [
        ...packages.map((p) => ({ kind: p.kind, name: p.name, price_cents: p.price_cents })),
        ...(discount > 0 ? [{ kind: "discount", name: discountLabel(packages), price_cents: -discount }] : []),
      ],
      totalCents: packages.reduce((sum, p) => sum + p.price_cents, 0) - discount,
      hasLogo: Boolean(logoPath),
      adminUrl: `${site}/admin/registrations/${reg.id}`,
      invoiceUrl: `${site}/invoice/${reg.public_token}`,
    };
    // Emails never block the sign-up; failures are logged.
    await Promise.all([
      alertTo.length ? sendEmail({ to: alertTo, replyTo: values.email, ...newSponsorAlert(data) }) : null,
      settings.notify_sponsor
        ? sendEmail({
            to: [values.email],
            // Sponsor replies (e.g. with their logo) go to the people who get the alerts.
            replyTo: alertTo.length ? alertTo.join(", ") : undefined,
            ...sponsorThankYou(data),
          })
        : null,
    ]);
  }

  redirect(`${base}/invoice/${reg.public_token}?new=1`);
}
