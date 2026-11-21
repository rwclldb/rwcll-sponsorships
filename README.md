# RWCLL Sponsorships

A small app that replaces the sponsorship Google Form and Sheet for Redwood City Little League.

- **Public sign-up form** (`/`): the sponsor picks team divisions and/or a banner, gives contact details, and can upload a logo.
- **Invoice/receipt page** (`/invoice/<private link>`): shown right after sign-up with payment instructions (Zelle QR or check). It's printable, and it becomes a receipt once payment is recorded.
- **Admin area** (`/admin`, @rwcll.org admins only):
  - the season's sponsor list with totals and filters
  - record check/Zelle payments, change divisions, notes, and logos
  - CSV export
  - a past-sponsors list for "come back" emails
  - settings: season, prices, open/closed, emails, Zelle QR, and admins

Payments are recorded by hand. The app never handles money.

Stack: Next.js 16 + Supabase (database, admin sign-in, logo storage). Optional email goes through [Resend](https://resend.com). Everything fits on free plans.

## Local development

Requirements: Node.js, Docker Desktop.

```powershell
npm install
npx supabase start        # local database, auth and storage (Docker)
npx supabase db reset     # (re)creates tables from supabase/migrations + seed.sql; wipes local data
npm run dev               # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill it in from `npx supabase status`.

- Sign in locally at http://localhost:3000/login as **admin@rwcll.org**. The code arrives in Mailpit at http://127.0.0.1:55324.
- Supabase Studio (database browser): http://127.0.0.1:55323

## How it fits together

| Where | What |
| --- | --- |
| `supabase/migrations/` | Tables, security rules, storage buckets, and the starting 2027 packages |
| `src/app/page.tsx`, `SignupForm.tsx`, `actions.ts` | Public sign-up form and its submit handler |
| `src/app/invoice/[token]/` | Printable invoice/receipt |
| `src/app/login/` | Admin sign-in with an emailed 6-digit code |
| `src/app/admin/` | Admin pages; `actions.ts` holds every admin change |
| `src/lib/` | Supabase clients, formatting, email |

Security model:

- All tables have row-level security, and only emails in the `admins` table can read or change anything.
- The public form and invoice pages run on the server with the secret key and only show what they need.
- Invoice links use an unguessable token.
- Logos live in a private bucket. The Zelle QR is in a public bucket.

## Going live (sponsors.rwcll.org)

1. **Database:** apply the migration to the hosted Supabase project:
   `npx supabase link --project-ref <ref>` then `npx supabase db push`.
   This also adds the starting admins (erik@, dan@, admin@rwcll.org). Manage admins afterwards in Admin → Settings.
2. **Supabase Auth settings** (dashboard):
   - Set the Site URL to `https://sponsors.rwcll.org`.
   - Under Email Templates → Magic Link, include the code `{{ .Token }}` (copy `supabase/templates/sign-in-code.html`).
   - Under SMTP, enter Resend's SMTP details. Supabase's built-in email is heavily rate-limited.
3. **Email (optional, Resend free tier):** add the rwcll.org domain in Resend, add the DNS records it gives you, and create an API key.
4. **Vercel:** import the GitHub repo and set these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`
   - `SITE_URL=https://sponsors.rwcll.org`
   - `RESEND_API_KEY`, `EMAIL_FROM`
5. **Domain:** in Vercel add `sponsors.rwcll.org`, then add the CNAME record it shows at rwcll.org's DNS provider.
6. **In the app:** go to Admin → Settings. Upload the Zelle QR code, check prices and payment instructions, add the notification emails, and turn on emails.

## Email

The app can send two emails per sign-up, each with its own switch in Admin → Settings → Emails:
- **New-sponsor alert:** every detail of the sign-up, sent to any list of addresses (they don't need to be admins).
- **Thank-you to the sponsor:** links to their invoice. Replies go to the alert recipients.

"Send a test alert" checks the setup. Sending needs one of these, set in Vercel → Settings → Environment Variables, followed by a redeploy:

**Option A: a Google / Gmail account (simplest, free, about 500 emails a day)**
1. Use a league Google account (e.g. `sponsors@rwcll.org`). It needs 2-Step Verification turned on.
2. Go to Google Account → Security → App passwords, and create one for "RWCLL Sponsorships".
3. Set these variables:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=sponsors@rwcll.org`
   - `SMTP_PASS=<the 16-letter app password>`
   - optionally `EMAIL_FROM="RWCLL Sponsorships <sponsors@rwcll.org>"`, which must be that account or one of its aliases

**Option B: Resend (free tier; needs DNS records on rwcll.org)**
- Set `RESEND_API_KEY` and `EMAIL_FROM`.

Locally, emails can go to Mailpit (http://127.0.0.1:55324) by running with `SMTP_HOST=127.0.0.1 SMTP_PORT=55325 SMTP_USER=x SMTP_PASS=x`.

## Sign-up form on the league (Sports Connect) website

Admin → Settings → "Put the sign-up form on the league website" has a snippet to paste into a custom HTML page:

- The snippet is an `<iframe>` of `/embed`, plus an optional script that sizes the frame to fit.
- Sponsors stay on the league site: after submitting, they see their invoice in the same frame, with a link to the printable copy.
- Only `/embed/...` pages can be shown inside other sites. Admin, login and the normal pages refuse to be framed (see `headers()` in `next.config.ts`).

## Admin passwords

Admins can sign in with a password or an emailed code. To set someone's first password (or reset a forgotten one) without email:

```powershell
node --env-file=.env.hosted scripts/set-admin-password.mjs name@rwcll.org   # live site
node --env-file=.env.local  scripts/set-admin-password.mjs name@rwcll.org   # local
```

It asks for the password twice and doesn't show what you type. `.env.hosted` holds the live project's URL and secret key (Supabase → Project Settings → API Keys). It's git-ignored, so keep it that way. Once signed in, admins can change their own password in Admin → Settings.

## Importing old Google Form responses

Download the responses sheet as CSV, then run:

```powershell
node --env-file=.env.local scripts/import-google-form.mjs path\to\responses.csv 2026 --dry-run   # preview
node --env-file=.env.local scripts/import-google-form.mjs path\to\responses.csv 2026             # import
```

Rows with the same person and timestamp are merged into one sign-up. Imported sign-ups are marked "Not tracked" for payment, because the form didn't record payments. Running the import twice won't create duplicates.

To import into the live database, use an env file with the hosted URL and secret key instead of `.env.local`. Keep the CSV out of the repo, because it holds sponsors' contact details.

## New season

In Admin → Settings, change **Current season** (e.g. `2028`) and click **Copy packages** to bring over last year's prices, then adjust them. Past seasons stay viewable from the season picker on the Sponsors page.
