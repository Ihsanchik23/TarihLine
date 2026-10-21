create or replace function public.import_historical_record(p_data jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_record_id uuid;
  new_location_id uuid;
  new_marker_id uuid;
  new_source_id uuid;
  record_type text := btrim(p_data ->> 'record_type');
  start_year integer := (p_data ->> 'start_year')::integer;
  end_year integer := nullif(p_data ->> 'end_year', '')::integer;
  source_title text := nullif(btrim(p_data ->> 'source_title'), '');
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if record_type not in ('event', 'person') then
    raise exception 'record type must be event or person' using errcode = '22023';
  end if;

  if start_year < 1800 or start_year > 2000 then
    raise exception 'start year is outside the supported range' using errcode = '22023';
  end if;

  if record_type = 'event' and start_year < 1900 then
    raise exception 'event year must be between 1900 and 2000' using errcode = '22023';
  end if;

  if end_year is not null and (end_year < start_year or end_year > 2026) then
    raise exception 'end year is invalid' using errcode = '22023';
  end if;

  if record_type = 'event' and end_year is not null and end_year > 2000 then
    raise exception 'event end year must not exceed 2000' using errcode = '22023';
  end if;

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
    created_by,
    published_at
  )
  values (
    record_type,
    btrim(lower(p_data ->> 'slug')),
    btrim(p_data ->> 'title_ru'),
    btrim(p_data ->> 'title_kk'),
    btrim(p_data ->> 'summary_ru'),
    btrim(p_data ->> 'summary_kk'),
    btrim(p_data ->> 'description_ru'),
    btrim(p_data ->> 'description_kk'),
    'published',
    btrim(p_data ->> 'category'),
    (select auth.uid()),
    now()
  )
  returning id into new_record_id;

  if record_type = 'event' then
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
      start_year,
      end_year,
      case when end_year is null then 'year' else 'range' end,
      btrim(p_data ->> 'significance_ru'),
      btrim(p_data ->> 'significance_kk')
    );
  else
    insert into public.person_details (
      record_id,
      birth_year,
      death_year,
      occupation_ru,
      occupation_kk,
      biography_ru,
      biography_kk
    )
    values (
      new_record_id,
      start_year,
      end_year,
      btrim(p_data ->> 'occupation_ru'),
      btrim(p_data ->> 'occupation_kk'),
      btrim(p_data ->> 'description_ru'),
      btrim(p_data ->> 'description_kk')
    );
  end if;

  insert into public.locations (
    name_ru,
    name_kk,
    longitude,
    latitude,
    precision
  )
  values (
    btrim(p_data ->> 'location_ru'),
    btrim(p_data ->> 'location_kk'),
    (p_data ->> 'longitude')::double precision,
    (p_data ->> 'latitude')::double precision,
    'approximate'
  )
  returning id into new_location_id;

  insert into public.map_markers (
    record_id,
    location_id,
    longitude,
    latitude,
    start_year,
    end_year,
    kind,
    title_ru,
    title_kk,
    precision,
    is_primary,
    status
  )
  values (
    new_record_id,
    new_location_id,
    (p_data ->> 'longitude')::double precision,
    (p_data ->> 'latitude')::double precision,
    start_year,
    end_year,
    case when record_type = 'event' then 'event_location' else 'person_milestone' end,
    btrim(p_data ->> 'title_ru'),
    btrim(p_data ->> 'title_kk'),
    'approximate',
    true,
    'published'
  )
  returning id into new_marker_id;

  if source_title is not null then
    insert into public.sources (
      title,
      url,
      author,
      publisher,
      accessed_at,
      license
    )
    values (
      source_title,
      nullif(btrim(p_data ->> 'source_url'), ''),
      nullif(btrim(p_data ->> 'source_author'), ''),
      nullif(btrim(p_data ->> 'source_publisher'), ''),
      current_date,
      nullif(btrim(p_data ->> 'source_license'), '')
    )
    returning id into new_source_id;

    insert into public.record_sources (record_id, source_id)
    values (new_record_id, new_source_id);

    insert into public.marker_sources (marker_id, source_id)
    values (new_marker_id, new_source_id);
  end if;

  return new_record_id;
end;
$$;

revoke all on function public.import_historical_record(jsonb) from public, anon;
grant execute on function public.import_historical_record(jsonb) to authenticated;
