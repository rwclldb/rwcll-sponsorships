# RWCLL Sponsorship Management

A sponsorship registration, invoicing, payment-tracking, artwork, and fulfillment application for Redwood City Little League.

## Development status

Foundation stage. Requirements and initial design are documented; application workflows and database migrations are not yet implemented.

## Local development

Requirements: Node.js, npm, Docker Desktop, and the Supabase CLI (available through `npx`).

```powershell
npm install
npx supabase start
npm run dev
```

Local services normally use:
- Next.js: http://localhost:3000
- Supabase API: http://127.0.0.1:55321
- Supabase Studio: http://127.0.0.1:55323
- Supabase database: localhost port 55322

Configure local environment variables using `.env.example` as a guide. Never commit `.env.local`, access tokens, service-role keys, or other secrets.

Stop local Supabase with `npx supabase stop`.

## Project boundaries

This is a separate project from `rwclldb/rwcll-player-evaluations`. Do not reuse its database, credentials, schema, or player data.

The hosted sponsorship Supabase project is not to be changed, migrated, reset, seeded, or deployed to without explicit approval.

See `CHATGPT_HANDOFF.md` and the `docs/` directory for requirements, design, security, roadmap, and testing.
