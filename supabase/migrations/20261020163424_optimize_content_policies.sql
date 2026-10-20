alter policy historical_records_public_read on public.historical_records to anon;
alter policy event_details_public_read on public.event_details to anon;
alter policy person_details_public_read on public.person_details to anon;
alter policy locations_public_read on public.locations to anon;
alter policy map_markers_public_read on public.map_markers to anon;
alter policy relations_public_read on public.relations to anon;
alter policy record_sources_public_read on public.record_sources to anon;
alter policy relation_sources_public_read on public.relation_sources to anon;
alter policy marker_sources_public_read on public.marker_sources to anon;
alter policy record_media_public_read on public.record_media to anon;
alter policy sources_public_read on public.sources to anon;
alter policy media_public_read on public.media to anon;
alter policy border_layers_public_read on public.border_layers to anon;

create policy historical_records_authenticated_read
on public.historical_records
for select
to authenticated
using (status = 'published' or (select private.is_admin()));

create policy event_details_authenticated_read
on public.event_details
for select
to authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy person_details_authenticated_read
on public.person_details
for select
to authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy map_markers_authenticated_read
on public.map_markers
for select
to authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.historical_records
      where id = record_id
        and status = 'published'
    )
  )
  or (select private.is_admin())
);

create policy locations_authenticated_read
on public.locations
for select
to authenticated
using (
  exists (
    select 1
    from public.map_markers
    where location_id = locations.id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy relations_authenticated_read
on public.relations
for select
to authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.historical_records
      where id = from_record_id
        and status = 'published'
    )
    and exists (
      select 1
      from public.historical_records
      where id = to_record_id
        and status = 'published'
    )
  )
  or (select private.is_admin())
);

create policy record_sources_authenticated_read
on public.record_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy relation_sources_authenticated_read
on public.relation_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.relations
    where id = relation_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy marker_sources_authenticated_read
on public.marker_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.map_markers
    where id = marker_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy record_media_authenticated_read
on public.record_media
for select
to authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy sources_authenticated_read
on public.sources
for select
to authenticated
using (
  exists (
    select 1
    from public.record_sources
    where source_id = sources.id
  )
  or exists (
    select 1
    from public.relation_sources
    where source_id = sources.id
  )
  or exists (
    select 1
    from public.marker_sources
    where source_id = sources.id
  )
  or exists (
    select 1
    from public.border_layers
    where source_id = sources.id
      and status = 'published'
  )
  or (select private.is_admin())
);

create policy media_authenticated_read
on public.media
for select
to authenticated
using (
  exists (
    select 1
    from public.record_media
    where media_id = media.id
  )
  or exists (
    select 1
    from public.person_details
    join public.historical_records on historical_records.id = person_details.record_id
    where person_details.portrait_media_id = media.id
      and historical_records.status = 'published'
  )
  or (select private.is_admin())
);

create policy border_layers_authenticated_read
on public.border_layers
for select
to authenticated
using (status = 'published' or (select private.is_admin()));

do $$
declare
  content_table text;
begin
  foreach content_table in array array[
    'sources',
    'media',
    'historical_records',
    'event_details',
    'person_details',
    'locations',
    'map_markers',
    'relations',
    'record_sources',
    'relation_sources',
    'marker_sources',
    'record_media',
    'border_layers'
  ]
  loop
    execute format('drop policy %I on public.%I', content_table || '_admin_all', content_table);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      content_table || '_admin_insert',
      content_table
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      content_table || '_admin_update',
      content_table
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',
      content_table || '_admin_delete',
      content_table
    );
  end loop;
end;
$$;
