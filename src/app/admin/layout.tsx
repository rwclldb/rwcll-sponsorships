import type { Metadata } from "next";
import { LeagueLogo } from "@/components/LeagueLogo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../login/actions";

export const metadata: Metadata = {
  title: "Admin — RWCLL Sponsorships",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Sponsors" },
  { href: "/admin/sponsors", label: "Past sponsors" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { email } = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="no-print bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="rounded-md bg-white p-0.5">
              <LeagueLogo width={36} />
            </span>
            <span className="font-bold">RWCLL Sponsorships</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10">
                {n.label}
              </Link>
            ))}
            <Link href="/" target="_blank" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10">
              Sign-up form ↗
            </Link>
          </nav>
          <form action={signOut} className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-white/70 sm:inline">{email}</span>
            <button className="rounded-md px-3 py-1.5 hover:bg-white/10">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
