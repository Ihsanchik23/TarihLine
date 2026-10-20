create schema if not exists private;

revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_path text,
  preferred_language text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9][a-z0-9_-]{2,31}$'),
  constraint profiles_preferred_language_check check (preferred_language in ('ru', 'kk'))
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_role_check check (role in ('admin', 'user'))
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    );
$$;

revoke execute on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  author text,
  publisher text,
  accessed_at date,
  license text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_title_not_blank check (length(btrim(title)) > 0)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  media_type text not null,
  caption_ru text not null,
  caption_kk text not null,
  alt_ru text not null,
  alt_kk text not null,
  author text,
  source_id uuid not null references public.sources (id) on delete restrict,
  license text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_type_check check (media_type in ('image', 'video', 'audio', 'document')),
  constraint media_storage_path_not_blank check (length(btrim(storage_path)) > 0),
  constraint media_translations_not_blank check (
    length(btrim(caption_ru)) > 0
    and length(btrim(caption_kk)) > 0
    and length(btrim(alt_ru)) > 0
    and length(btrim(alt_kk)) > 0
  )
);

create table public.historical_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  slug text not null unique,
  title_ru text not null,
  title_kk text not null,
  summary_ru text not null,
  summary_kk text not null,
  description_ru text not null,
  description_kk text not null,
  status text not null default 'draft',
  category text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title_ru, '') || ' ' ||
      coalesce(title_kk, '') || ' ' ||
      coalesce(summary_ru, '') || ' ' ||
      coalesce(summary_kk, '') || ' ' ||
      coalesce(description_ru, '') || ' ' ||
      coalesce(description_kk, '')
    )
  ) stored,
  constraint historical_records_type_check check (record_type in ('event', 'person')),
  constraint historical_records_status_check check (status in ('draft', 'verified', 'published', 'archived')),
  constraint historical_records_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint historical_records_translations_not_blank check (
    length(btrim(title_ru)) > 0
    and length(btrim(title_kk)) > 0
    and length(btrim(summary_ru)) > 0
    and length(btrim(summary_kk)) > 0
    and length(btrim(description_ru)) > 0
    and length(btrim(description_kk)) > 0
  ),
  constraint historical_records_published_at_check check (status <> 'published' or published_at is not null)
);

create table public.event_details (
  record_id uuid primary key references public.historical_records (id) on delete cascade,
  start_year integer not null,
  end_year integer,
  start_date date,
  end_date date,
  date_precision text not null,
  significance_ru text not null,
  significance_kk text not null,
  constraint event_details_years_check check (end_year is null or end_year >= start_year),
  constraint event_details_dates_check check (end_date is null or start_date is null or end_date >= start_date),
  constraint event_details_precision_check check (date_precision in ('day', 'month', 'year', 'range', 'unknown')),
  constraint event_details_significance_not_blank check (
    length(btrim(significance_ru)) > 0
    and length(btrim(significance_kk)) > 0
  )
);

create table public.person_details (
  record_id uuid primary key references public.historical_records (id) on delete cascade,
  birth_year integer not null,
  death_year integer,
  birth_date date,
  death_date date,
  occupation_ru text not null,
  occupation_kk text not null,
  biography_ru text not null,
  biography_kk text not null,
  portrait_media_id uuid references public.media (id) on delete set null,
  constraint person_details_years_check check (death_year is null or death_year >= birth_year),
  constraint person_details_dates_check check (death_date is null or birth_date is null or death_date >= birth_date),
  constraint person_details_translations_not_blank check (
    length(btrim(occupation_ru)) > 0
    and length(btrim(occupation_kk)) > 0
    and length(btrim(biography_ru)) > 0
    and length(btrim(biography_kk)) > 0
  )
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name_ru text not null,
  name_kk text not null,
  historical_name_ru text,
  historical_name_kk text,
  longitude double precision,
  latitude double precision,
  precision text not null,
  region_geometry_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_precision_check check (precision in ('point', 'approximate', 'region')),
  constraint locations_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint locations_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint locations_coordinates_pair_check check ((longitude is null) = (latitude is null)),
  constraint locations_geometry_check check (
    (longitude is not null and latitude is not null)
    or region_geometry_path is not null
  ),
  constraint locations_translations_not_blank check (
    length(btrim(name_ru)) > 0
    and length(btrim(name_kk)) > 0
  )
);

create table public.map_markers (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.historical_records (id) on delete cascade,
  location_id uuid references public.locations (id) on delete restrict,
  longitude double precision,
  latitude double precision,
  start_year integer not null,
  end_year integer,
  kind text not null,
  title_ru text,
  title_kk text,
  precision text not null,
  is_primary boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_markers_years_check check (end_year is null or end_year >= start_year),
  constraint map_markers_kind_check check (kind in ('event_location', 'person_milestone')),
  constraint map_markers_precision_check check (precision in ('point', 'approximate', 'region')),
  constraint map_markers_status_check check (status in ('draft', 'verified', 'published', 'archived')),
  constraint map_markers_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint map_markers_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint map_markers_coordinates_pair_check check ((longitude is null) = (latitude is null)),
  constraint map_markers_location_check check (
    location_id is not null
    or (longitude is not null and latitude is not null)
  )
);

create table public.relations (
  id uuid primary key default gen_random_uuid(),
  from_record_id uuid not null references public.historical_records (id) on delete restrict,
  to_record_id uuid not null references public.historical_records (id) on delete restrict,
  relation_type text not null,
  explanation_ru text not null,
  explanation_kk text not null,
  from_year integer,
  to_year integer,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relations_type_check check (relation_type in ('participation', 'shared_process', 'causal', 'interaction', 'other')),
  constraint relations_status_check check (status in ('draft', 'verified', 'published', 'archived')),
  constraint relations_records_differ check (from_record_id <> to_record_id),
  constraint relations_years_check check (to_year is null or from_year is null or to_year >= from_year),
  constraint relations_explanations_not_blank check (
    length(btrim(explanation_ru)) > 0
    and length(btrim(explanation_kk)) > 0
  ),
  constraint relations_unique_edge unique (from_record_id, to_record_id, relation_type)
);

create table public.record_sources (
  record_id uuid not null references public.historical_records (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete restrict,
  citation_note text,
  primary key (record_id, source_id)
);

create table public.relation_sources (
  relation_id uuid not null references public.relations (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete restrict,
  citation_note text,
  primary key (relation_id, source_id)
);

create table public.marker_sources (
  marker_id uuid not null references public.map_markers (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete restrict,
  citation_note text,
  primary key (marker_id, source_id)
);

create table public.record_media (
  record_id uuid not null references public.historical_records (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete restrict,
  sort_order integer not null default 0,
  primary key (record_id, media_id),
  constraint record_media_sort_order_check check (sort_order >= 0),
  constraint record_media_record_order_unique unique (record_id, sort_order)
);

create table public.border_layers (
  id uuid primary key default gen_random_uuid(),
  title_ru text not null,
  title_kk text not null,
  snapshot_year integer not null,
  valid_from integer not null,
  valid_to integer not null,
  geojson_path text not null unique,
  administrative_level text not null,
  area_label_ru text not null,
  area_label_kk text not null,
  coverage text not null default 'partial',
  reconstruction boolean not null default false,
  status text not null default 'draft',
  source_id uuid not null references public.sources (id) on delete restrict,
  license text not null,
  version integer not null default 1,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint border_layers_period_check check (valid_to >= valid_from),
  constraint border_layers_snapshot_check check (snapshot_year between valid_from and valid_to),
  constraint border_layers_status_check check (status in ('draft', 'verified', 'published', 'archived')),
  constraint border_layers_coverage_check check (coverage in ('global', 'partial', 'local')),
  constraint border_layers_version_check check (version > 0),
  constraint border_layers_translations_not_blank check (
    length(btrim(title_ru)) > 0
    and length(btrim(title_kk)) > 0
    and length(btrim(area_label_ru)) > 0
    and length(btrim(area_label_kk)) > 0
  )
);

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  record_id uuid not null references public.historical_records (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, record_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  record_id uuid references public.historical_records (id) on delete set null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_not_blank check (length(btrim(title)) > 0)
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private',
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routes_visibility_check check (visibility in ('private', 'public')),
  constraint routes_public_slug_check check (visibility <> 'public' or slug is not null),
  constraint routes_slug_format check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint routes_title_not_blank check (length(btrim(title)) > 0)
);

create table public.route_items (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  record_id uuid not null references public.historical_records (id) on delete restrict,
  position integer not null,
  author_comment text,
  created_at timestamptz not null default now(),
  constraint route_items_position_check check (position >= 0),
  constraint route_items_route_position_unique unique (route_id, position),
  constraint route_items_route_record_unique unique (route_id, record_id)
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  initiated_by uuid not null references auth.users (id) on delete restrict,
  filename text not null,
  checksum text not null unique,
  status text not null default 'pending',
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  rejected_rows integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint import_jobs_status_check check (status in ('pending', 'validating', 'preview_ready', 'importing', 'completed', 'failed')),
  constraint import_jobs_counts_check check (
    total_rows >= 0
    and imported_rows >= 0
    and rejected_rows >= 0
    and imported_rows + rejected_rows <= total_rows
  ),
  constraint import_jobs_times_check check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table public.import_errors (
  id bigint generated always as identity primary key,
  import_job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number integer not null,
  column_name text,
  error_code text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint import_errors_row_number_check check (row_number > 0)
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.enforce_record_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actual_type text;
begin
  select record_type
  into actual_type
  from public.historical_records
  where id = new.record_id;

  if actual_type is distinct from tg_argv[0] then
    raise exception 'record type must be %', tg_argv[0];
  end if;

  return new;
end;
$$;

create or replace function private.enforce_marker_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actual_type text;
  expected_kind text;
begin
  select record_type
  into actual_type
  from public.historical_records
  where id = new.record_id;

  expected_kind = case actual_type
    when 'event' then 'event_location'
    when 'person' then 'person_milestone'
    else null
  end;

  if new.kind is distinct from expected_kind then
    raise exception 'marker kind does not match record type';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_route_item_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actual_type text;
  actual_status text;
begin
  select record_type, status
  into actual_type, actual_status
  from public.historical_records
  where id = new.record_id;

  if actual_type is distinct from 'event' or actual_status is distinct from 'published' then
    raise exception 'route items must reference published events';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function private.set_updated_at();

create trigger sources_set_updated_at
before update on public.sources
for each row execute function private.set_updated_at();

create trigger media_set_updated_at
before update on public.media
for each row execute function private.set_updated_at();

create trigger historical_records_set_updated_at
before update on public.historical_records
for each row execute function private.set_updated_at();

create trigger locations_set_updated_at
before update on public.locations
for each row execute function private.set_updated_at();

create trigger map_markers_set_updated_at
before update on public.map_markers
for each row execute function private.set_updated_at();

create trigger relations_set_updated_at
before update on public.relations
for each row execute function private.set_updated_at();

create trigger border_layers_set_updated_at
before update on public.border_layers
for each row execute function private.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function private.set_updated_at();

create trigger routes_set_updated_at
before update on public.routes
for each row execute function private.set_updated_at();

create trigger event_details_enforce_type
before insert or update of record_id on public.event_details
for each row execute function private.enforce_record_type('event');

create trigger person_details_enforce_type
before insert or update of record_id on public.person_details
for each row execute function private.enforce_record_type('person');

create trigger map_markers_enforce_kind
before insert or update of record_id, kind on public.map_markers
for each row execute function private.enforce_marker_kind();

create trigger route_items_enforce_event
before insert or update of record_id on public.route_items
for each row execute function private.enforce_route_item_event();

create index media_source_id_idx on public.media (source_id);
create index historical_records_created_by_idx on public.historical_records (created_by);
create index historical_records_status_type_category_idx on public.historical_records (status, record_type, category);
create index historical_records_published_idx on public.historical_records (record_type, category, published_at desc) where status = 'published';
create index historical_records_search_idx on public.historical_records using gin (search_vector);
create index event_details_period_idx on public.event_details (start_year, (coalesce(end_year, start_year)));
create index person_details_period_idx on public.person_details (birth_year, (coalesce(death_year, birth_year)));
create index person_details_portrait_media_id_idx on public.person_details (portrait_media_id);
create index map_markers_record_id_idx on public.map_markers (record_id);
create index map_markers_location_id_idx on public.map_markers (location_id);
create index map_markers_period_idx on public.map_markers (status, start_year, (coalesce(end_year, start_year)));
create unique index map_markers_primary_record_idx on public.map_markers (record_id, start_year, (coalesce(end_year, start_year))) where is_primary and status <> 'archived';
create index relations_from_record_id_idx on public.relations (from_record_id);
create index relations_to_record_id_idx on public.relations (to_record_id);
create index relations_status_type_idx on public.relations (status, relation_type);
create index record_sources_source_id_idx on public.record_sources (source_id);
create index relation_sources_source_id_idx on public.relation_sources (source_id);
create index marker_sources_source_id_idx on public.marker_sources (source_id);
create index record_media_media_id_idx on public.record_media (media_id);
create index border_layers_source_id_idx on public.border_layers (source_id);
create index border_layers_period_idx on public.border_layers (status, valid_from, valid_to, priority desc);
create index bookmarks_record_id_idx on public.bookmarks (record_id);
create index notes_user_id_idx on public.notes (user_id, updated_at desc);
create index notes_record_id_idx on public.notes (record_id);
create index routes_user_id_idx on public.routes (user_id, updated_at desc);
create index routes_public_idx on public.routes (updated_at desc) where visibility = 'public';
create index route_items_record_id_idx on public.route_items (record_id);
create index import_jobs_initiated_by_idx on public.import_jobs (initiated_by, created_at desc);
create index import_errors_import_job_id_idx on public.import_errors (import_job_id, row_number);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.sources enable row level security;
alter table public.media enable row level security;
alter table public.historical_records enable row level security;
alter table public.event_details enable row level security;
alter table public.person_details enable row level security;
alter table public.locations enable row level security;
alter table public.map_markers enable row level security;
alter table public.relations enable row level security;
alter table public.record_sources enable row level security;
alter table public.relation_sources enable row level security;
alter table public.marker_sources enable row level security;
alter table public.record_media enable row level security;
alter table public.border_layers enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.routes enable row level security;
alter table public.route_items enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_errors enable row level security;

create policy profiles_owner_all
on public.profiles
for all
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy user_roles_owner_read
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy historical_records_public_read
on public.historical_records
for select
to anon, authenticated
using (status = 'published');

create policy event_details_public_read
on public.event_details
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy person_details_public_read
on public.person_details
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy map_markers_public_read
on public.map_markers
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy locations_public_read
on public.locations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.map_markers
    where location_id = locations.id
      and status = 'published'
  )
);

create policy relations_public_read
on public.relations
for select
to anon, authenticated
using (
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
);

create policy record_sources_public_read
on public.record_sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy relation_sources_public_read
on public.relation_sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.relations
    where id = relation_id
      and status = 'published'
  )
);

create policy marker_sources_public_read
on public.marker_sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.map_markers
    where id = marker_id
      and status = 'published'
  )
);

create policy record_media_public_read
on public.record_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy sources_public_read
on public.sources
for select
to anon, authenticated
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
);

create policy media_public_read
on public.media
for select
to anon, authenticated
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
);

create policy border_layers_public_read
on public.border_layers
for select
to anon, authenticated
using (status = 'published');

create policy bookmarks_owner_all
on public.bookmarks
for all
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy notes_owner_all
on public.notes
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy routes_read
on public.routes
for select
to anon, authenticated
using (visibility = 'public' or user_id = (select auth.uid()));

create policy routes_owner_insert
on public.routes
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy routes_owner_update
on public.routes
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy routes_owner_delete
on public.routes
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy route_items_read
on public.route_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.routes
    where id = route_id
      and (visibility = 'public' or user_id = (select auth.uid()))
  )
  and exists (
    select 1
    from public.historical_records
    where id = record_id
      and status = 'published'
  )
);

create policy route_items_owner_insert
on public.route_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.routes
    where id = route_id
      and user_id = (select auth.uid())
  )
);

create policy route_items_owner_update
on public.route_items
for update
to authenticated
using (
  exists (
    select 1
    from public.routes
    where id = route_id
      and user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.routes
    where id = route_id
      and user_id = (select auth.uid())
  )
);

create policy route_items_owner_delete
on public.route_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.routes
    where id = route_id
      and user_id = (select auth.uid())
  )
);

create policy sources_admin_all
on public.sources
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy media_admin_all
on public.media
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy historical_records_admin_all
on public.historical_records
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy event_details_admin_all
on public.event_details
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy person_details_admin_all
on public.person_details
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy locations_admin_all
on public.locations
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy map_markers_admin_all
on public.map_markers
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy relations_admin_all
on public.relations
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy record_sources_admin_all
on public.record_sources
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy relation_sources_admin_all
on public.relation_sources
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy marker_sources_admin_all
on public.marker_sources
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy record_media_admin_all
on public.record_media
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy border_layers_admin_all
on public.border_layers
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy import_jobs_admin_all
on public.import_jobs
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy import_errors_admin_all
on public.import_errors
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on all tables in schema public from anon, authenticated;

grant select on public.historical_records to anon, authenticated;
grant select on public.event_details to anon, authenticated;
grant select on public.person_details to anon, authenticated;
grant select on public.locations to anon, authenticated;
grant select on public.map_markers to anon, authenticated;
grant select on public.relations to anon, authenticated;
grant select on public.sources to anon, authenticated;
grant select on public.media to anon, authenticated;
grant select on public.record_sources to anon, authenticated;
grant select on public.relation_sources to anon, authenticated;
grant select on public.marker_sources to anon, authenticated;
grant select on public.record_media to anon, authenticated;
grant select on public.border_layers to anon, authenticated;
grant select on public.routes to anon, authenticated;
grant select on public.route_items to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.routes to authenticated;
grant select, insert, update, delete on public.route_items to authenticated;

grant select, insert, update, delete on public.sources to authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select, insert, update, delete on public.historical_records to authenticated;
grant select, insert, update, delete on public.event_details to authenticated;
grant select, insert, update, delete on public.person_details to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.map_markers to authenticated;
grant select, insert, update, delete on public.relations to authenticated;
grant select, insert, update, delete on public.record_sources to authenticated;
grant select, insert, update, delete on public.relation_sources to authenticated;
grant select, insert, update, delete on public.marker_sources to authenticated;
grant select, insert, update, delete on public.record_media to authenticated;
grant select, insert, update, delete on public.border_layers to authenticated;
grant select, insert, update, delete on public.import_jobs to authenticated;
grant select, insert, update, delete on public.import_errors to authenticated;
grant usage, select on sequence public.import_errors_id_seq to authenticated;

revoke all on function private.set_updated_at() from public, anon;
revoke all on function private.enforce_record_type() from public, anon;
revoke all on function private.enforce_marker_kind() from public, anon;
revoke all on function private.enforce_route_item_event() from public, anon;
