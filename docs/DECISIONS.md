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

## To decide before relevant implementation
- Actual package names, prices, benefits, and capacities.
- Official league legal name, address, and approved invoice/receipt wording.
- Which users may approve registrations, manage inventory, issue invoices, and record payments.
- Payment terms and due-date policy.
- Sponsor account verification, recovery, and business association process.
- When package capacity or inventory is reserved and released.
- Cancellation, refund, overpayment, and credit policies.
- Banner dimensions, production/install responsibility, and artwork specifications.
- Allowed artwork formats and file-size limits.
- Email provider, sender/domain, hosting, backup, and retention requirements.
- Whether any two-person review is required for payment corrections/refunds.

## Implementation rule
Do not silently invent policy for unresolved items. Use explicit, documented defaults only when necessary, and ask the user when a decision affects money, access, legal wording, or irreversible operations.
