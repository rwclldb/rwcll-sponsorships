# Roadmap

## Milestone 0 — Foundation
- [x] Create repository and Next.js scaffold.
- [x] Initialize local Supabase configuration.
- [x] Install Supabase JS and SSR libraries.
- [x] Confirm a production build passes.
- [ ] Confirm `.gitignore` and environment template.
- [ ] Start local Supabase and verify local services.
- [ ] Commit the foundation and project documentation.

## Milestone 1 — Schema and access control
- Design and implement seasons, packages, sponsors, contacts, profiles, registrations, and approval state.
- Add constraints, indexes, and RLS policies.
- Add automated authorization and business-rule tests.
- Verify clean local reset/replay from migrations.

## Milestone 2 — Registration and sponsor portal
- Public published-package pages.
- Sponsor authentication and sponsor/business association.
- Sponsor self-registration and volunteer-entered registration.
- Volunteer review, approval, rejection, and status history.
- Sponsor portal limited to the sponsor's own records.

## Milestone 3 — Invoices and payments
- Invoice numbering and immutable issued snapshots.
- Invoice/line-item generation and PDF documents.
- Due dates, check/Zelle instructions, and manual payment entry.
- Payment allocation, balances, receipts, corrections, and finance reports.

## Milestone 4 — Artwork and fulfillment
- Private uploads, version history, approval/revision workflow.
- Season-specific team and banner inventory.
- League assignment workflows and capacity enforcement.
- Fulfillment tracking and reports.

## Milestone 5 — End-to-end quality
- End-to-end workflow tests.
- Cross-sponsor access and RLS tests.
- Concurrency, validation, error-handling, and accessibility checks.
- Backup/restore rehearsal and operational documentation.

## Milestone 6 — Launch readiness
- Confirm legal/business details, packages, payment policies, and document wording.
- Configure email, domain, hosting, backups, monitoring, and access procedures.
- Security review and user acceptance testing.
- Obtain explicit approval before hosted migrations or production deployment.
