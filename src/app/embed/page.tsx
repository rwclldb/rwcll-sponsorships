import type { Metadata } from "next";
import { connection } from "next/server";
import { EmbedFrame } from "@/components/EmbedFrame";
import { getBannerTiers } from "@/lib/discount-server";
import { getActivePackages, getSettings } from "@/lib/public-data";
import { createServiceClient } from "@/lib/supabase/service";
import { SignupForm } from "../SignupForm";

export const metadata: Metadata = {
  title: "Sponsor Redwood City Little League",
  robots: { index: false, follow: false },
};

/** The sign-up form without the header, for the league website (see Admin > Settings > Website embed). */
export default async function EmbeddedSignupPage() {
  await connection();
  const settings = await getSettings();
  const [packages, tiers] = settings.registration_open
    ? await Promise.all([
        getActivePackages(settings.current_season),
        getBannerTiers(createServiceClient(), settings.current_season),
      ])
    : [[], []];

  return (
    <EmbedFrame>
      <div className="mx-auto max-w-3xl px-1 py-2">
        {settings.registration_open && packages.length > 0 ? (
          <SignupForm packages={packages} discountTiers={tiers} embedded />
        ) : (
          <div className="card">
            <p className="font-semibold">Sponsor registration for {settings.current_season} is currently closed.</p>
            <p className="mt-1 text-muted">Please check back soon, or contact the league for more information.</p>
          </div>
        )}
      </div>
    </EmbedFrame>
  );
}
