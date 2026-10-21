update public.border_layers
set
  geojson_path = 'cliopatria/v0.2.1/world-borders-1900-2000-i18n.geojson',
  version = 2,
  updated_at = now()
where geojson_path = 'cliopatria/v0.2.1/world-borders-1900-2000.geojson';

update public.sources
set
  notes = 'Global polity polygons filtered to 1900–2000 and simplified to 15% geometry retention for web delivery. Russian and Kazakh labels enriched from Wikidata with editorial corrections.',
  updated_at = now()
where url = 'https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1';
