-- Local development only (not applied to the hosted project).
-- Sign in locally as admin@rwcll.org; the code arrives in Mailpit at http://127.0.0.1:55324
insert into public.admins (email) values ('admin@rwcll.org') on conflict do nothing;
