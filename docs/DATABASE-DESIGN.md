# Proposed Database Design

This is a conceptual design, not an applied schema. Review it before migrations are written.

## Core entities
- `user_profiles`: maps authenticated users to application roles and, for sponsor users, their authorized sponsor association.
- `sponsors`: permanent business identity, normalized name for duplicate detection, and basic business details.
- `sponsor_contacts`: multiple contacts per sponsor, with contact details and optional billing/contact flags.
- `seasons`: date range, registration window, and lifecycle status.
- `sponsorship_packages`: season-specific/versioned package name, type, price in cents, benefits, capacity, and publication status.
- `sponsorship_registrations`: sponsor, season, package, reference, status, approval metadata, and snapshots of quoted price and terms.
- `invoices` and `invoice_lines`: unique invoice number, issue/due dates, bill-to snapshot, line items, totals, status, and immutable issued-document snapshots.
- `payments`: method (check/Zelle), amount, payment date, reference, recording user, and reconciliation metadata.
- `payment_allocations`: allocations from a payment to one or more invoices.
- `teams`: season-specific team inventory when needed for sponsorship assignment.
- `banner_locations`: season-specific banner slots/locations and their availability.
- `sponsorship_assignments`: registration-to-team/banner inventory assignment and fulfillment state.
- `artwork_assets`: private storage path, version, uploader, review status, and review metadata.
- `documents`: references to generated invoices/receipts and other private documents.
- `audit_events`: append-only record of important actions and changes.

## Relationships and invariants
- Sponsors may have multiple contacts and registrations.
- Packages belong to a season and have a fixed price snapshot copied into a registration.
- Registrations can have invoices and assignments according to business rules.
- Payments and invoices are many-to-many through payment allocations.
- One banner slot must not be assigned beyond its permitted capacity.
- Invoice numbers must be unique and not reused after void.
- Issued invoice snapshots should not be silently rewritten; use audited corrections/voids.
- Payment totals and invoice balances must be derived consistently from allocations and adjustments.
- Prevent duplicate registrations where the same sponsor/package/season combination is not allowed.
- Capacity checks and assignment claims must be transactional to prevent race conditions.

## Data and storage rules
- Use integer cents for USD amounts.
- Store timestamps consistently; display in the league's configured local timezone.
- Use private Supabase Storage buckets for artwork and generated documents.
- Store object paths and metadata in database rows, not public object URLs.
- Keep sponsor records distinct from season-specific registration and assignment records.

## Security
Enable RLS for tables exposed to the application. Sponsors may access only their authorized sponsor records. Administrative/finance access must be checked on the server and in database policies as appropriate. Never expose a service-role key to a browser. Audit records should not be directly editable by ordinary users.

## Before implementation
Confirm legal entity/document wording, package policies, payment correction rules, and capacity reservation/release rules. Define and test database constraints and RLS policies before building user-facing workflows.
