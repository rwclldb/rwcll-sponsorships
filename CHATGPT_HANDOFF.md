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
- Next.js scaffold created in repository root.
- Supabase local configuration initialized in `supabase/config.toml`.
- `@supabase/supabase-js` and `@supabase/ssr` installed.
- Docker is running.
- `npm run build` passed on 2026-11-17.
- No sponsorship database migrations or business workflows have been implemented yet.
- Local Supabase services have not yet been confirmed started.
- Package names, prices, benefits, capacities, legal wording, and operational policies remain to be confirmed.

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
