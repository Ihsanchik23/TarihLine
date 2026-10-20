alter policy sources_public_read on public.sources to anon;

drop policy if exists sources_authenticated_read on public.sources;

create policy sources_authenticated_read
on public.sources
for select
to authenticated
using (
  exists (
    select 1
    from public.record_sources
    join public.historical_records on historical_records.id = record_sources.record_id
    where record_sources.source_id = sources.id
      and historical_records.status = 'published'
  )
  or exists (
    select 1
    from public.relation_sources
    join public.relations on relations.id = relation_sources.relation_id
    where relation_sources.source_id = sources.id
      and relations.status = 'published'
  )
  or exists (
    select 1
    from public.marker_sources
    join public.map_markers on map_markers.id = marker_sources.marker_id
    where marker_sources.source_id = sources.id
      and map_markers.status = 'published'
  )
  or exists (
    select 1
    from public.media
    join public.record_media on record_media.media_id = media.id
    join public.historical_records on historical_records.id = record_media.record_id
    where media.source_id = sources.id
      and historical_records.status = 'published'
  )
  or exists (
    select 1
    from public.border_layers
    where border_layers.source_id = sources.id
      and border_layers.status = 'published'
  )
  or (select private.is_admin())
);
