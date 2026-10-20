import { prototypeRecords } from "@/data/prototype-records";
import type { HistoryRecord } from "@/lib/history-types";
import type { Tables } from "@/types/database";
import { createClient } from "./supabase/server";

type HistoricalRecordRow = Tables<"historical_records">;
type EventDetailRow = Tables<"event_details">;
type PersonDetailRow = Tables<"person_details">;
type MarkerRow = Tables<"map_markers">;
type LocationRow = Tables<"locations">;
type RecordSourceRow = Tables<"record_sources">;
type SourceRow = Tables<"sources">;

export type HistoryData = {
  records: HistoryRecord[];
  prototype: boolean;
};

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

export async function getHistoryData(): Promise<HistoryData> {
  try {
    const supabase = await createClient();
    const recordsResult = await supabase
      .from("historical_records")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: true });

    if (recordsResult.error || !recordsResult.data?.length) {
      return { records: prototypeRecords, prototype: true };
    }

    const records = recordsResult.data as HistoricalRecordRow[];
    const recordIds = records.map((record) => record.id);

    const [eventsResult, peopleResult, markersResult, linksResult] = await Promise.all([
      supabase.from("event_details").select("*").in("record_id", recordIds),
      supabase.from("person_details").select("*").in("record_id", recordIds),
      supabase
        .from("map_markers")
        .select("*")
        .in("record_id", recordIds)
        .eq("status", "published")
        .order("is_primary", { ascending: false }),
      supabase.from("record_sources").select("*").in("record_id", recordIds),
    ]);

    if (eventsResult.error || peopleResult.error || markersResult.error || linksResult.error) {
      return { records: prototypeRecords, prototype: true };
    }

    const events = (eventsResult.data ?? []) as EventDetailRow[];
    const people = (peopleResult.data ?? []) as PersonDetailRow[];
    const markers = (markersResult.data ?? []) as MarkerRow[];
    const links = (linksResult.data ?? []) as RecordSourceRow[];
    const locationIds = markers.flatMap((marker) => marker.location_id ? [marker.location_id] : []);
    const sourceIds = [...new Set(links.map((link) => link.source_id))];

    const [locationsResult, sourcesResult] = await Promise.all([
      locationIds.length
        ? supabase.from("locations").select("*").in("id", locationIds)
        : Promise.resolve({ data: [] as LocationRow[], error: null }),
      sourceIds.length
        ? supabase.from("sources").select("*").in("id", sourceIds)
        : Promise.resolve({ data: [] as SourceRow[], error: null }),
    ]);

    if (locationsResult.error || sourcesResult.error) {
      return { records: prototypeRecords, prototype: true };
    }

    const locations = (locationsResult.data ?? []) as LocationRow[];
    const sources = (sourcesResult.data ?? []) as SourceRow[];
    const eventByRecord = new Map(events.map((detail) => [detail.record_id, detail]));
    const personByRecord = new Map(people.map((detail) => [detail.record_id, detail]));
    const markerByRecord = new Map<string, MarkerRow>();
    const locationById = new Map(locations.map((location) => [location.id, location]));
    const sourceById = new Map(sources.map((source) => [source.id, source]));

    markers.forEach((marker) => {
      if (!markerByRecord.has(marker.record_id) || marker.is_primary) {
        markerByRecord.set(marker.record_id, marker);
      }
    });

    const mapped = records.flatMap<HistoryRecord>((record) => {
      const marker = markerByRecord.get(record.id);
      const location = marker?.location_id ? locationById.get(marker.location_id) : null;
      const coordinates = resolveCoordinates(marker, location ?? null);
      const recordSources = links
        .filter((link) => link.record_id === record.id)
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

    return mapped.length
      ? { records: mapped, prototype: false }
      : { records: prototypeRecords, prototype: true };
  } catch {
    return { records: prototypeRecords, prototype: true };
  }
}
