# Security and Operational Safeguards

## Environment and project separation
- Never commit `.env.local`, credentials, tokens, service-role keys, or production secrets.
- `.env.example` contains placeholders only.
- Browser code may use only the public Supabase URL and anon/publishable key.
- Service-role credentials, if ever required for controlled server tasks, must remain server-only and must not bypass authorization casually.
- Do not reuse credentials, schemas, or data from Player Evaluations.
- Do not link to or mutate the hosted sponsorship project without explicit approval.

## Authorization
- Enable Row Level Security on application tables.
- Sponsor users must only access their own sponsor, registration, invoice, payment, artwork, and document records.
- Never rely on hidden buttons or client-side filtering as access control.
- Check administrative and finance roles server-side and in database policies.
- Use private storage buckets and short-lived authorized access for files.
- Validate sponsor-to-user associations; do not trust a sponsor ID supplied by the browser.

## Financial integrity
- Record payment actor, timestamp, method, amount, and reference.
- Do not mark invoices paid based only on sponsor claims.
- Use explicit, audited correction/void/refund workflows.
- Preserve issued invoice snapshots and invoice-number uniqueness.
- Keep audit history append-only for application users.

## File handling
- Allow only approved file types and reasonable size limits.
- Treat uploaded filenames and metadata as untrusted input.
- Use generated storage paths; do not use user-supplied paths as authorization.
- Ensure file download authorization follows the same sponsor/role boundaries as the associated record.

## Testing and operations
- Test RLS as anonymous, sponsor A, sponsor B, sponsorship admin, and finance user.
- Test direct API/database access, not just rendered pages.
- Test concurrency for package capacity and banner assignment.
- Run local migrations and tests before any hosted change.
- Backups, retention, monitoring, and production incident procedures must be decided before launch.
