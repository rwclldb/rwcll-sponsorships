import { connection } from "next/server";
import { PublicHeader } from "@/components/PublicHeader";
import { getActivePackages, getSettings } from "@/lib/public-data";
import { SignupForm } from "./SignupForm";

export default async function SponsorSignupPage() {
  await connection();
  const settings = await getSettings();
  const packages = settings.registration_open ? await getActivePackages(settings.current_season) : [];

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold">Become a {settings.current_season} sponsor</h1>
        <p className="mt-2 text-muted">
          Thank you for supporting Redwood City Little League! Sponsor a team in one or more divisions (your
          business name becomes the team name), or put your business on a banner.
        </p>

        {settings.registration_open && packages.length > 0 ? (
          <SignupForm packages={packages} />
        ) : (
          <div className="card mt-6">
            <p className="font-semibold">Sponsor registration is currently closed.</p>
            <p className="mt-1 text-muted">Please check back soon, or contact the league for more information.</p>
          </div>
        )}
      </main>
    </>
  );
}
