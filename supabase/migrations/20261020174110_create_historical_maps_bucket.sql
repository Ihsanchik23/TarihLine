insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'historical-maps',
  'historical-maps',
  true,
  10485760,
  array['application/geo+json', 'application/json']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy historical_maps_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'historical-maps'
  and private.is_admin()
);

create policy historical_maps_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'historical-maps'
  and private.is_admin()
);

create policy historical_maps_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'historical-maps'
  and private.is_admin()
)
with check (
  bucket_id = 'historical-maps'
  and private.is_admin()
);

create policy historical_maps_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'historical-maps'
  and private.is_admin()
);
