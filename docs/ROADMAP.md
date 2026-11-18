# Roadmap

## Milestone 0 — Foundation
- [x] Create repository and Next.js scaffold.
- [x] Initialize local Supabase configuration.
- [x] Install Supabase JS and SSR libraries.
- [x] Confirm a production build passes.
- [X] Confirm `.gitignore` and environment template.
- [X] Start local Supabase and verify local services.
- [X] Commit the foundation and project documentation.

## Milestone 1 — Database Schema, Security, and Access Control

1. Finalize and implement the core data model for:
   - Seasons
   - Packages
   - Sponsors
   - Sponsor contacts
   - User profiles
   - Sponsor-user associations
   - Registrations
   - Invoices
   - Audit events
   - Approval state
2. Define registration states, approval workflows, sponsor verification requirements, and all permitted state transitions before writing migrations.
3. Design and implement administrator approval as a single transactional operation that:
   - Confirms the registration
   - Reserves package capacity
   - Creates the invoice
   - Maintains transactional consistency and rollback guarantees
4. Add database constraints, indexes, and row-level security (RLS) policies to enforce authorization and business rules.
5. Define trusted database operations and permission boundaries for each role.
6. Enforce sponsor-specific limits, capacity rules, and other business constraints correctly under concurrent requests.
7. Preserve complete registration, invoice, capacity, financial, and security audit history.
8. Create automated tests covering:
   - Authorization and permission enforcement
   - Registration and approval workflows
   - Business-rule validation
   - Concurrency safety
   - Transaction rollback behavior
   - RLS policy enforcement
9. Review all migrations, schema changes, constraints, and security policies before application.
10. Apply migrations in local Supabase using synthetic test data and verify:
    - Migration correctness
    - Clean reset/replay from migrations
    - Authorization boundaries
    - Concurrency behavior
    - Transaction rollback behavior
11. Confirm that local development environments remain isolated from hosted Supabase environments.

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
