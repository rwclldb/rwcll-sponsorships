import type { Metadata } from "next";
import { InvoiceView } from "@/components/InvoiceView";
import { PublicHeader } from "@/components/PublicHeader";

export const metadata: Metadata = {
  title: "Sponsorship invoice — Redwood City Little League",
  robots: { index: false, follow: false },
};

export default async function InvoicePage(props: PageProps<"/invoice/[token]">) {
  const { token } = await props.params;
  const { new: isNew } = await props.searchParams;
  return (
    <>
      <PublicHeader />
      <InvoiceView token={token} isNew={Boolean(isNew)} />
    </>
  );
}
