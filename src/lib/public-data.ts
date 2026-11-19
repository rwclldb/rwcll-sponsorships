import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { publicAssetUrl } from "@/lib/site";
import type { Package, Settings } from "@/lib/types";

export async function getSettings(): Promise<Settings> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("settings")
    .select(
      "current_season, registration_open, email_notifications, notify_emails, payment_instructions, zelle_qr_path",
    )
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}

export async function getActivePackages(season: string): Promise<Package[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("packages")
    .select("*")
    .eq("season", season)
    .eq("active", true)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data;
}

/** Uploaded QR code if there is one, otherwise the one shipped in /public. */
export function zelleQrUrl(settings: Pick<Settings, "zelle_qr_path">) {
  return settings.zelle_qr_path ? publicAssetUrl("site", settings.zelle_qr_path) : DEFAULT_ZELLE_QR;
}

export const DEFAULT_ZELLE_QR = "/RWCLL_zelle.jpg";
