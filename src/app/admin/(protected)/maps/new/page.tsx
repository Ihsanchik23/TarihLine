import Link from "next/link";
import { NewMapLayerForm } from "@/components/admin/map-layer-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewMapLayerPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sources").select("id,title,license").order("title");
  const sources = data ?? [];
  return <div className="admin-dashboard admin-editor-page">
    <header className="admin-page-header"><div><span className="admin-kicker">Новый слой</span><h1>Загрузка границ</h1><p>Файл проходит проверку в браузере и повторную проверку на сервере перед сохранением.</p></div><Link className="admin-map-link" href="/admin/maps">К списку</Link></header>
    {sources.length ? <NewMapLayerForm sources={sources} /> : <section className="admin-empty-state"><span>ИСТОЧНИК</span><h2>Сначала нужен источник</h2><p>Создайте событие с источником или добавьте библиографические данные, затем загрузите GeoJSON.</p><Link className="admin-primary-link" href="/admin/sources">Открыть источники</Link></section>}
  </div>;
}
