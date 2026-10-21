alter table public.border_layers
add column change_years integer[] not null default '{}';

update public.border_layers
set change_years = array[1900, 1905, 1908, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919, 1920, 1922, 1924, 1926, 1927, 1928, 1929, 1930, 1932, 1936, 1938, 1939, 1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949, 1950, 1953, 1956, 1958, 1960, 1961, 1963, 1967, 1969, 1973, 1976, 1979, 1983, 1987, 1990, 1991, 1992, 1996, 2000]
where geojson_path = 'cliopatria/v0.2.1/world-borders-1900-2000-i18n.geojson';
