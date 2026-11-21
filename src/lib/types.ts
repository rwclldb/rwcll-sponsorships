export type PackageKind = "team" | "banner";

export type Package = {
  id: string;
  season: string;
  kind: PackageKind;
  name: string;
  price_cents: number;
  sort_order: number;
  active: boolean;
};

export type Settings = {
  current_season: string;
  registration_open: boolean;
  /** Send new-sponsor alerts to notify_emails. */
  email_notifications: boolean;
  /** Send the sponsor a thank-you email (may be missing until the migration runs). */
  notify_sponsor?: boolean;
  notify_emails: string;
  payment_instructions: string;
  zelle_qr_path: string | null;
};

export type RegistrationStatus = "new" | "confirmed" | "cancelled";

export type Registration = {
  id: string;
  number: number;
  public_token: string;
  season: string;
  created_at: string;
  updated_at: string;
  email: string;
  company_name: string;
  contact_name: string;
  address: string;
  phone: string;
  needs_division_help: boolean;
  player_info: string | null;
  logo_path: string | null;
  status: RegistrationStatus;
  notes: string | null;
  imported: boolean;
};

export type RegistrationItem = {
  id: string;
  registration_id: string;
  package_id: string | null;
  /** "discount" lines have a zero or negative price. */
  kind: PackageKind | "discount";
  name: string;
  price_cents: number;
};

export type PaymentMethod = "check" | "zelle" | "cash" | "other";

export type Payment = {
  id: string;
  registration_id: string;
  amount_cents: number;
  method: PaymentMethod;
  reference: string | null;
  received_on: string;
  recorded_by: string | null;
  created_at: string;
};
