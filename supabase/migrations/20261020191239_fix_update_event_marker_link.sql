create or replace function public.update_event_draft(
  p_record_id uuid,
  p_source_id uuid,
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
  p_source_license text,
  p_location_ru text,
  p_location_kk text,
  p_longitude double precision,
  p_latitude double precision,
  p_location_precision text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  event_marker_id uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.historical_records
    where id = p_record_id
      and record_type = 'event'
      and status = 'draft'
  ) then
    raise exception 'event draft not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.record_sources
    where record_id = p_record_id
      and source_id = p_source_id
  ) then
    raise exception 'event source not found' using errcode = 'P0002';
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
  set
    title_ru = btrim(p_title_ru),
    title_kk = btrim(p_title_kk),
    summary_ru = btrim(p_summary_ru),
    summary_kk = btrim(p_summary_kk),
    description_ru = btrim(p_description_ru),
    description_kk = btrim(p_description_kk),
    category = btrim(p_category)
  where id = p_record_id;

  update public.event_details
  set
    start_year = p_start_year,
    end_year = p_end_year,
    date_precision = p_date_precision,
    significance_ru = btrim(p_significance_ru),
    significance_kk = btrim(p_significance_kk)
  where record_id = p_record_id;

  update public.sources
  set
    title = btrim(p_source_title),
    url = btrim(p_source_url),
    author = nullif(btrim(p_source_author), ''),
    publisher = nullif(btrim(p_source_publisher), ''),
    accessed_at = current_date,
    license = nullif(btrim(p_source_license), '')
  where id = p_source_id;

  select id
  into event_marker_id
  from public.map_markers
  where record_id = p_record_id
    and is_primary
    and status <> 'archived'
  order by created_at
  limit 1
  for update;

  if event_marker_id is null then
    insert into public.map_markers (
      record_id,
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
      p_record_id,
      p_longitude,
      p_latitude,
      p_start_year,
      p_end_year,
      'event_location',
      btrim(p_location_ru),
      btrim(p_location_kk),
      p_location_precision,
      true,
      'draft'
    )
    returning id into event_marker_id;
  else
    update public.map_markers
    set
      longitude = p_longitude,
      latitude = p_latitude,
      start_year = p_start_year,
      end_year = p_end_year,
      title_ru = btrim(p_location_ru),
      title_kk = btrim(p_location_kk),
      precision = p_location_precision
    where id = event_marker_id;
  end if;

  insert into public.marker_sources (marker_id, source_id)
  values (event_marker_id, p_source_id)
  on conflict (marker_id, source_id) do nothing;

  return p_record_id;
end;
$$;

revoke all on function public.update_event_draft(
  uuid,
  uuid,
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
  text,
  text,
  text,
  double precision,
  double precision,
  text
) from public, anon;

grant execute on function public.update_event_draft(
  uuid,
  uuid,
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
  text,
  text,
  text,
  double precision,
  double precision,
  text
) to authenticated;
