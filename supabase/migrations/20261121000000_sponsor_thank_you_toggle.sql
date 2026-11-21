-- Separate switches: email_notifications = new-sponsor alerts to the listed people;
-- notify_sponsor = thank-you email to the sponsor.
alter table public.settings add column notify_sponsor boolean not null default false;
