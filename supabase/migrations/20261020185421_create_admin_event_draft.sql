create or replace function public.create_event_draft(
  p_slug text,
  p_title_ru text,
  p_title_kk text,
  p_summary_ru text,
  p_summary_kk text,
  p_description_ru text,
  p_description_kk text,
  p_category text,
  p_start_year integer,
  p_end_year integer,
  p_date_precision text,
  p_significance_ru text,
  p_significance_kk text,
  p_source_title text,
  p_source_url text,
  p_source_author text,
  p_source_publisher text,
  p_source_license text
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

  if p_start_year < 1900 or p_start_year > 2000 then
    raise exception 'start year must be between 1900 and 2000' using errcode = '22023';
  end if;

  if p_end_year is not null and (p_end_year < p_start_year or p_end_year > 2000) then
    raise exception 'end year must be between start year and 2000' using errcode = '22023';
  end if;

  if p_source_url !~ '^https?://' then
    raise exception 'source URL must use HTTP or HTTPS' using errcode = '22023';
  end if;

  insert into public.sources (
    title,
    url,
    author,
    publisher,
    accessed_at,
    license
  )
  values (
    btrim(p_source_title),
    btrim(p_source_url),
    nullif(btrim(p_source_author), ''),
    nullif(btrim(p_source_publisher), ''),
    current_date,
    nullif(btrim(p_source_license), '')
  )
  returning id into new_source_id;

  insert into public.historical_records (
    record_type,
    slug,
    title_ru,
    title_kk,
    summary_ru,
    summary_kk,
    description_ru,
    description_kk,
    status,
    category,
    created_by
  )
  values (
    'event',
    btrim(lower(p_slug)),
    btrim(p_title_ru),
    btrim(p_title_kk),
    btrim(p_summary_ru),
    btrim(p_summary_kk),
    btrim(p_description_ru),
    btrim(p_description_kk),
    'draft',
    btrim(p_category),
    (select auth.uid())
  )
  returning id into new_record_id;

  insert into public.event_details (
    record_id,
    start_year,
    end_year,
    date_precision,
    significance_ru,
    significance_kk
  )
  values (
    new_record_id,
    p_start_year,
    p_end_year,
    p_date_precision,
    btrim(p_significance_ru),
    btrim(p_significance_kk)
  );

  insert into public.record_sources (record_id, source_id)
  values (new_record_id, new_source_id);

  return new_record_id;
end;
$$;

revoke all on function public.create_event_draft(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.create_event_draft(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
