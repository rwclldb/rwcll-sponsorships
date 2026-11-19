"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/format";

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
  done();
}

export async function removeItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("registration_items").delete().eq("id", str(formData, "id"));
  check(error, "remove the sponsorship");
  done();
}

export async function uploadLogo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;

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
      notify_emails: str(formData, "notify_emails", 1000),
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

