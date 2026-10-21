import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  verified: "Проверено",
  published: "Опубликовано",
  archived: "В архиве",
};

export default async function MapLayersPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const [{ data: layers }, { data: sources }] = await Promise.all([
    supabase.from("border_layers").select("id,title_ru,title_kk,status,valid_from,valid_to,snapshot_year,coverage,source_id,updated_at").order("priority", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("sources").select("id,title"),
  ]);
  const sourceById = new Map((sources ?? []).map((source) => [source.id, source.title]));

  return <div className="admin-dashboard">
    <header className="admin-page-header"><div><span className="admin-kicker">Историческая карта</span><h1>Слои границ</h1><p>GeoJSON-реконструкции политических границ и периоды их отображения на таймлайне.</p></div><Link className="admin-primary-link admin-primary-link-top" href="/admin/maps/new">Добавить слой</Link></header>
    {deleted === "1" ? <div className="admin-success" role="status">Слой и его GeoJSON-файл удалены</div> : null}
    {layers?.length ? <section className="admin-record-list" aria-label="Список слоёв границ">{layers.map((layer) => <Link className="admin-record-row admin-map-layer-row" href={`/admin/maps/${layer.id}`} key={layer.id}><div className="admin-record-period">{layer.valid_from === layer.valid_to ? layer.valid_from : `${layer.valid_from}–${layer.valid_to}`}</div><div className="admin-record-copy"><h2>{layer.title_ru}</h2><p>{layer.title_kk} · {sourceById.get(layer.source_id) ?? "Источник не найден"}</p></div><div className="admin-record-meta"><span>{layer.coverage === "global" ? "Весь мир" : layer.coverage === "partial" ? "Частичный охват" : "Локальный"}</span><span className={`admin-record-status admin-record-status-${layer.status}`}>{statusLabels[layer.status] ?? layer.status}</span></div></Link>)}</section> : <section className="admin-empty-state"><span>GEOJSON</span><h2>Слоёв пока нет</h2><p>Загрузите проверенную реконструкцию границ и укажите период её действия.</p><Link className="admin-primary-link" href="/admin/maps/new">Создать первый слой</Link></section>}
  </div>;
}
