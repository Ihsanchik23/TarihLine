import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceEditor, type SourceEditorValues } from "@/components/admin/source-editor";
import { createClient } from "@/lib/supabase/server";

type SourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; linked?: string }>;
};

export default async function SourcePage({ params, searchParams }: SourcePageProps) {
  const { id } = await params;
  const { saved, linked } = await searchParams;
  const supabase = await createClient();
  const [sourceResult, recordLinksResult, markerLinksResult, relationLinksResult, mediaResult, bordersResult, draftsResult] = await Promise.all([
    supabase.from("sources").select("*").eq("id", id).maybeSingle(),
    supabase.from("record_sources").select("record_id").eq("source_id", id),
    supabase.from("marker_sources").select("marker_id").eq("source_id", id),
    supabase.from("relation_sources").select("relation_id").eq("source_id", id),
    supabase.from("media").select("id,caption_ru,media_type").eq("source_id", id),
    supabase.from("border_layers").select("id,title_ru,status").eq("source_id", id),
    supabase.from("historical_records").select("id,title_ru,record_type,status").eq("status", "draft").order("created_at", { ascending: false }),
  ]);
  const source = sourceResult.data;
  if (!source) notFound();
  const recordIds = (recordLinksResult.data ?? []).map((link) => link.record_id);
  const recordsResult = recordIds.length ? await supabase.from("historical_records").select("id,title_ru,record_type,status").in("id", recordIds) : { data: [], error: null };
  const linkedIds = new Set(recordIds);
  const draftRecords = (draftsResult.data ?? []).filter((record) => !linkedIds.has(record.id)).map((record) => ({ id: record.id, title: record.title_ru, type: record.record_type }));
  const usageCount = recordIds.length + (markerLinksResult.data?.length ?? 0) + (relationLinksResult.data?.length ?? 0) + (mediaResult.data?.length ?? 0) + (bordersResult.data?.length ?? 0);
  const values: SourceEditorValues = { id: source.id, title: source.title, url: source.url ?? "", author: source.author ?? "", publisher: source.publisher ?? "", license: source.license ?? "", notes: source.notes ?? "" };
  return <div className="admin-dashboard admin-editor-page">
    <header className="admin-page-header"><div><span className="admin-kicker">Источник</span><h1>{source.title}</h1><p>{usageCount ? `Используется в ${usageCount} связях.` : "Пока не связан с материалами."}</p></div><Link className="admin-map-link" href="/admin/sources">К списку</Link></header>
    {saved === "1" ? <div className="admin-success" role="status">Изменения источника сохранены</div> : null}
    {linked === "1" ? <div className="admin-success" role="status">Источник добавлен к черновику</div> : null}
    {(recordsResult.data?.length || bordersResult.data?.length || mediaResult.data?.length) ? <section className="admin-source-usage"><span className="admin-kicker">Использование</span><div className="admin-source-usage-grid">{recordsResult.data?.map((record) => <Link href={`/admin/${record.record_type === "event" ? "events" : "people"}/${record.id}`} key={record.id}><strong>{record.title_ru}</strong><span>{record.record_type === "event" ? "Событие" : "Личность"} · {record.status === "draft" ? "Черновик" : record.status === "verified" ? "Проверено" : "Опубликовано"}</span></Link>)}{bordersResult.data?.map((layer) => <div key={layer.id}><strong>{layer.title_ru}</strong><span>Слой границ · {layer.status}</span></div>)}{mediaResult.data?.map((media) => <div key={media.id}><strong>{media.caption_ru}</strong><span>Медиа · {media.media_type}</span></div>)}</div></section> : null}
    <SourceEditor source={values} draftRecords={draftRecords} usageCount={usageCount} />
  </div>;
}
