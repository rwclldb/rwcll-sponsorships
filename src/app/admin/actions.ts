"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseEmailList, sendEmailDetailed } from "@/lib/email";
import { newSponsorAlert } from "@/lib/email-templates";
import { invoiceNumber, parseMoney } from "@/lib/format";
import { requestOrigin } from "@/lib/site";
import { syncDiscount } from "@/lib/discount-server";
import { getSponsorLinks } from "@/lib/links";
import { copyLogo, getLogoSources, pastLogosFor } from "@/lib/logos";

function str(formData: FormData, name: string, max = 1000) {
  return String(formData.get(name) ?? "")
    .trim()
    .slice(0, max);
}

function done(path = "/admin") {
  revalidatePath(path, "layout");
}

function check(error: { message: string } | null, what: string) {
  if (error) {
    console.error(what, error);
    throw new Error(`Couldn't ${what}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

/** Admin-entered sign-up for any season (including past ones not in an upload). */
export async function createRegistration(formData: FormData) {
  const { supabase } = await requireAdmin();
  const season = str(formData, "season", 50);
  const company = str(formData, "company_name", 200);
  if (!season || !company) throw new Error("Season and company name are required.");

  const packageIds = formData.getAll("package").map(String);
  const { data: packages, error: pkgError } = packageIds.length
    ? await supabase.from("packages").select("id, kind, name, price_cents").eq("season", season).in("id", packageIds)
    : { data: [], error: null };
  check(pkgError, "read packages");

  // Signed-up date: noon Pacific on the chosen day (or now).
  const date = str(formData, "signed_up_on");
  const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T20:00:00Z`).toISOString() : undefined;
  const status = str(formData, "status");

  const { data: reg, error } = await supabase
    .from("registrations")
    .insert({
      season,
      created_at: createdAt,
      company_name: company,
      contact_name: str(formData, "contact_name", 200),
      email: str(formData, "email", 200).toLowerCase(),
      phone: str(formData, "phone", 50),
      address: str(formData, "address", 500),
      player_info: str(formData, "player_info", 300) || null,
      needs_division_help: formData.get("needs_division_help") === "on",
      status: ["new", "confirmed", "cancelled"].includes(status) ? status : "confirmed",
      imported: formData.get("payment_untracked") === "on",
      notes: str(formData, "notes", 5000) || null,
    })
    .select("id")
    .single();
  check(error, "add the sponsor");

  if (packages?.length) {
    const { error: itemsError } = await supabase.from("registration_items").insert(
      packages.map((p) => ({
        registration_id: reg!.id,
        package_id: p.id,
        kind: p.kind,
        name: p.name,
        price_cents: p.price_cents,
      })),
    );
    if (itemsError) {
      await supabase.from("registrations").delete().eq("id", reg!.id);
      check(itemsError, "add the sponsorships");
    }
    await syncDiscount(supabase, reg!.id);
  }

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const ext = (logo.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${season}/${crypto.randomUUID()}.${ext}`;
    const { error: upError } = await supabase.storage
      .from("logos")
      .upload(path, logo, { contentType: logo.type || "application/octet-stream" });
    check(upError, "upload the logo");
    await supabase.from("registrations").update({ logo_path: path }).eq("id", reg!.id);
  }

  done();
  redirect(`/admin/registrations/${reg!.id}`);
}

/** Copies one past sign-up's logo onto this sign-up. */
export async function copyLogoFrom(formData: FormData) {
  const { supabase } = await requireAdmin();
  const [{ data: to }, { data: from }] = await Promise.all([
    supabase.from("registrations").select("id, season, logo_path").eq("id", str(formData, "id")).single(),
    supabase.from("registrations").select("logo_path").eq("id", str(formData, "from_id")).single(),
  ]);
  if (!to || !from?.logo_path) throw new Error("Couldn't find that logo.");
  await copyLogo(supabase, from.logo_path, to);
  done();
}

/** For every sign-up in a season with no logo, copies the sponsor's most recent past logo. */
export async function copyPastLogos(formData: FormData) {
  const { supabase } = await requireAdmin();
  const season = str(formData, "season", 50);
  const [{ data: missing, error }, sources, links] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, season, email, company_name, logo_path")
      .eq("season", season)
      .is("logo_path", null)
      .neq("status", "cancelled"),
    getLogoSources(supabase),
    getSponsorLinks(supabase),
  ]);
  check(error, "find sponsors without logos");
  for (const reg of missing ?? []) {
    const best = pastLogosFor(reg, sources, links)[0];
    if (best) await copyLogo(supabase, best.logo_path, reg);
  }
  done();
}

export async function updateRegistration(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  const { error } = await supabase
    .from("registrations")
    .update({
      company_name: str(formData, "company_name", 200),
      contact_name: str(formData, "contact_name", 200),
      email: str(formData, "email", 200).toLowerCase(),
      phone: str(formData, "phone", 50),
      address: str(formData, "address", 500),
      player_info: str(formData, "player_info", 300) || null,
      needs_division_help: formData.get("needs_division_help") === "on",
      status: ["new", "confirmed", "cancelled"].includes(status) ? status : "new",
      notes: str(formData, "notes", 5000) || null,
    })
    .eq("id", id);
  check(error, "save the sponsor");
  done();
}

export async function setStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = str(formData, "status");
  if (!["new", "confirmed", "cancelled"].includes(status)) return;
  const { error } = await supabase.from("registrations").update({ status }).eq("id", str(formData, "id"));
  check(error, "update the status");
  done();
}

export async function deleteRegistration(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data: reg } = await supabase.from("registrations").select("logo_path").eq("id", id).single();
  const { error } = await supabase.from("registrations").delete().eq("id", id);
  check(error, "delete the sponsor");
  if (reg?.logo_path) await supabase.storage.from("logos").remove([reg.logo_path]);
  done();
  redirect("/admin");
}

export async function addItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const registrationId = str(formData, "registration_id");
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, kind, name, price_cents")
    .eq("id", str(formData, "package_id"))
    .single();
  check(pkgError, "find that package");
  const { error } = await supabase.from("registration_items").insert({
    registration_id: registrationId,
    package_id: pkg!.id,
    kind: pkg!.kind,
    name: pkg!.name,
    price_cents: pkg!.price_cents,
  });
  check(error, "add the sponsorship");
  await syncDiscount(supabase, registrationId);
  done();
}

export async function removeItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { data: item, error } = await supabase
    .from("registration_items")
    .delete()
    .eq("id", str(formData, "id"))
    .select("registration_id, kind")
    .single();
  check(error, "remove the sponsorship");
  // Removing a team or banner can change the banner discount. (Removing the discount line itself
  // leaves it off.)
  if (item && item.kind !== "discount") await syncDiscount(supabase, item.registration_id);
  done();
}

export async function uploadLogo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 4 * 1024 * 1024) throw new Error("Logo files must be under 4 MB.");

  const { data: reg, error: regError } = await supabase
    .from("registrations")
    .select("season, logo_path")
    .eq("id", id)
    .single();
  check(regError, "find the sponsor");

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${reg!.season}/${crypto.randomUUID()}.${ext}`;
  const { error: upError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  check(upError, "upload the logo");

  const { error } = await supabase.from("registrations").update({ logo_path: path }).eq("id", id);
  check(error, "save the logo");
  if (reg!.logo_path) await supabase.storage.from("logos").remove([reg!.logo_path]);
  done();
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function addPayment(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const amount = parseMoney(str(formData, "amount"));
  if (!amount || amount <= 0) throw new Error("Enter a payment amount greater than $0.");
  const method = str(formData, "method");
  const { error } = await supabase.from("payments").insert({
    registration_id: str(formData, "registration_id"),
    amount_cents: amount,
    method: ["check", "zelle", "cash", "other"].includes(method) ? method : "other",
    reference: str(formData, "reference", 200) || null,
    received_on: str(formData, "received_on") || undefined,
    recorded_by: email,
  });
  check(error, "record the payment");
  done();
}

export async function deletePayment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("payments").delete().eq("id", str(formData, "id"));
  check(error, "delete the payment");
  done();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const season = str(formData, "current_season", 50);
  if (!season) throw new Error("Season can't be blank.");
  const { error } = await supabase
    .from("settings")
    .update({
      current_season: season,
      registration_open: formData.get("registration_open") === "on",
      email_notifications: formData.get("email_notifications") === "on",
      notify_sponsor: formData.get("notify_sponsor") === "on",
      // Store a tidy list: valid addresses only, comma-separated.
      notify_emails: parseEmailList(str(formData, "notify_emails", 2000)).join(", "),
      payment_instructions: str(formData, "payment_instructions", 5000),
    })
    .eq("id", 1);
  check(error, "save settings");
  done("/");
}

export async function uploadZelleQr(formData: FormData) {
  const { supabase } = await requireAdmin();
  const file = formData.get("qr");
  if (!(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/")) throw new Error("The QR code must be an image file.");

  const { data: settings } = await supabase.from("settings").select("zelle_qr_path").eq("id", 1).single();
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `zelle-qr-${Date.now()}.${ext}`;
  const { error: upError } = await supabase.storage.from("site").upload(path, file, { contentType: file.type });
  check(upError, "upload the QR code");
  const { error } = await supabase.from("settings").update({ zelle_qr_path: path }).eq("id", 1);
  check(error, "save the QR code");
  if (settings?.zelle_qr_path) await supabase.storage.from("site").remove([settings.zelle_qr_path]);
  done("/");
}

export async function savePackage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const price = parseMoney(str(formData, "price"));
  if (price === null) throw new Error("Enter a valid price, like 500.");
  const kind = str(formData, "kind") === "banner" ? "banner" : "team";
  const values = {
    name: str(formData, "name", 100),
    kind,
    price_cents: price,
    sort_order: Number(str(formData, "sort_order")) || 0,
    active: formData.get("active") === "on",
  };
  if (!values.name) throw new Error("Package name can't be blank.");

  const id = str(formData, "id");
  const { error } = id
    ? await supabase.from("packages").update(values).eq("id", id)
    : await supabase.from("packages").insert({ ...values, season: str(formData, "season", 50) });
  check(error, "save the package");
  done("/");
}

export async function copyPackages(formData: FormData) {
  const { supabase } = await requireAdmin();
  const from = str(formData, "from_season");
  const to = str(formData, "to_season");
  const { data: source, error: readError } = await supabase.from("packages").select("*").eq("season", from);
  check(readError, "read packages");
  if (!source?.length) return;
  const { error } = await supabase.from("packages").insert(
    source.map((p) => ({
      season: to,
      kind: p.kind,
      name: p.name,
      price_cents: p.price_cents,
      sort_order: p.sort_order,
      active: p.active,
    })),
  );
  check(error, "copy packages");
  done("/");
}

export async function addAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = str(formData, "email", 200).toLowerCase();
  if (!email.endsWith("@rwcll.org")) throw new Error("Admins must use an @rwcll.org email address.");
  const { error } = await supabase.from("admins").upsert({ email });
  check(error, "add the admin");
  done();
}

export async function removeAdmin(formData: FormData) {
  const { supabase, email: me } = await requireAdmin();
  const email = str(formData, "email").toLowerCase();
  if (email === me.toLowerCase()) throw new Error("You can't remove yourself.");
  const { error } = await supabase.from("admins").delete().eq("email", email);
  check(error, "remove the admin");
  done();
}

export async function setMyPassword(formData: FormData) {
  const { supabase } = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) throw new Error("Please use at least 10 characters.");
  if (password !== String(formData.get("confirm") ?? "")) throw new Error("The passwords didn't match.");
  const { error } = await supabase.auth.updateUser({ password });
  check(error, "change your password");
  redirect("/admin/settings?password=changed");
}

/** Saves a season's banner discount: amount off for the 1st team, 2nd team, … (blank = none). */
export async function saveBannerDiscount(formData: FormData) {
  const { supabase } = await requireAdmin();
  const season = str(formData, "season", 50);
  const tiers = formData.getAll("tier").map((v) => {
    const text = String(v).trim();
    if (!text) return 0;
    const cents = parseMoney(text);
    if (cents === null) throw new Error(`"${text}" isn't a valid amount.`);
    return cents;
  });
  while (tiers.length && !tiers[tiers.length - 1]) tiers.pop();
  const { error } = await supabase
    .from("season_discounts")
    .upsert({ season, banner_tiers: tiers, updated_at: new Date().toISOString() });
  check(error, "save the banner discount");
  done("/");
}

// ---------------------------------------------------------------------------
// Sponsor links (Past sponsors)
// ---------------------------------------------------------------------------

/** Joins two or more sponsors (by their keys on Past sponsors) into one. */
export async function linkSponsors(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const keys = [...new Set(formData.getAll("key").map((k) => String(k).trim()).filter(Boolean))];
  if (keys.length < 2) throw new Error("Tick at least two sponsors to link.");
  const [target, ...others] = keys;

  for (const key of others) {
    // Anything already linked under this sponsor moves along with it.
    const { error: moveError } = await supabase.from("sponsor_links").update({ group_key: target }).eq("group_key", key);
    check(moveError, "link sponsors");
    const { error } = await supabase
      .from("sponsor_links")
      .upsert({ member_key: key, group_key: target, created_by: email });
    check(error, "link sponsors");
  }
  done();
}

/** Splits one record back out of a linked sponsor. */
export async function unlinkSponsor(formData: FormData) {
  const { supabase } = await requireAdmin();
  const key = str(formData, "key");
  const { data: own } = await supabase.from("sponsor_links").select("member_key").eq("member_key", key).maybeSingle();
  if (own) {
    const { error } = await supabase.from("sponsor_links").delete().eq("member_key", key);
    check(error, "unlink");
  } else {
    // It's the group's main record: hand the group to another member first.
    const { data: members } = await supabase.from("sponsor_links").select("member_key").eq("group_key", key).limit(1);
    const next = members?.[0]?.member_key;
    if (next) {
      // Remove the new main record's own link first, then point the rest at it.
      const { error } = await supabase.from("sponsor_links").delete().eq("member_key", next);
      check(error, "unlink");
      const { error: moveError } = await supabase.from("sponsor_links").update({ group_key: next }).eq("group_key", key);
      check(moveError, "unlink");
    }
  }
  done();
}

/** Sends a sample new-sponsor alert to the addresses currently in the box (saved or not). */
export async function sendTestAlert(formData: FormData) {
  await requireAdmin();
  const to = parseEmailList(str(formData, "notify_emails", 2000));
  let result: string;
  if (to.length === 0) {
    result = "error:Add at least one email address to send the test to.";
  } else {
    const site = await requestOrigin();
    const season = str(formData, "current_season", 50) || "2027";
    const sent = await sendEmailDetailed({
      to,
      ...(() => {
        const t = newSponsorAlert({
          season,
          number: invoiceNumber(season, 0),
          createdAt: new Date().toISOString(),
          companyName: "Example Pizza Co (TEST, not a real sign-up)",
          contactName: "Pat Example",
          email: "pat@example.com",
          phone: "650-555-0100",
          address: "123 Main St\nRedwood City, CA 94061",
          playerInfo: "Sam Example, AAA",
          needsDivisionHelp: false,
          items: [
            { kind: "team", name: "AAA team", price_cents: 60000 },
            { kind: "banner", name: "Kiwanis banner", price_cents: 50000 },
            { kind: "discount", name: "Banner discount (sponsoring 1 team)", price_cents: -5000 },
          ],
          totalCents: 105000,
          hasLogo: true,
          adminUrl: `${site}/admin`,
          invoiceUrl: `${site}/`,
        });
        return { ...t, subject: `[TEST] ${t.subject}` };
      })(),
    });
    result = sent.ok ? `ok:${to.join(", ")}` : `error:${sent.error}`;
  }
  redirect(`/admin/settings?email_test=${encodeURIComponent(result)}#email`);
}

