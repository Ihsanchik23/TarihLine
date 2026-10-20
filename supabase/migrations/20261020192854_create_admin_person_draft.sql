create or replace function public.create_person_draft(
  p_slug text, p_title_ru text, p_title_kk text, p_summary_ru text, p_summary_kk text,
  p_biography_ru text, p_biography_kk text, p_category text,
  p_birth_year integer, p_death_year integer, p_occupation_ru text, p_occupation_kk text,
  p_source_title text, p_source_url text, p_source_author text,
  p_source_publisher text, p_source_license text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_record_id uuid;
  new_source_id uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if p_birth_year > 2000 or p_birth_year < 1800 then
    raise exception 'birth year is outside the supported range' using errcode = '22023';
  end if;

  if p_death_year is not null and (p_death_year < p_birth_year or p_death_year > 2026) then
    raise exception 'death year is invalid' using errcode = '22023';
  end if;

  if p_source_url !~ '^https?://' then
    raise exception 'source URL must use HTTP or HTTPS' using errcode = '22023';
  end if;

  insert into public.sources (title, url, author, publisher, accessed_at, license)
  values (btrim(p_source_title), btrim(p_source_url), nullif(btrim(p_source_author), ''), nullif(btrim(p_source_publisher), ''), current_date, nullif(btrim(p_source_license), ''))
  returning id into new_source_id;

  insert into public.historical_records (
    record_type, slug, title_ru, title_kk, summary_ru, summary_kk,
    description_ru, description_kk, status, category, created_by
  )
  values (
    'person', btrim(lower(p_slug)), btrim(p_title_ru), btrim(p_title_kk),
    btrim(p_summary_ru), btrim(p_summary_kk), btrim(p_biography_ru), btrim(p_biography_kk),
    'draft', btrim(p_category), (select auth.uid())
  )
  returning id into new_record_id;

  insert into public.person_details (
    record_id, birth_year, death_year, occupation_ru, occupation_kk, biography_ru, biography_kk
  )
  values (
    new_record_id, p_birth_year, p_death_year, btrim(p_occupation_ru), btrim(p_occupation_kk),
    btrim(p_biography_ru), btrim(p_biography_kk)
  );

  insert into public.record_sources (record_id, source_id)
  values (new_record_id, new_source_id);

  return new_record_id;
end;
$$;

revoke all on function public.create_person_draft(text,text,text,text,text,text,text,text,integer,integer,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_person_draft(text,text,text,text,text,text,text,text,integer,integer,text,text,text,text,text,text,text) to authenticated;
