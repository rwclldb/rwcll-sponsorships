# Requirements

## Purpose
Provide RWCLL with a reliable workflow for sponsorship registration, approvals, invoicing, payment tracking, artwork review, assignment, and fulfillment.

## Users and roles
- Public visitor: view published sponsorship packages.
- Sponsor user: manage their business contacts and view only their own registrations, invoices, payments, documents, artwork, and fulfillment.
- Sponsorship administrator: review registrations, approve/reject requests, manage packages and assignments, and maintain sponsorship operations.
- Finance-authorized volunteer: issue/correct invoices as permitted and record/reconcile payments.
- System administrator: manage access and configuration.
Roles may overlap for an authorized person; permissions must be explicit.

## Registration
- Support team sponsorships and field/fence banner sponsorships.
- Packages and prices are fixed and season-specific; no sponsor-defined pricing.
- Sponsors can register themselves; volunteers can enter registrations on behalf of sponsors.
- A volunteer must review and approve a registration before it is accepted.
- Create an invoice after approval.
- Sponsors do not choose their team or banner location; the league assigns inventory.
- Preserve a snapshot of the selected package, price, terms, and bill-to details for the registration/invoice record.

## Invoices and payments
- Generate unique, database-controlled invoice numbers; never reuse a number after an invoice is voided.
- Track due dates, line items, totals, payments, allocations, and outstanding balances.
- Support checks and Zelle, recorded and reconciled manually by authorized volunteers.
- One payment may be allocated across multiple invoices; an invoice may have multiple payments.
- A sponsor's assertion does not constitute a confirmed payment.
- Derive balances and payment status from invoice and payment records.
- Corrections, voids, refunds, and overpayments require explicit audited workflows.
- Do not assert tax deductibility or issue charitable contribution acknowledgments without confirmed legal status and approved wording.

## Artwork and fulfillment
- Store logo/artwork privately, with version history and review status.
- Support approval and requests for revisions.
- Maintain season-specific teams and banner-location/slot inventory.
- Authorized league users assign teams and banner slots.
- Track assignment and fulfillment progress.

## Reporting and audit
- Provide administrative reports for registrations, invoices, payments, balances, assignments, and fulfillment.
- Record important actions in an audit history.
- Keep historical sponsorship records separate from the legacy Google Form/Sheet process; importing historical records is not MVP scope.

## Non-functional requirements
- Sponsor data must be isolated by authorization, not just by UI filtering.
- Money uses integer cents or an exact fixed-precision type, never floating-point arithmetic.
- Capacity reservations must be concurrency-safe.
- Private documents and artwork must not be publicly accessible.
- Include automated tests for business rules and permissions.
- Local development and testing precede any hosted rollout.

## Excluded from MVP
Online card processing, automatic bank/Zelle reconciliation, public sponsor directory, historical spreadsheet import, and production deployment.
