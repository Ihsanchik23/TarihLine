import { unstable_cache } from "next/cache";
import type { HistoricalMapLayer, HistoryRecord, HistoryRelation } from "@/lib/history-types";
import type { Tables } from "@/types/database";
import { HISTORY_CACHE_TAG } from "./history-cache";
import { createPublicClient } from "./supabase/public";

type HistoricalRecordRow = Tables<"historical_records">;
type EventDetailRow = Tables<"event_details">;
type PersonDetailRow = Tables<"person_details">;
type MarkerRow = Tables<"map_markers">;
type LocationRow = Tables<"locations">;
type RecordSourceRow = Tables<"record_sources">;
type SourceRow = Tables<"sources">;
type RelationRow = Tables<"relations">;
type BorderLayerRow = Tables<"border_layers">;
type SupabasePublicClient = ReturnType<typeof createPublicClient>;

export type HistoryData = {
  records: HistoryRecord[];
  relations: HistoryRelation[];
  mapLayers: HistoricalMapLayer[];
};

function resolveGeojsonUrl(client: SupabasePublicClient, path: string) {
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return client.storage.from("historical-maps").getPublicUrl(path).data.publicUrl;
}

async function loadMapLayers(client: SupabasePublicClient) {
  const layersResult = await client
    .from("border_layers")
    .select("id,title_ru,title_kk,area_label_ru,area_label_kk,snapshot_year,valid_from,valid_to,change_years,change_summary,geojson_path,administrative_level,coverage,reconstruction,license,priority,source_id")
    .eq("status", "published")
    .order("priority", { ascending: false });

  if (layersResult.error) throw layersResult.error;
  if (!layersResult.data?.length) return [];

  const layers = layersResult.data as BorderLayerRow[];
  const sourceIds = [...new Set(layers.map((layer) => layer.source_id))];
  const sourcesResult = await client.from("sources").select("id,title,url,publisher").in("id", sourceIds);
  if (sourcesResult.error) throw sourcesResult.error;

  const sourceById = new Map(
    ((sourcesResult.data ?? []) as SourceRow[]).map((source) => [source.id, source]),
  );

  return layers.flatMap<HistoricalMapLayer>((layer) => {
    const source = sourceById.get(layer.source_id);
    if (!source) return [];

    return [{
      id: layer.id,
      title: { ru: layer.title_ru, kk: layer.title_kk },
      areaLabel: { ru: layer.area_label_ru, kk: layer.area_label_kk },
      snapshotYear: layer.snapshot_year,
      validFrom: layer.valid_from,
      validTo: layer.valid_to,
      changeYears: layer.change_years.length ? layer.change_years : [layer.valid_from, layer.valid_to],
      changeSummary: layer.change_summary as HistoricalMapLayer["changeSummary"],
      geojsonUrl: resolveGeojsonUrl(client, layer.geojson_path),
      administrativeLevel: layer.administrative_level,
      coverage: layer.coverage,
      reconstruction: layer.reconstruction,
      license: layer.license,
      priority: layer.priority,
      source: {
        title: source.title,
        url: source.url ?? "",
        publisher: source.publisher ?? source.title,
      },
    }];
  });
}

async function loadHistoricalMapLayers() {
  const supabase = createPublicClient();
  return loadMapLayers(supabase);
}

const getCachedHistoricalMapLayers = unstable_cache(
  loadHistoricalMapLayers,
  ["tarihline-map-layers-v1"],
  { revalidate: 3600, tags: [HISTORY_CACHE_TAG] },
);

export async function getHistoricalMapLayers() {
  try {
    return await getCachedHistoricalMapLayers();
  } catch {
    return [];
  }
}

function eventDateLabel(detail: EventDetailRow) {
  if (detail.start_date) {
    const date = new Date(`${detail.start_date}T00:00:00Z`);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    };

    return {
      ru: new Intl.DateTimeFormat("ru-RU", options).format(date),
      kk: new Intl.DateTimeFormat("kk-KZ", options).format(date),
    };
  }

  const range = detail.end_year && detail.end_year !== detail.start_year
    ? `${detail.start_year}–${detail.end_year}`
    : `${detail.start_year}`;

  return { ru: `${range} год`, kk: `${range} жыл` };
}

function resolveCoordinates(marker: MarkerRow | undefined, location: LocationRow | null) {
  const longitude = marker?.longitude ?? location?.longitude;
  const latitude = marker?.latitude ?? location?.latitude;

  return typeof longitude === "number" && typeof latitude === "number"
    ? [longitude, latitude] as [number, number]
    : null;
}

function personDateLabel(detail: PersonDetailRow) {
  const end = detail.death_year ?? "…";
  const value = `${detail.birth_year}–${end}`;
  return { ru: value, kk: value };
}

async function loadHistoryData(): Promise<HistoryData> {
  const supabase = createPublicClient();
    const mapLayersPromise = loadMapLayers(supabase);
    const recordsResult = await supabase
      .from("historical_records")
      .select("id,slug,record_type,title_ru,title_kk,summary_ru,summary_kk,description_ru,description_kk,category")
      .eq("status", "published")
      .order("published_at", { ascending: true });

    if (recordsResult.error || !recordsResult.data?.length) {
      return { records: [], relations: [], mapLayers: await mapLayersPromise };
    }

    const records = recordsResult.data as HistoricalRecordRow[];
    const recordIds = records.map((record) => record.id);

    const [eventsResult, peopleResult, markersResult, linksResult, relationsResult] = await Promise.all([
      supabase.from("event_details").select("record_id,start_date,start_year,end_year,significance_ru,significance_kk").in("record_id", recordIds),
      supabase.from("person_details").select("record_id,birth_year,death_year,biography_ru,biography_kk").in("record_id", recordIds),
      supabase
        .from("map_markers")
        .select("record_id,longitude,latitude,location_id,is_primary,title_ru,title_kk")
        .in("record_id", recordIds)
        .eq("status", "published")
        .order("is_primary", { ascending: false }),
      supabase.from("record_sources").select("record_id,source_id").in("record_id", recordIds),
      supabase
        .from("relations")
        .select("id,from_record_id,to_record_id,relation_type,explanation_ru,explanation_kk,from_year,to_year")
        .eq("status", "published")
        .or(`from_record_id.in.(${recordIds.join(",")}),to_record_id.in.(${recordIds.join(",")})`),
    ]);

    if (eventsResult.error || peopleResult.error || markersResult.error || linksResult.error || relationsResult.error) {
      return { records: [], relations: [], mapLayers: await mapLayersPromise };
    }

    const events = (eventsResult.data ?? []) as EventDetailRow[];
    const people = (peopleResult.data ?? []) as PersonDetailRow[];
    const markers = (markersResult.data ?? []) as MarkerRow[];
    const links = (linksResult.data ?? []) as RecordSourceRow[];
    const relations = (relationsResult.data ?? []) as RelationRow[];
    const locationIds = markers.flatMap((marker) => marker.location_id ? [marker.location_id] : []);
    const sourceIds = [...new Set(links.map((link) => link.source_id))];

    const [locationsResult, sourcesResult] = await Promise.all([
      locationIds.length
        ? supabase.from("locations").select("id,longitude,latitude,historical_name_ru,historical_name_kk,name_ru,name_kk").in("id", locationIds)
        : Promise.resolve({ data: [] as LocationRow[], error: null }),
      sourceIds.length
        ? supabase.from("sources").select("id,title,url,publisher").in("id", sourceIds)
        : Promise.resolve({ data: [] as SourceRow[], error: null }),
    ]);

    if (locationsResult.error || sourcesResult.error) {
      return { records: [], relations: [], mapLayers: await mapLayersPromise };
    }

    const locations = (locationsResult.data ?? []) as LocationRow[];
    const sources = (sourcesResult.data ?? []) as SourceRow[];
    const eventByRecord = new Map(events.map((detail) => [detail.record_id, detail]));
    const personByRecord = new Map(people.map((detail) => [detail.record_id, detail]));
    const markerByRecord = new Map<string, MarkerRow>();
    const locationById = new Map(locations.map((location) => [location.id, location]));
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const linksByRecord = new Map<string, RecordSourceRow[]>();

    links.forEach((link) => {
      const recordLinks = linksByRecord.get(link.record_id) ?? [];
      recordLinks.push(link);
      linksByRecord.set(link.record_id, recordLinks);
    });

    markers.forEach((marker) => {
      if (!markerByRecord.has(marker.record_id) || marker.is_primary) {
        markerByRecord.set(marker.record_id, marker);
      }
    });

    const mapped = records.flatMap<HistoryRecord>((record) => {
      const marker = markerByRecord.get(record.id);
      const location = marker?.location_id ? locationById.get(marker.location_id) : null;
      const coordinates = resolveCoordinates(marker, location ?? null);
      const recordSources = (linksByRecord.get(record.id) ?? [])
        .flatMap((link) => {
          const source = sourceById.get(link.source_id);
          return source?.url
            ? [{ title: source.title, url: source.url, publisher: source.publisher ?? source.title }]
            : [];
        });

      if (record.record_type === "event") {
        const detail = eventByRecord.get(record.id);
        if (!detail) return [];

        return [{
          id: record.id,
          slug: record.slug,
          type: "event",
          title: { ru: record.title_ru, kk: record.title_kk },
          summary: { ru: record.summary_ru, kk: record.summary_kk },
          description: { ru: record.description_ru, kk: record.description_kk },
          significance: { ru: detail.significance_ru, kk: detail.significance_kk },
          category: record.category,
          startYear: detail.start_year,
          endYear: detail.end_year,
          dateLabel: eventDateLabel(detail),
          location: {
            ru: location?.historical_name_ru ?? location?.name_ru ?? marker?.title_ru ?? "Место не указано",
            kk: location?.historical_name_kk ?? location?.name_kk ?? marker?.title_kk ?? "Орын көрсетілмеген",
          },
          coordinates,
          locationKind: "event",
          sources: recordSources,
        }];
      }

      const detail = personByRecord.get(record.id);
      if (!detail) return [];

      return [{
        id: record.id,
        slug: record.slug,
        type: "person",
        title: { ru: record.title_ru, kk: record.title_kk },
        summary: { ru: record.summary_ru, kk: record.summary_kk },
        description: { ru: detail.biography_ru, kk: detail.biography_kk },
        significance: null,
        category: record.category,
        startYear: detail.birth_year,
        endYear: detail.death_year,
        dateLabel: personDateLabel(detail),
        location: {
          ru: location?.historical_name_ru ?? location?.name_ru ?? marker?.title_ru ?? "Место не указано",
          kk: location?.historical_name_kk ?? location?.name_kk ?? marker?.title_kk ?? "Орын көрсетілмеген",
        },
        coordinates,
        locationKind: "period",
        sources: recordSources,
      }];
    });

    const mappedRelations = relations
      .filter((relation) => recordIds.includes(relation.from_record_id) && recordIds.includes(relation.to_record_id))
      .map<HistoryRelation>((relation) => ({
        id: relation.id,
        fromRecordId: relation.from_record_id,
        toRecordId: relation.to_record_id,
        type: relation.relation_type,
        explanation: { ru: relation.explanation_ru, kk: relation.explanation_kk },
        fromYear: relation.from_year,
        toYear: relation.to_year,
      }));

    const mapLayers = await mapLayersPromise;
  return mapped.length
    ? { records: mapped, relations: mappedRelations, mapLayers }
    : { records: [], relations: [], mapLayers };
}

const getCachedHistoryData = unstable_cache(
  loadHistoryData,
  ["tarihline-history-data-v1"],
  { revalidate: 3600, tags: [HISTORY_CACHE_TAG] },
);

export async function getHistoryData(): Promise<HistoryData> {
  try {
    return await getCachedHistoryData();
  } catch {
    return { records: [], relations: [], mapLayers: [] };
  }
}
