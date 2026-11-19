import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Called once a day by Vercel Cron (see vercel.json). Free Supabase projects pause after
 * about a week without activity, which would break the sign-up form in the off-season;
 * a tiny daily query keeps the database awake.
 *
 * If CRON_SECRET is set in Vercel, Vercel sends it automatically and other callers are refused.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await createServiceClient().from("settings").select("id").eq("id", 1).single();
  if (error) {
    console.error("Keep-alive query failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
