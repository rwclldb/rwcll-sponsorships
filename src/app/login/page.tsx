import type { Metadata } from "next";
import { LeagueLogo } from "@/components/LeagueLogo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in — RWCLL Sponsorships" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;
  const initialError =
    error === "not-admin"
      ? "That account isn't set up as a sponsorship admin. Ask an existing admin to add you."
      : error === "link"
        ? "That sign-in link didn't work (it may have expired, or been opened in a different browser). Request a new code below."
        : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LeagueLogo width={96} alt="Redwood City Little League" priority />
          <h1 className="mt-3 text-xl font-bold">Sponsorship admin</h1>
        </div>
        <LoginForm initialError={initialError} />
      </div>
    </main>
  );
}
