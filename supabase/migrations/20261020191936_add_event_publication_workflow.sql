create or replace function public.set_event_status(
  p_record_id uuid,
  p_target_status text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_status text;
  primary_marker_id uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  select status
  into current_status
  from public.historical_records
  where id = p_record_id
    and record_type = 'event'
  for update;

  if current_status is null then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  if not (
    (current_status = 'draft' and p_target_status = 'verified')
    or (current_status = 'verified' and p_target_status in ('draft', 'published'))
    or (current_status = 'published' and p_target_status = 'verified')
  ) then
    raise exception 'invalid event status transition' using errcode = '22023';
  end if;

  if p_target_status in ('verified', 'published') then
    if not exists (
      select 1
      from public.event_details
      where record_id = p_record_id
        and start_year between 1900 and 2000
        and coalesce(end_year, start_year) between start_year and 2000
        and length(btrim(significance_ru)) > 0
        and length(btrim(significance_kk)) > 0
    ) then
      raise exception 'event period or significance is incomplete' using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.record_sources
      join public.sources on sources.id = record_sources.source_id
      where record_sources.record_id = p_record_id
        and length(btrim(sources.title)) > 0
        and sources.url ~ '^https?://'
        and length(btrim(coalesce(sources.license, ''))) > 0
    ) then
      raise exception 'verified source is required' using errcode = '23514';
    end if;

    select id
    into primary_marker_id
    from public.map_markers
    where record_id = p_record_id
      and is_primary
      and status <> 'archived'
      and longitude between -180 and 180
      and latitude between -90 and 90
      and length(btrim(coalesce(title_ru, ''))) > 0
      and length(btrim(coalesce(title_kk, ''))) > 0
    order by created_at
    limit 1
    for update;

    if primary_marker_id is null then
      raise exception 'primary map marker is required' using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.marker_sources
      where marker_id = primary_marker_id
    ) then
      raise exception 'map marker source is required' using errcode = '23514';
    end if;
  else
    select id
    into primary_marker_id
    from public.map_markers
    where record_id = p_record_id
      and is_primary
      and status <> 'archived'
    order by created_at
    limit 1
    for update;
  end if;

  update public.historical_records
  set
    status = p_target_status,
    published_at = case when p_target_status = 'published' then now() else null end
  where id = p_record_id;

  if primary_marker_id is not null then
    update public.map_markers
    set status = p_target_status
    where id = primary_marker_id;
  end if;

  return p_target_status;
end;
$$;

revoke all on function public.set_event_status(uuid, text) from public, anon;
grant execute on function public.set_event_status(uuid, text) to authenticated;
