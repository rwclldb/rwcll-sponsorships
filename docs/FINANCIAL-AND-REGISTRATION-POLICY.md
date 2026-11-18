# RWCLL Sponsorship Management — Financial and Registration Policy

**Status:** Proposed — pending league and treasurer review  
**Applies to:** Sponsorship registration, approval, capacity reservation, invoicing, payments, cancellations, refunds, and financial corrections  
**System:** RWCLL Sponsorship Management

## 1. Purpose

This policy defines the proposed business rules for managing sponsorship requests and their associated financial records. The application must enforce approved rules consistently, preserve an auditable history, and prevent unauthorized changes to sponsorship or financial records.

This document does not establish the league's legal or tax status, determine tax deductibility, or replace professional accounting or legal advice.

## 2. Roles and authorization

### 2.1 Independent permissions

Permissions are granted independently. A person may hold multiple permissions, including sponsorship administrator and finance-authorized volunteer.

The application must verify authorization for each action. Holding one permission does not automatically grant unrelated permissions.

### 2.2 Sponsorship administrators

Authorized sponsorship administrators may:

- Verify sponsor identities and business associations.
- Review and approve or reject sponsorship registrations.
- Confirm sponsorships and reserve package capacity.
- Cancel confirmed sponsorships.
- Explicitly release reserved capacity.
- Review refund requests and authorize decisions within their granted permissions.
- Make authorized financial corrections.

### 2.3 Finance-authorized users

Finance-authorized users may perform the financial operations specifically granted to them, including recording payments, reviewing balances, and issuing or correcting invoices as permitted by the final permissions configuration.

Financial actions must record the responsible user, timestamp, action, and relevant reason or reference.

## 3. Sponsor verification

Before a sponsor receives access to its business account and associated records, an administrator must verify the sponsor's identity and association with that business.

Verification must be recorded in the system, including:

- The sponsor account being verified.
- The administrator who performed the verification.
- The verification date and time.
- The outcome and any required notes.

An email address or sponsor identifier supplied by a user is not, by itself, sufficient proof of authorization.

Sponsor users may access only records associated with their verified sponsor account. They may not verify themselves, change their own authorization, or associate themselves with another sponsor account.

The league must approve the specific verification evidence and procedure before launch.

## 4. Registration and confirmation

### 4.1 Registration submission

A sponsor or authorized volunteer may submit a registration for an available, published sponsorship package.

Each registration must retain a snapshot of the selected package, price, terms, season, sponsor, and billing details applicable at submission or confirmation, as appropriate to the final implementation.

Submitting a registration does not guarantee acceptance or reserve package capacity.

### 4.2 Review and approval

An authorized administrator reviews the registration and may approve or reject it. Rejections must include a reason when required by the final workflow policy.

**Proposed default:** An administrator's approval is the confirmation event. Approval, capacity reservation, and invoice creation must be coordinated so that the system cannot treat a registration as confirmed without successfully reserving capacity.

If capacity cannot be reserved, the transaction must not leave the registration confirmed or issue an invoice for a sponsorship that could not be confirmed.

The database must enforce this workflow transactionally.

### 4.3 Capacity reservations

Pending registrations do not consume package capacity.

Capacity is reserved when the registration is confirmed. The reservation remains in place until an authorized cancellation or explicit capacity-release operation takes effect.

The system must prevent concurrent confirmations from exceeding package capacity.

An unpaid invoice does not automatically release capacity. An administrator must review the situation and explicitly cancel the sponsorship and release its reservation when appropriate.

### 4.4 Sponsor-specific limits

For each season:

- A sponsor may have no more than one team sponsorship in any single division.
- A sponsor may sponsor teams in multiple divisions.
- A sponsor may have no more than one banner sponsorship.
- A banner sponsorship may coexist with team sponsorships.

These limits must be enforced by trusted database operations or database constraints, not merely by the user interface.

### 4.5 Assignment

Sponsors do not select their own teams or banner locations. The league assigns available team inventory and banner slots according to its operational procedures.

The application must prevent assignments that exceed the capacity of the relevant inventory.

## 5. Invoicing

### 5.1 Invoice timing

An invoice is issued when the administrator approves and confirms the registration.

Invoice creation must be coordinated with confirmation and capacity reservation so that partial failures do not leave inconsistent records.

### 5.2 Invoice contents

An invoice should contain, subject to approved legal and accounting requirements:

- A unique invoice number.
- The league's approved legal or billing identity.
- The sponsor's billing details.
- The applicable season and sponsorship package.
- A description of the sponsorship and its price.
- Applicable terms and due date.
- The total amount due and payment instructions.
- Any required approved legal or tax language.

### 5.3 Payment terms

The proposed standard payment term is **30 calendar days from the invoice issue date**.

The invoice must show its issue date and due date. Any exceptions must be explicitly authorized and recorded.

Late fees, interest, collection procedures, and other consequences of nonpayment are not established by this policy and must not be applied until separately approved.

### 5.4 Invoice integrity

Invoice numbers must be unique and must never be reused, including after an invoice is voided.

Once issued, an invoice's original contents must remain auditable. Corrections must use an authorized adjustment or void-and-reissue workflow rather than silently overwriting the original invoice.

## 6. Payment recording and allocation

### 6.1 Accepted payment methods

The proposed supported payment methods are:

- Check.
- Zelle.

Payments are recorded and reconciled manually by authorized users. The application does not automatically verify bank deposits or Zelle transfers.

A sponsor's statement that payment has been sent is not proof that the league has received it.

### 6.2 Payment records

Each recorded payment should include:

- Amount and currency.
- Payment method.
- Date received or credited, according to the approved accounting procedure.
- Relevant check number or transaction reference, when available.
- Recording user and timestamp.
- Reconciliation status and any necessary notes.

The application must distinguish a reported payment from a payment verified and recorded by an authorized user.

### 6.3 Allocation and balances

One payment may be allocated to multiple invoices, and an invoice may receive multiple payments.

The system must calculate invoice balances and payment status from invoice amounts, payment allocations, and approved adjustments. A user must not be able to mark an invoice paid merely by editing a status field.

Unallocated payments and credits must remain identifiable until they are allocated, refunded, or otherwise resolved under an approved procedure.

## 7. Nonpayment

An invoice becomes overdue when its due date has passed and an outstanding balance remains.

Overdue status does not automatically cancel a confirmed sponsorship or release its capacity.

An administrator must review unpaid confirmed registrations and explicitly decide whether to retain or cancel the sponsorship. Any cancellation and capacity release must be recorded with the responsible user, timestamp, and reason.

The league must separately approve any reminder schedule, grace period, late fees, collection process, or deadline after which a sponsorship may be cancelled.

## 8. Cancellations

Only an authorized administrator may cancel a confirmed sponsorship under this proposed policy.

A cancellation must record:

- The registration being cancelled.
- The administrator responsible.
- The date and time.
- The reason.
- The invoice and payment consequences.
- Whether capacity was released and when.
- Any refund, credit, or adjustment decision.

Cancellation does not automatically mean that a refund is owed. Refund eligibility must be assessed separately.

The application must preserve the original registration, invoice, payment, and assignment history after cancellation.

## 9. Refunds and credits

### 9.1 Refund decisions

Refunds are reviewed case by case. There is no automatic refund entitlement established by this proposed policy.

An authorized administrator must document the decision and its reason. The final implementation must define who can authorize and execute the financial transaction.

Where a payment has already been received, the system must record any refund as a separate financial transaction linked to the original payment and relevant invoice.

A refund must not be represented by deleting the original payment or editing it to a lower amount.

### 9.2 Overpayments

Overpayments are retained as unapplied credits until they are allocated or an authorized refund is processed.

The application must clearly distinguish:

- Amounts owed by the sponsor.
- Payments received.
- Payments allocated to invoices.
- Unapplied credit balances.
- Refunds issued.

The final accounting procedure must define how credits are applied across invoices, seasons, or sponsor accounts.

## 10. Financial corrections and approvals

An authorized administrator or finance-authorized user may perform a financial correction only within their granted permissions.

A second approver is not required under this proposed default. The league may adopt additional approval requirements or monetary thresholds later.

Every correction must preserve the original record and include:

- The original invoice, payment, allocation, or adjustment affected.
- The correction made.
- The reason.
- The responsible user and timestamp.
- The resulting balance.
- Links to related replacement invoices, refunds, credits, or adjustment entries.

Voids, refunds, and corrections must use explicit workflows. Issued invoice numbers must not be reused, and financial history must not be silently rewritten.

## 11. Audit and access controls

The system must maintain an auditable history of significant actions, including:

- Sponsor verification and account association changes.
- Registration approval, rejection, confirmation, and cancellation.
- Capacity reservation and release.
- Invoice issue, void, and correction.
- Payment recording, reconciliation, allocation, and refund.
- Credit creation and application.
- Changes to relevant package or inventory configuration.

Audit records must be protected from modification by ordinary application users.

Database authorization must enforce sponsor isolation and role permissions. Hiding interface controls is not sufficient security.

## 12. Legal, tax, and accounting review required before launch

The following matters require confirmation by the appropriate league officer, treasurer, accountant, or legal adviser:

1. **Legal identity and tax status:** Confirm the entity receiving sponsorship funds, its legal name, address, and tax status.
2. **Sponsorship versus advertising:** Review package benefits, website listings, banner placements, and sponsor acknowledgments to determine their appropriate tax and accounting treatment.
3. **Invoices and receipts:** Approve invoice language, receipts, and any statements concerning charitable contributions or tax deductibility.
4. **Revenue recognition:** Determine when sponsorship revenue should be recognized, including payments received before the season or before promised benefits are delivered.
5. **Payment handling:** Approve procedures for recording, reconciling, allocating, and documenting checks and Zelle payments.
6. **Cancellation and refunds:** Establish any contractual obligations, refund limits, exceptions, and required approvals.
7. **Overpayments and credits:** Approve how long credits may remain unapplied, whether they may carry across seasons, and how unresolved credits are handled.
8. **Nonpayment:** Approve reminders, deadlines, late fees if any, collection procedures, and cancellation terms.
9. **Record retention:** Establish retention periods for invoices, payment records, sponsor agreements, artwork approvals, and audit logs.
10. **Applicable law:** Confirm any state or local requirements that affect sponsorship agreements, invoicing, refunds, or recordkeeping.

No tax-deductibility claim or charitable-contribution acknowledgment may be issued until the league's status and approved wording have been confirmed.

## 13. Implementation requirements

Before the policy is adopted in production, the application must:

- Enforce the registration, sponsor-limit, capacity, and permission rules at the database or trusted server-operation level.
- Use exact monetary arithmetic, such as integer cents.
- Keep invoices, payments, credits, refunds, and corrections auditable.
- Test authorization and concurrency with synthetic data.
- Keep private sponsor and financial records inaccessible to unauthorized users.
- Apply migrations and run tests locally before any hosted rollout.

**Approval:** This document remains proposed until the league's authorized decision-makers approve it and resolve the outstanding legal, accounting, and operational questions.