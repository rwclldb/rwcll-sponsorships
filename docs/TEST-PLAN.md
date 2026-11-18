# Test Plan

## Foundation
- `npm run build` completes successfully.
- `npm run lint` completes successfully.
- TypeScript errors are treated as failures.
- Local Supabase can start and stop without connecting to the hosted project.
- A clean local database can be rebuilt from committed migrations.

## Authentication and authorization
- Anonymous users can view only intended public package information.
- Sponsor A cannot read or modify Sponsor B's records through pages, APIs, Storage, or direct database access.
- Sponsor users cannot approve their own registration unless explicitly granted a separate authorized role.
- Sponsorship admins can perform allowed registration and assignment tasks.
- Finance users can record payments only within their granted permissions.
- Service-role credentials never appear in client bundles or browser responses.
- A user with both sponsorship administrator and finance permissions can perform only the actions authorized by those permissions.
- An unverified sponsor user cannot access a sponsor account or its records.
- Sponsor verification and sponsor-to-user association changes are restricted to authorized administrators and create audit events.
- A sponsor cannot access another sponsor's records by changing a URL, request payload, or database identifier.

## Registration and packages
- Unpublished packages are not visible to public users.
- Package prices and terms are snapshotted at registration.
- Invalid, closed-season, or over-capacity registrations are rejected appropriately.
- Concurrent registrations cannot exceed package capacity.
- Volunteer approval and rejection record actor, timestamp, and reason where required.
- An invoice is not issued before approval.
- A sponsor cannot confirm more than one team sponsorship in the same division during one season.
- A sponsor may have team sponsorships in multiple divisions during the same season.
- A sponsor cannot confirm more than one banner sponsorship per season, but may have a banner and team sponsorships together.
- Pending registrations do not consume package capacity.
- Confirmation reserves capacity atomically; simultaneous confirmation attempts cannot overbook a package.
- Cancellation and nonpayment release capacity only according to the approved policy.
- Duplicate submissions and concurrent requests cannot bypass the sponsor's per-division or banner limits.

## Financial workflows
- Invoice numbers are unique and never reused after void.
- Line-item totals and balances use exact arithmetic.
- Multiple payments can pay one invoice; one payment can be allocated across invoices.
- Unallocated amounts and overpayments are represented explicitly.
- A sponsor cannot self-confirm a payment as received.
- Voids, corrections, refunds, and allocation changes are audited.
- Issued invoice snapshots remain stable after package or sponsor details change.

## Artwork and assignments
- Unauthorized users cannot access private artwork/documents.
- File type and size limits are enforced.
- Artwork versions and review decisions are retained.
- Banner slots and teams cannot be assigned beyond capacity.
- Assignment and fulfillment transitions are validated and audited.

## Reporting and reliability
- Registration, invoice, payment, balance, and fulfillment reports reconcile with source records.
- Important state changes create audit events.
- Errors do not expose secrets or private sponsor data.
- Local backup/restore procedures are tested before launch.

## Required test identities
Use synthetic local data for anonymous access, two unrelated sponsor accounts, a sponsorship administrator, and a finance-authorized user. Never use real sponsor/payment data in test fixtures.
