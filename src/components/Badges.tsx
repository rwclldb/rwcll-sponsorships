import { STATUS_LABELS } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-900",
  confirmed: "bg-sky-100 text-sky-900",
  cancelled: "bg-gray-200 text-gray-700 line-through",
};

const PAYMENT: Record<string, { label: string; style: string }> = {
  unpaid: { label: "Unpaid", style: "bg-red-100 text-red-800" },
  partial: { label: "Partly paid", style: "bg-amber-100 text-amber-900" },
  paid: { label: "Paid", style: "bg-green-100 text-green-800" },
  overpaid: { label: "Overpaid", style: "bg-purple-100 text-purple-800" },
  none: { label: "No charge yet", style: "bg-gray-100 text-gray-700" },
  untracked: { label: "Not tracked", style: "bg-gray-100 text-gray-700" },
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? ""}`}>{STATUS_LABELS[status] ?? status}</span>;
}

export function PaymentBadge({ status }: { status: string }) {
  const p = PAYMENT[status] ?? PAYMENT.none;
  return <span className={`badge ${p.style}`}>{p.label}</span>;
}
