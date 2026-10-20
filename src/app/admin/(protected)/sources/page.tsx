import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function sourceHost(url: string | null) {
  if (!url) return "Без ссылки";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Некорректная ссылка";
  }
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const [sourcesResult, recordsResult, markersResult, relationsResult, mediaResult, bordersResult] = await Promise.all([
    supabase.from("sources").select("*").order("updated_at", { ascending: false }),
    supabase.from("record_sources").select("source_id"),
    supabase.from("marker_sources").select("source_id"),
    supabase.from("relation_sources").select("source_id"),
    supabase.from("media").select("source_id"),
    supabase.from("border_layers").select("source_id"),
  ]);
  const counts = new Map<string, number>();
  for (const rows of [recordsResult.data, markersResult.data, relationsResult.data, mediaResult.data, bordersResult.data]) {
    for (const row of rows ?? []) counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
  }
  const sources = sourcesResult.data ?? [];
  return <div className="admin-dashboard">
    <header className="admin-page-header"><div><span className="admin-kicker">Библиография</span><h1>Источники</h1><p>Публикации, архивы и наборы данных, на которых основаны материалы TarihLine.</p></div></header>
    {deleted === "1" ? <div className="admin-success" role="status">Неиспользуемый источник удалён</div> : null}
    {sources.length ? <section className="admin-record-list" aria-label="Список источников">{sources.map((source) => <Link className="admin-record-row admin-source-row" href={`/admin/sources/${source.id}`} key={source.id}><div className="admin-record-period">{counts.get(source.id) ?? 0}</div><div className="admin-record-copy"><h2>{source.title}</h2><p>{source.publisher ?? source.author ?? sourceHost(source.url)}{source.url ? ` · ${sourceHost(source.url)}` : ""}</p></div><div className="admin-record-meta"><span>{source.license || "Лицензия не указана"}</span></div></Link>)}</section> : <section className="admin-empty-state"><span>ИСТОЧНИКИ</span><h2>Источников пока нет</h2><p>Они появятся после создания первого события или личности.</p></section>}
  </div>;
}
