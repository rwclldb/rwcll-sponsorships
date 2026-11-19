-- Starting admins. Add or remove people later in Admin > Settings > Admins.
insert into public.admins (email) values
  ('erik@rwcll.org'),
  ('dan@rwcll.org'),
  ('admin@rwcll.org')
on conflict (email) do nothing;
