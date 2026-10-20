with inserted_source as (
  insert into public.sources (
    title,
    url,
    author,
    publisher,
    accessed_at,
    license,
    notes
  )
  select
    'Cliopatria v0.2.1',
    'https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1',
    'Seshat Global History Databank',
    'Seshat Global History Databank',
    date '2026-10-20',
    'CC BY 4.0',
    'Global polity polygons filtered to 1900–2000 and simplified to 15% geometry retention for web delivery.'
  where not exists (
    select 1
    from public.sources
    where url = 'https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1'
  )
  returning id
),
selected_source as (
  select id
  from inserted_source
  union all
  select id
  from public.sources
  where url = 'https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1'
  limit 1
)
insert into public.border_layers (
  title_ru,
  title_kk,
  snapshot_year,
  valid_from,
  valid_to,
  geojson_path,
  administrative_level,
  area_label_ru,
  area_label_kk,
  coverage,
  reconstruction,
  status,
  source_id,
  license,
  version,
  priority
)
select
  'Политическая карта мира',
  'Әлемнің саяси картасы',
  1950,
  1900,
  2000,
  'cliopatria/v0.2.1/world-borders-1900-2000.geojson',
  'polity',
  'Весь мир',
  'Бүкіл әлем',
  'global',
  true,
  'published',
  id,
  'CC BY 4.0',
  1,
  100
from selected_source
on conflict (geojson_path) do update
set
  title_ru = excluded.title_ru,
  title_kk = excluded.title_kk,
  snapshot_year = excluded.snapshot_year,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  administrative_level = excluded.administrative_level,
  area_label_ru = excluded.area_label_ru,
  area_label_kk = excluded.area_label_kk,
  coverage = excluded.coverage,
  reconstruction = excluded.reconstruction,
  status = excluded.status,
  source_id = excluded.source_id,
  license = excluded.license,
  version = excluded.version,
  priority = excluded.priority;
