import Link from "next/link";
import { redirect } from "next/navigation";
import { getHistoryData } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { createRoute } from "./actions";
import "./routes.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function RoutesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth?next=/routes");

  const [{ data: routes }, history, params] = await Promise.all([
    supabase.from("routes").select("id, title, description, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
    getHistoryData(),
    searchParams,
  ]);
  const routeIds = (routes ?? []).map((route) => route.id);
  const { data: routeItems } = routeIds.length
    ? await supabase.from("route_items").select("route_id, record_id").in("route_id", routeIds)
    : { data: [] };
  const events = history.records.filter((record) => record.type === "event").sort((a, b) => a.startYear - b.startYear);
  const eventById = new Map(events.map((event) => [event.id, event]));

  return <main className="routes-page">
    <header className="routes-header">
      <Link className="routes-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <nav aria-label="Навигация"><Link href="/">Карта</Link><Link href="/catalog">Каталог</Link><Link className="is-active" href="/routes">Маршруты</Link><Link href="/profile">Профиль</Link></nav>
    </header>

    <section className="routes-intro">
      <div><span>ЛИЧНАЯ КОЛЛЕКЦИЯ</span><h1>Исторические маршруты</h1><p>Собирайте события в собственную последовательность и проходите её по карте год за годом.</p></div>
      <strong>{routes?.length ?? 0}<small>маршрутов</small></strong>
    </section>

    <div className="routes-layout">
      <section className="routes-list">
        <div className="routes-section-heading"><span>01</span><div><h2>Мои маршруты</h2><p>Приватные подборки доступны только владельцу аккаунта.</p></div></div>
        {params.error ? <div className="routes-alert routes-alert--error" role="alert">{params.error}</div> : null}
        {params.message ? <div className="routes-alert" role="status">{params.message}</div> : null}
        {routes?.length ? <div className="route-card-grid">{routes.map((route) => {
          const itemRecords = (routeItems ?? []).filter((item) => item.route_id === route.id).flatMap((item) => {
            const record = eventById.get(item.record_id);
            return record ? [record] : [];
          });
          const years = itemRecords.map((record) => record.startYear);
          return <article className="route-card" key={route.id}>
            <div className="route-card__meta"><span>Личный маршрут</span><strong>{itemRecords.length} {itemRecords.length === 1 ? "точка" : "точек"}</strong></div>
            <h2><Link href={`/routes/${route.id}`}>{route.title}</Link></h2>
            <p>{route.description || "Описание маршрута пока не добавлено."}</p>
            <div className="route-card__footer"><span>{years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : "Без событий"}</span><Link href={`/routes/${route.id}`}>Открыть <span aria-hidden="true">→</span></Link></div>
          </article>;
        })}</div> : <div className="routes-empty"><span>⌁</span><h2>Первый маршрут начинается здесь</h2><p>Задайте тему и выберите опубликованные исторические события.</p></div>}
      </section>

      <aside className="route-create">
        <div className="routes-section-heading"><span>02</span><div><h2>Новый маршрут</h2><p>События добавятся в хронологическом порядке.</p></div></div>
        <form action={createRoute}>
          <label><span>Название</span><input name="title" type="text" minLength={2} maxLength={120} placeholder="Например, Путь к независимости" required /></label>
          <label><span>Описание</span><textarea name="description" rows={4} maxLength={1000} placeholder="Идея и контекст маршрута" /></label>
          <fieldset><legend>Начальные события</legend>{events.length ? <div className="route-event-options">{events.map((event) => <label key={event.id}><input name="recordIds" type="checkbox" value={event.id} /><span><strong>{event.startYear}</strong><i>{event.title.ru}</i></span></label>)}</div> : <p>Опубликованных событий пока нет.</p>}</fieldset>
          <button type="submit">Создать маршрут</button>
        </form>
      </aside>
    </div>
  </main>;
}
