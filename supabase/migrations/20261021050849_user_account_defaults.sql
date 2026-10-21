create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    case
      when new.raw_user_meta_data ->> 'preferred_language' = 'kk' then 'kk'
      else 'ru'
    end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name, preferred_language)
select
  users.id,
  nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
  case
    when users.raw_user_meta_data ->> 'preferred_language' = 'kk' then 'kk'
    else 'ru'
  end
from auth.users
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select users.id, 'user'
from auth.users
on conflict (user_id) do nothing;
