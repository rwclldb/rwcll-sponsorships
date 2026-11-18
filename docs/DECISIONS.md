# Decisions

## Confirmed
1. This is a separate sponsorship-management repository and Supabase project, not an extension of Player Evaluations.
2. Local development/testing comes first. No hosted database changes or production deployment without explicit approval.
3. Sponsorship types are team sponsorships and field/fence banners.
4. Packages/prices are fixed by season; sponsors cannot set custom prices.
5. Volunteer review/approval precedes acceptance and invoicing.
6. The league assigns teams and banner slots.
7. Payments are check or Zelle and are manually recorded/reconciled by authorized volunteers.
8. Artwork is private, versioned, and subject to approval/revision.
9. No historical Google Form/Sheet import in MVP.
10. No tax-deductibility claims or charitable-contribution acknowledgment until the treasurer confirms legal status and approves wording.
11. Monetary values use integer cents or exact fixed precision.
12. Invoice numbers are database-controlled and never reused after void.
13. Payment status and balances are derived from transaction records, not a manually editable paid flag.

## Confirmed business rules

1. **Overlapping permissions:** A person may hold multiple permissions, such as sponsorship administrator and finance-authorized volunteer. Permissions are granted independently and checked explicitly.
2. **Package capacity:** A registration does not reserve package capacity while pending. Capacity is reserved when the registration is confirmed, using a transaction-safe operation to prevent overbooking.
3. **Team sponsorship limits:** A sponsor may sponsor at most one team in each division per season. The same sponsor may sponsor teams in different divisions in the same season.
4. **Banner limit:** A sponsor may receive at most one banner sponsorship per season. A banner sponsorship may coexist with team sponsorships.
5. **Sponsor verification:** An administrator verifies a sponsor's identity/business association before authorizing the sponsor to access the associated sponsor account.
6. **Inventory assignment:** The league, not the sponsor, assigns team sponsorships to teams and banner sponsorships to available banner locations.
7. **Financial history:** Issued invoices and recorded financial transactions must retain an auditable history. Corrections must not silently rewrite the original transaction history.
8. **Registration confirmation workflow:** Registrations remain pending without reserving package capacity. When an authorized administrator approves a registration, the system must confirm the registration, reserve package capacity, and create the invoice in one database transaction. If capacity reservation or invoice creation fails, the entire transaction must roll back. Unpaid invoices do not automatically cancel confirmed sponsorships or release capacity; an authorized administrator must explicitly take those actions.

## Still to decide before implementation

- Actual package names, prices, benefits, and capacities.
- Official league legal name, billing address, and approved invoice/receipt wording.
- Which permissions are needed for registration approval, inventory management, invoice issuance, payment recording, and financial corrections.
- Invoice payment terms, due dates, reminders, and consequences of nonpayment.
- Exact sponsor verification procedure, including what evidence administrators review and how account access is granted or recovered.
- When confirmed package reservations expire or are released if payment is not received.
- Cancellation, invoice-void, refund, overpayment, credit, and payment-correction rules.
- Whether refunds or financial corrections require a second approver, and any approval thresholds.
- Banner dimensions, production and installation responsibility, artwork specifications, allowed file formats, and file-size limits.
- Email provider, sender/domain, hosting, backup, and data-retention requirements.

## Implementation rule

Do not silently invent policy for unresolved items. Use explicit, documented defaults only when approved. Ask the user when a decision affects money, access, legal wording, or irreversible operations.

## Implementation rule
Do not silently invent policy for unresolved items. Use explicit, documented defaults only when necessary, and ask the user when a decision affects money, access, legal wording, or irreversible operations.
