"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type LoginState = { step: "email" | "code"; email?: string; error?: string; message?: string };

const ALLOWED_DOMAIN = "@rwcll.org";

export async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return { step: "email", email, error: `Please use your ${ALLOWED_DOMAIN} email address.` };
  }

  const { data: admin } = await createServiceClient().from("admins").select("email").eq("email", email).maybeSingle();
  if (!admin) {
    return {
      step: "email",
      email,
      error: "That email isn't set up as a sponsorship admin. Ask an existing admin to add you.",
    };
  }

  const supabase = await createClient();
  // If they click the emailed link instead of typing the code, send them back to this same site.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host ?? "") ? "http" : "https");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${proto}://${host}/auth/callback` },
  });
  if (error) {
    console.error("signInWithOtp failed", error);
    return { step: "email", email, error: "We couldn't send a code right now. Please try again in a minute." };
  }

  return { step: "code", email, message: `We emailed a sign-in code to ${email}. Type the code below, or click the link in the email.` };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, error: "That code didn't work. Check it and try again, or request a new one." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
