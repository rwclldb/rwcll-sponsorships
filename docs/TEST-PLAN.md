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

## Registration, Sponsorship, and Confirmation Rules
- Unpublished packages are not visible to public users.
- Package prices and terms are snapshotted at the time of registration.
- Registrations for invalid packages, closed seasons, full packages, or otherwise ineligible registrations are rejected according to system rules.
- Pending registrations do not reserve package capacity and do not generate invoices.
- Package capacity is reserved only upon successful registration confirmation.
- Registration confirmation reserves exactly one capacity slot atomically and cannot result in overbooking, even under concurrent or duplicate requests.
- Concurrent registration submissions, approval attempts, and duplicate requests cannot bypass package-capacity limits.
- An invoice cannot be created before registration approval and confirmation.
- Successful registration approval:
    - Confirms the registration.
    - Reserves exactly one capacity slot.
    - Creates exactly one invoice.
    - Records the responsible administrator and timestamp.
- Only authorized administrators may approve, confirm, cancel, or otherwise perform registration-management actions, including direct database operations.
- If package capacity is exhausted, registration confirmation fails without confirming the registration, reserving capacity, or creating an invoice.
- Registration confirmation is transactional. If invoice creation or any other required step fails, the entire confirmation operation is rolled back and leaves no partial registration confirmation, capacity reservation, or invoice.
- Duplicate or concurrent confirmation attempts for the same registration cannot create duplicate invoices, duplicate confirmations, or duplicate capacity reservations.
- Sponsor limits are enforced during confirmation transactions, including concurrent requests, and cannot be bypassed through duplicate submissions, race conditions, or interface-independent operations.
- A sponsor may not have more than one confirmed team sponsorship within the same division during a single season.
- A sponsor may have team sponsorships in multiple divisions during the same season.
- A sponsor may not have more than one confirmed banner sponsorship during a single season.
- A sponsor may simultaneously hold eligible team sponsorships and a banner sponsorship when all applicable limits are satisfied.
- Volunteer approval and rejection actions must record the acting user, timestamp, and required reason.
- Cancellation, nonpayment processing, and capacity release must follow approved business policy and may be performed only by authorized administrators.
- An unpaid invoice does not automatically cancel a registration or automatically release reserved capacity.
- Cancellation or capacity-release actions must create the required audit records.
- Failed confirmation attempts must not leave misleading success audit entries. Any recorded failure events must accurately describe the failed operation.


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
