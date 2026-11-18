# ChatGPT Handoff — RWCLL Sponsorship Management

## Project identity
- Repository: `rwclldb/rwcll-sponsorships`
- Local path: `D:\sandbox\GitHubRepos\rwcll-sponsorships`
- Hosted Supabase project ref: `wkqtzkuxdoudqywfoqpr`
- Hosted Supabase URL: `https://wkqtzkuxdoudqywfoqpr.supabase.co`
- Stack: Next.js App Router, TypeScript, React, Tailwind CSS, Supabase
- Current branch at foundation setup: `main`

## Current status

- The Next.js application scaffold and RWCLL-branded dashboard are in place.
- Local Supabase is configured on project-specific ports. The local API is `http://127.0.0.1:55321`, the database port is `55322`, and Studio is `http://127.0.0.1:55323`.
- The local environment template uses placeholders. Never commit `.env.local` or expose service-role credentials.
- The financial and registration policy is documented in `docs/FINANCIAL-AND-REGISTRATION-POLICY.md` and remains proposed pending league and treasurer review.
- The registration workflow has been approved for initial implementation: registrations remain pending without consuming capacity; authorized administrator approval atomically confirms the registration, reserves package capacity, and creates the invoice. Any failure rolls back the transaction. Unpaid invoices do not automatically cancel sponsorships or release capacity.
- Documentation updates are in progress across `docs/DECISIONS.md`, `docs/REQUIREMENTS.md`, `docs/DATABASE-DESIGN.md`, `docs/TEST-PLAN.md`, and `docs/ROADMAP.md`.

## Next steps

1. Finish updating this handoff and review all documentation changes.
2. Run `git diff --check` and inspect `git diff`.
3. Commit and push the reviewed documentation changes.
4. Design the initial database schema, constraints, trusted database operations, and RLS policies.
5. Review the proposed migration SQL before applying it to local Supabase.
6. Test with synthetic data, including authorization failures, transaction rollback, and concurrent confirmations.

## Safety boundaries

- Develop and test locally first.
- Do not link the Supabase CLI to the hosted project, apply hosted migrations, reset hosted data, or deploy without explicit approval.
- Keep the Sponsorship Management Supabase environment separate from the Player Evaluations project.
- Explain destructive consequences before any destructive local operation.
- Treat the dashboard's sample figures as demonstration data until real application workflows are implemented.

## Agreed MVP
Manage team sponsorships and field/fence banners; season-specific fixed packages; public package pages; sponsor accounts and portal; sponsor self-registration and volunteer-entered registrations; volunteer review/approval; invoices after approval; manually recorded check/Zelle payments; payment allocation and balances; private logo/artwork versioning and approval; league-assigned teams and banner slots; fulfillment tracking; administrative reports and audit history.

No online card processing, automated bank/Zelle reconciliation, public sponsor directory, or historical Google Form/Sheet import in MVP.

## Working practice
Make small, verifiable changes. Run lint/build/tests after meaningful changes. Explain the purpose of commands and pause for user output when a check is needed. Keep this handoff updated as decisions and implementation change.
