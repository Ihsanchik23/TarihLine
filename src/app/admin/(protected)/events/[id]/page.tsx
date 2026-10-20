import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm, type EventFormValues } from "@/components/admin/event-form";
import { getHistoricalMapLayers } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";

type EditEventPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditEventPage({ params, searchParams }: EditEventPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const [recordResult, detailResult, sourceLinkResult, markerResult, mapLayers] = await Promise.all([
    supabase.from("historical_records").select("*").eq("id", id).eq("record_type", "event").eq("status", "draft").maybeSingle(),
    supabase.from("event_details").select("*").eq("record_id", id).maybeSingle(),
    supabase.from("record_sources").select("source_id").eq("record_id", id).limit(1).maybeSingle(),
    supabase.from("map_markers").select("*").eq("record_id", id).eq("is_primary", true).neq("status", "archived").order("created_at").limit(1).maybeSingle(),
    getHistoricalMapLayers(),
  ]);

  const record = recordResult.data;
  const detail = detailResult.data;
  const sourceLink = sourceLinkResult.data;
  const marker = markerResult.data;

  if (!record || !detail || !sourceLink) notFound();

  const sourceResult = await supabase.from("sources").select("*").eq("id", sourceLink.source_id).maybeSingle();
  const source = sourceResult.data;
  if (!source) notFound();

  const initialValues: EventFormValues = {
    recordId: record.id,
    sourceId: source.id,
    titleRu: record.title_ru,
    titleKk: record.title_kk,
    summaryRu: record.summary_ru,
    summaryKk: record.summary_kk,
    descriptionRu: record.description_ru,
    descriptionKk: record.description_kk,
    significanceRu: detail.significance_ru,
    significanceKk: detail.significance_kk,
    category: record.category,
    startYear: detail.start_year,
    endYear: detail.end_year,
    datePrecision: detail.date_precision,
    sourceTitle: source.title,
    sourceUrl: source.url ?? "",
    sourceAuthor: source.author ?? "",
    sourcePublisher: source.publisher ?? "",
    sourceLicense: source.license ?? "",
    locationRu: marker?.title_ru ?? "",
    locationKk: marker?.title_kk ?? "",
    locationPrecision: marker?.precision === "approximate" ? "approximate" : "point",
    longitude: marker?.longitude ?? null,
    latitude: marker?.latitude ?? null,
  };

  return (
    <div className="admin-dashboard admin-editor-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Черновик события</span>
          <h1>Редактирование</h1>
          <p>Исправьте содержание, источник и укажите основное место события.</p>
        </div>
        <Link className="admin-map-link" href="/admin/events">К списку</Link>
      </header>
      {saved === "1" ? <div className="admin-success" role="status">Изменения и точка на карте сохранены</div> : null}
      <EventForm initialValues={initialValues} mapLayers={mapLayers} />
    </div>
  );
}
