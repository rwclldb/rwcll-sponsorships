# ChatGPT Handoff — RWCLL Sponsorship Management

## Project identity
- Repository: `rwclldb/rwcll-sponsorships`
- Local path: `D:\sandbox\GitHubRepos\rwcll-sponsorships`
- Hosted Supabase project ref: `wkqtzkuxdoudqywfoqpr`
- Hosted Supabase URL: `https://wkqtzkuxdoudqywfoqpr.supabase.co`
- Stack: Next.js App Router, TypeScript, React, Tailwind CSS, Supabase
- Current branch at foundation setup: `main`

## Non-negotiable safety boundary
Develop and test locally first. Do not link the CLI to the hosted project or execute hosted migrations, resets, seeds, or deployments without explicit user approval. Explain destructive consequences before any destructive operation. Do not use credentials or data from the Player Evaluations project.

## Current state

- Repository: `rwclldb/rwcll-sponsorships`, branch `main`.
- Local working path on the current Windows computer: `D:\sandbox\RWCLL\rwcll-sponsorships`. Paths may differ on other computers.
- Next.js App Router, TypeScript, React, Tailwind CSS, and Supabase JS/SSR libraries are installed.
- The dashboard UI and RWCLL logo/theme have been implemented. The dashboard is still a visual prototype using sample figures; sponsorship workflows and live database integration are not implemented.
- A local Supabase development environment has been started using the project-specific ports configured in `supabase/config.toml`. Keep this project separate from Player Evaluations.
- Local API URL: `http://127.0.0.1:55321`; database port: `55322`; Studio: `http://127.0.0.1:55323`.
- The Supabase CLI must remain unlinked from the hosted sponsorship project unless the user explicitly approves linking or hosted operations.
- `npm run build` has passed during UI development; rerun build and other checks after subsequent changes.
- No sponsorship business schema or workflows have been implemented yet.
- Confirmed rules include overlapping permissions, administrator verification of sponsor associations, per-division team sponsorship limits, one banner per sponsor per season, and capacity reservation at confirmation.
- Package details, legal wording, payment terms, cancellation/refund rules, and other operational policies remain to be finalized.

## Next steps

1. Complete documentation and policy decisions.
2. Refine the data model and registration state transitions.
3. Design the initial schema and RLS policies.
4. Review the proposed migration SQL before applying it locally.
5. Test constraints, permissions, and workflows against synthetic local data.
6. Implement the application incrementally and verify each milestone.
7. Obtain explicit approval before any hosted migration or production deployment.

## Agreed MVP
Manage team sponsorships and field/fence banners; season-specific fixed packages; public package pages; sponsor accounts and portal; sponsor self-registration and volunteer-entered registrations; volunteer review/approval; invoices after approval; manually recorded check/Zelle payments; payment allocation and balances; private logo/artwork versioning and approval; league-assigned teams and banner slots; fulfillment tracking; administrative reports and audit history.

No online card processing, automated bank/Zelle reconciliation, public sponsor directory, or historical Google Form/Sheet import in MVP.

## Next steps
1. Verify generated documentation and environment protections.
2. Start local Supabase and confirm local-only endpoints.
3. Create migrations for core entities and role-based access.
4. Add automated database/RLS tests before building workflows.
5. Implement registration, sponsor portal, invoices/payments, artwork, assignments, reports, and audit history incrementally.
6. Complete launch-readiness review. Hosted changes require explicit approval.

## Working practice
Make small, verifiable changes. Run lint/build/tests after meaningful changes. Explain the purpose of commands and pause for user output when a check is needed. Keep this handoff updated as decisions and implementation change.
