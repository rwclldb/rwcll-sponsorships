import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/** Redirects an admin to a short-lived link for a sponsor's private logo file. */
export async function GET(_req: Request, ctx: RouteContext<"/admin/logo/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await ctx.params;

  const { data: reg } = await supabase.from("registrations").select("logo_path").eq("id", id).maybeSingle();
  if (!reg?.logo_path) return new NextResponse("No logo", { status: 404 });

  const { data, error } = await supabase.storage.from("logos").createSignedUrl(reg.logo_path, 120);
  if (error || !data) return new NextResponse("Couldn't open logo", { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
