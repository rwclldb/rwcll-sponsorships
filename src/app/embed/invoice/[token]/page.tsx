import type { Metadata } from "next";
import { EmbedFrame } from "@/components/EmbedFrame";
import { InvoiceView } from "@/components/InvoiceView";

export const metadata: Metadata = {
  title: "Sponsorship invoice — Redwood City Little League",
  robots: { index: false, follow: false },
};

export default async function EmbeddedInvoicePage(props: PageProps<"/embed/invoice/[token]">) {
  const { token } = await props.params;
  const { new: isNew } = await props.searchParams;
  return (
    <EmbedFrame>
      <InvoiceView token={token} isNew={Boolean(isNew)} embedded />
    </EmbedFrame>
  );
}
