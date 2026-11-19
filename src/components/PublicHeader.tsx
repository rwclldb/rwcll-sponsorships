import { LeagueLogo } from "@/components/LeagueLogo";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="no-print bg-ink text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
        <Link href="/" className="shrink-0 rounded-lg bg-white p-1">
          <LeagueLogo width={56} alt="Redwood City Little League" priority />
        </Link>
        <div>
          <p className="text-lg font-bold leading-tight">Redwood City Little League</p>
          <p className="text-sm text-white/70">Sponsorships</p>
        </div>
      </div>
    </header>
  );
}
