import Link from "next/link";
import { notFound } from "next/navigation";
import { MapLayerEditor, type MapLayerValues } from "@/components/admin/map-layer-form";
import { MapLayerPreview } from "@/components/admin/map-layer-preview";
import { createClient } from "@/lib/supabase/server";

export default async function MapLayerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();
  const [{ data: layer }, { data: sources }] = await Promise.all([
    supabase.from("border_layers").select("*").eq("id", id).maybeSingle(),
    supabase.from("sources").select("id,title,license").order("title"),
  ]);
  if (!layer) notFound();
  const publicUrl = supabase.storage.from("historical-maps").getPublicUrl(layer.geojson_path).data.publicUrl;
  const values: MapLayerValues = {
    id: layer.id,
    titleRu: layer.title_ru,
    titleKk: layer.title_kk,
    areaRu: layer.area_label_ru,
    areaKk: layer.area_label_kk,
    administrativeLevel: layer.administrative_level,
    coverage: layer.coverage,
    license: layer.license,
    sourceId: layer.source_id,
    validFrom: layer.valid_from,
    validTo: layer.valid_to,
    snapshotYear: layer.snapshot_year,
    priority: layer.priority,
    reconstruction: layer.reconstruction,
    status: layer.status,
  };
  return <div className="admin-dashboard admin-editor-page">
    <header className="admin-page-header"><div><span className="admin-kicker">Слой границ · {layer.valid_from}–{layer.valid_to}</span><h1>{layer.title_ru}</h1><p>{layer.area_label_ru} · версия {layer.version} · {layer.geojson_path}</p></div><Link className="admin-map-link" href="/admin/maps">К списку</Link></header>
    {created === "1" ? <div className="admin-success" role="status">GeoJSON проверен, слой сохранён как черновик</div> : null}
    <section className="admin-map-preview-section"><div><span className="admin-kicker">Предпросмотр геометрии</span><h2>{layer.snapshot_year}</h2><p>Предпросмотр использует тот же базовый стиль, что и основная карта.</p><a href={publicUrl} target="_blank" rel="noreferrer">Открыть GeoJSON <span aria-hidden="true">↗</span></a></div><MapLayerPreview url={publicUrl} reconstruction={layer.reconstruction} /></section>
    <MapLayerEditor layer={values} sources={sources ?? []} />
  </div>;
}
