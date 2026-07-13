-- On signup, each new user becomes the founder of a brand new company, and
-- that company is populated with starter/demo data (seed_company_defaults).
-- Expects auth signup to pass `company_name` and `display_name` in the
-- user's metadata (see src/lib/auth.ts signUp()).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  meta_company_name text := coalesce(new.raw_user_meta_data ->> 'company_name', 'My Company');
  meta_display_name text := coalesce(new.raw_user_meta_data ->> 'display_name', 'Founder');
begin
  insert into public.companies (name) values (meta_company_name)
    returning id into new_company_id;

  insert into public.profiles (id, company_id, display_name, role)
    values (new.id, new_company_id, meta_display_name, 'founder');

  perform public.seed_company_defaults(new_company_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
