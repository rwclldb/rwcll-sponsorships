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
- A sponsor may have at most one team sponsorship per division per season, while being allowed to sponsor teams in multiple divisions during that season.
- A sponsor may have at most one banner sponsorship per season, independently of its team sponsorships.
- Enforce these limits using database constraints or transaction-safe database logic, not only application validation.
- Pending registrations do not consume package capacity. Confirmed registrations reserve capacity atomically.
- Define a single, explicit registration state transition that performs confirmation and capacity reservation together. Concurrent confirmations must not exceed package capacity.
- Sponsor account authorization must be based on an explicit, administrator-verified sponsor-to-user association. Email matching or a client-supplied sponsor identifier alone is insufficient.
- Keep user permissions independently assignable so a user can hold administrative and finance permissions simultaneously.
- Preserve issued invoices and original payment records. Represent financial corrections through linked, auditable records or adjustment transactions rather than silently overwriting financial history.
- Define the conditions under which a confirmed registration releases its reserved capacity before implementing cancellation or nonpayment workflows.

### Registration confirmation transaction

The database must provide a trusted, atomic operation for confirming a sponsorship registration.

The operation must:

1. Verify that the requesting user is authorized to approve registrations.
2. Verify that the registration is eligible for approval and has not already been confirmed or rejected.
3. Enforce sponsor-specific limits for the season.
4. Reserve package capacity without exceeding the package's configured limit, including when multiple approvals occur concurrently.
5. Confirm the registration and record the approving user and timestamp.
6. Create the invoice using the applicable registration and billing snapshots, with a unique database-controlled invoice number.
7. Record the relevant audit events.

All steps must execute in one database transaction. If any required step fails, all changes made by that transaction must roll back. A failed confirmation must not leave a confirmed registration, a capacity reservation, an invoice, or a success audit event from that failed operation.

Pending registrations do not consume capacity and do not generate invoices.

A confirmed registration retains its capacity reservation until an authorized administrator explicitly cancels the sponsorship and releases capacity. An unpaid invoice alone must not trigger cancellation or capacity release.

The implementation must use database constraints, row locking, or another concurrency-safe database mechanism. Client-side checks alone are insufficient.

### Registration and invoice integrity

- Enforce the rule that a sponsor may have at most one team sponsorship per division per season and at most one banner sponsorship per season.
- Preserve the applicable package price, terms, and billing details for the registration and invoice.
- Ensure invoice numbering remains unique and issued invoice numbers are never reused, including after voiding.
- Preserve historical registration, invoice, and capacity changes in the audit history.

## Data and storage rules
- Use integer cents for USD amounts.
- Store timestamps consistently; display in the league's configured local timezone.
- Use private Supabase Storage buckets for artwork and generated documents.
- Store object paths and metadata in database rows, not public object URLs.
- Keep sponsor records distinct from season-specific registration and assignment records.

## Security
Enable RLS for tables exposed to the application. Sponsors may access only their authorized sponsor records. Administrative/finance access must be checked on the server and in database policies as appropriate. Never expose a service-role key to a browser. Audit records should not be directly editable by ordinary users.

## Before implementation
Confirm legal entity/document wording, package policies, payment correction rules, and capacity reservation/release rules. Define and test database constraints and RLS policies before building user-facing workflows. Define registration state transitions, sponsor verification, and financial correction policy as well.
