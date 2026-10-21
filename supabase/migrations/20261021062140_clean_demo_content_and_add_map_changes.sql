delete from public.relations
where from_record_id in (select id from public.historical_records where slug = 'raspad-sssr-1991')
   or to_record_id in (select id from public.historical_records where slug = 'raspad-sssr-1991');

delete from public.route_items
where record_id in (select id from public.historical_records where slug = 'raspad-sssr-1991');

delete from public.historical_records
where slug = 'raspad-sssr-1991';

delete from public.sources
where id = 'aebf7140-20d4-4d19-b7c5-56b6bc182332'
  and not exists (select 1 from public.record_sources where source_id = 'aebf7140-20d4-4d19-b7c5-56b6bc182332')
  and not exists (select 1 from public.relation_sources where source_id = 'aebf7140-20d4-4d19-b7c5-56b6bc182332')
  and not exists (select 1 from public.marker_sources where source_id = 'aebf7140-20d4-4d19-b7c5-56b6bc182332')
  and not exists (select 1 from public.border_layers where source_id = 'aebf7140-20d4-4d19-b7c5-56b6bc182332');

alter table public.border_layers
add column change_summary jsonb not null default '{}'::jsonb;

update public.border_layers
set change_summary = '{"1900":{"appeared":88,"disappeared":0,"changed":0},"1905":{"appeared":5,"disappeared":6,"changed":40},"1908":{"appeared":0,"disappeared":4,"changed":21},"1911":{"appeared":3,"disappeared":7,"changed":22},"1912":{"appeared":6,"disappeared":5,"changed":16},"1913":{"appeared":2,"disappeared":1,"changed":17},"1914":{"appeared":0,"disappeared":2,"changed":15},"1915":{"appeared":0,"disappeared":1,"changed":23},"1916":{"appeared":2,"disappeared":6,"changed":24},"1917":{"appeared":3,"disappeared":3,"changed":27},"1918":{"appeared":9,"disappeared":0,"changed":24},"1919":{"appeared":12,"disappeared":4,"changed":24},"1920":{"appeared":5,"disappeared":9,"changed":33},"1922":{"appeared":6,"disappeared":3,"changed":30},"1924":{"appeared":3,"disappeared":4,"changed":30},"1926":{"appeared":4,"disappeared":6,"changed":26},"1927":{"appeared":0,"disappeared":0,"changed":12},"1928":{"appeared":1,"disappeared":0,"changed":10},"1929":{"appeared":0,"disappeared":0,"changed":9},"1930":{"appeared":3,"disappeared":2,"changed":16},"1932":{"appeared":7,"disappeared":6,"changed":27},"1936":{"appeared":4,"disappeared":3,"changed":47},"1938":{"appeared":1,"disappeared":2,"changed":20},"1939":{"appeared":1,"disappeared":4,"changed":24},"1940":{"appeared":3,"disappeared":12,"changed":23},"1941":{"appeared":1,"disappeared":4,"changed":20},"1942":{"appeared":1,"disappeared":0,"changed":21},"1943":{"appeared":0,"disappeared":3,"changed":23},"1944":{"appeared":3,"disappeared":3,"changed":20},"1945":{"appeared":11,"disappeared":7,"changed":22},"1946":{"appeared":12,"disappeared":5,"changed":26},"1947":{"appeared":12,"disappeared":3,"changed":26},"1948":{"appeared":9,"disappeared":5,"changed":20},"1949":{"appeared":1,"disappeared":1,"changed":22},"1950":{"appeared":3,"disappeared":5,"changed":16},"1953":{"appeared":5,"disappeared":2,"changed":22},"1956":{"appeared":8,"disappeared":2,"changed":20},"1958":{"appeared":7,"disappeared":10,"changed":14},"1960":{"appeared":10,"disappeared":4,"changed":12},"1961":{"appeared":17,"disappeared":2,"changed":11},"1963":{"appeared":10,"disappeared":3,"changed":11},"1967":{"appeared":15,"disappeared":5,"changed":14},"1969":{"appeared":6,"disappeared":2,"changed":14},"1973":{"appeared":13,"disappeared":5,"changed":25},"1976":{"appeared":14,"disappeared":7,"changed":28},"1979":{"appeared":9,"disappeared":5,"changed":7},"1983":{"appeared":3,"disappeared":2,"changed":13},"1987":{"appeared":4,"disappeared":2,"changed":18},"1990":{"appeared":6,"disappeared":6,"changed":13},"1991":{"appeared":5,"disappeared":4,"changed":7},"1992":{"appeared":27,"disappeared":4,"changed":17},"1996":{"appeared":5,"disappeared":4,"changed":15},"2000":{"appeared":4,"disappeared":2,"changed":13}}'::jsonb
where geojson_path = 'cliopatria/v0.2.1/world-borders-1900-2000-i18n.geojson';
