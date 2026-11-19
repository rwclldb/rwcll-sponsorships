-- Newer Supabase projects don't grant table access to API roles automatically.
-- Signed-in users get table access (row level security still limits it to admins),
-- and the server's secret key (service_role) gets full access. The public key (anon) gets none.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
