create or replace function public.update_person_draft(
  p_record_id uuid, p_source_id uuid, p_title_ru text, p_title_kk text,
  p_summary_ru text, p_summary_kk text, p_biography_ru text, p_biography_kk text,
  p_category text, p_birth_year integer, p_death_year integer,
  p_occupation_ru text, p_occupation_kk text, p_source_title text,
  p_source_url text, p_source_author text, p_source_publisher text,
  p_source_license text, p_location_ru text, p_location_kk text,
  p_longitude double precision, p_latitude double precision, p_location_precision text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  person_marker_id uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.historical_records
    where id = p_record_id and record_type = 'person' and status = 'draft'
  ) then
    raise exception 'person draft not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.record_sources
    where record_id = p_record_id and source_id = p_source_id
  ) then
    raise exception 'person source not found' using errcode = 'P0002';
  end if;

  if p_birth_year < 1800 or p_birth_year > 2000 then
    raise exception 'birth year must be between 1800 and 2000' using errcode = '22023';
  end if;
  if p_death_year is not null and (p_death_year < p_birth_year or p_death_year > 2026) then
    raise exception 'death year is invalid' using errcode = '22023';
  end if;
  if p_source_url !~ '^https?://' then
    raise exception 'source URL must use HTTP or HTTPS' using errcode = '22023';
  end if;
  if p_longitude is null or p_longitude < -180 or p_longitude > 180 then
    raise exception 'longitude must be between -180 and 180' using errcode = '22023';
  end if;
  if p_latitude is null or p_latitude < -90 or p_latitude > 90 then
    raise exception 'latitude must be between -90 and 90' using errcode = '22023';
  end if;
  if p_location_precision not in ('point', 'approximate') then
    raise exception 'unsupported location precision' using errcode = '22023';
  end if;

  update public.historical_records
  set title_ru = btrim(p_title_ru), title_kk = btrim(p_title_kk),
    summary_ru = btrim(p_summary_ru), summary_kk = btrim(p_summary_kk),
    description_ru = btrim(p_biography_ru), description_kk = btrim(p_biography_kk),
    category = btrim(p_category)
  where id = p_record_id;

  update public.person_details
  set birth_year = p_birth_year, death_year = p_death_year,
    occupation_ru = btrim(p_occupation_ru), occupation_kk = btrim(p_occupation_kk),
    biography_ru = btrim(p_biography_ru), biography_kk = btrim(p_biography_kk)
  where record_id = p_record_id;

  update public.sources
  set title = btrim(p_source_title), url = btrim(p_source_url),
    author = nullif(btrim(p_source_author), ''),
    publisher = nullif(btrim(p_source_publisher), ''),
    accessed_at = current_date, license = nullif(btrim(p_source_license), '')
  where id = p_source_id;

  select id into person_marker_id
  from public.map_markers
  where record_id = p_record_id and is_primary and status <> 'archived'
  order by created_at
  limit 1
  for update;

  if person_marker_id is null then
    insert into public.map_markers (
      record_id, longitude, latitude, start_year, end_year, kind,
      title_ru, title_kk, precision, is_primary, status
    ) values (
      p_record_id, p_longitude, p_latitude, p_birth_year, p_death_year,
      'person_milestone', btrim(p_location_ru), btrim(p_location_kk),
      p_location_precision, true, 'draft'
    ) returning id into person_marker_id;
  else
    update public.map_markers
    set longitude = p_longitude, latitude = p_latitude,
      start_year = p_birth_year, end_year = p_death_year,
      title_ru = btrim(p_location_ru), title_kk = btrim(p_location_kk),
      precision = p_location_precision
    where id = person_marker_id;
  end if;

  insert into public.marker_sources (marker_id, source_id)
  values (person_marker_id, p_source_id)
  on conflict (marker_id, source_id) do nothing;

  return p_record_id;
end;
$$;

revoke all on function public.update_person_draft(uuid,uuid,text,text,text,text,text,text,text,integer,integer,text,text,text,text,text,text,text,text,text,double precision,double precision,text) from public, anon;
grant execute on function public.update_person_draft(uuid,uuid,text,text,text,text,text,text,text,integer,integer,text,text,text,text,text,text,text,text,text,double precision,double precision,text) to authenticated;
