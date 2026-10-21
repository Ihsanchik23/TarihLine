import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getHistoryData } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { addRouteItem, deleteRoute, moveRouteItem, removeRouteItem, updateRoute, updateRouteItemComment } from "../actions";
import "../routes.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function RouteEditorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/auth?next=${encodeURIComponent(`/routes/${id}`)}`);

  const [{ data: route }, { data: rawItems }, history, query] = await Promise.all([
    supabase.from("routes").select("id, title, description, updated_at").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("route_items").select("id, record_id, position, author_comment").eq("route_id", id).order("position"),
    getHistoryData(),
    searchParams,
  ]);
  if (!route) notFound();

  const eventById = new Map(history.records.filter((record) => record.type === "event").map((record) => [record.id, record]));
  const items = (rawItems ?? []).flatMap((item) => {
    const record = eventById.get(item.record_id);
    return record ? [{ ...item, record }] : [];
  });
  const included = new Set(items.map((item) => item.record_id));
  const availableEvents = [...eventById.values()].filter((record) => !included.has(record.id)).sort((a, b) => a.startYear - b.startYear);

  return <main className="route-editor-page">
    <header className="routes-header">
      <Link className="routes-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <nav aria-label="Навигация"><Link href="/">Карта</Link><Link href="/catalog">Каталог</Link><Link className="is-active" href="/routes">Маршруты</Link><Link href="/profile">Профиль</Link></nav>
    </header>

    <section className="route-editor-hero">
      <div><Link href="/routes"><span aria-hidden="true">←</span> Все маршруты</Link><span>ЛИЧНЫЙ МАРШРУТ</span><h1>{route.title}</h1><p>{route.description || "Добавьте описание, чтобы зафиксировать идею маршрута."}</p></div>
      {items.length ? <Link className="route-launch" href={`/routes/${route.id}/map`}>Запустить на карте <span aria-hidden="true">→</span></Link> : <span className="route-launch is-disabled">Сначала добавьте событие</span>}
    </section>

    <div className="route-editor-layout">
      <section className="route-sequence">
        <div className="routes-section-heading"><span>01</span><div><h2>Последовательность</h2><p>Меняйте порядок событий и добавляйте собственный комментарий к каждой точке.</p></div></div>
        {query.error ? <div className="routes-alert routes-alert--error" role="alert">{query.error}</div> : null}
        {query.message ? <div className="routes-alert" role="status">{query.message}</div> : null}
        {items.length ? <ol className="route-sequence-list">{items.map((item, index) => <li key={item.id}>
          <div className="route-sequence-line"><span>{String(index + 1).padStart(2, "0")}</span></div>
          <article>
            <div className="route-sequence-meta"><strong>{item.record.startYear}</strong><span>{item.record.location.ru}</span></div>
            <h2><Link href={`/catalog/${item.record.slug}`}>{item.record.title.ru}</Link></h2>
            <p>{item.record.summary.ru}</p>
            <form className="route-comment-form" action={updateRouteItemComment}>
              <input name="routeId" type="hidden" value={route.id} />
              <input name="itemId" type="hidden" value={item.id} />
              <label><span>Комментарий к точке</span><textarea name="authorComment" rows={2} maxLength={1000} defaultValue={item.author_comment ?? ""} placeholder="Почему эта точка важна для маршрута" /></label>
              <button type="submit">Сохранить комментарий</button>
            </form>
            <div className="route-item-actions">
              <div>
                <form action={moveRouteItem}><input name="routeId" type="hidden" value={route.id} /><input name="itemId" type="hidden" value={item.id} /><input name="direction" type="hidden" value="up" /><button type="submit" disabled={index === 0} aria-label="Переместить выше">↑</button></form>
                <form action={moveRouteItem}><input name="routeId" type="hidden" value={route.id} /><input name="itemId" type="hidden" value={item.id} /><input name="direction" type="hidden" value="down" /><button type="submit" disabled={index === items.length - 1} aria-label="Переместить ниже">↓</button></form>
              </div>
              <form action={removeRouteItem}><input name="routeId" type="hidden" value={route.id} /><input name="itemId" type="hidden" value={item.id} /><button type="submit">Удалить точку</button></form>
            </div>
          </article>
        </li>)}</ol> : <div className="routes-empty"><span>＋</span><h2>Маршрут пока пуст</h2><p>Добавьте первое событие через форму справа.</p></div>}
      </section>

      <aside className="route-editor-sidebar">
        <section>
          <div className="routes-section-heading"><span>02</span><div><h2>Добавить точку</h2><p>Доступны опубликованные события.</p></div></div>
          {availableEvents.length ? <form action={addRouteItem}>
            <input name="routeId" type="hidden" value={route.id} />
            <label><span>Событие</span><select name="recordId" required>{availableEvents.map((event) => <option value={event.id} key={event.id}>{event.startYear} · {event.title.ru}</option>)}</select></label>
            <label><span>Комментарий</span><textarea name="authorComment" rows={3} maxLength={1000} placeholder="Необязательно" /></label>
            <button type="submit">Добавить в маршрут</button>
          </form> : <p className="route-sidebar-empty">Все доступные события уже добавлены.</p>}
        </section>

        <section>
          <div className="routes-section-heading"><span>03</span><div><h2>Настройки</h2><p>Название и описание маршрута.</p></div></div>
          <form action={updateRoute}>
            <input name="routeId" type="hidden" value={route.id} />
            <label><span>Название</span><input name="title" type="text" minLength={2} maxLength={120} defaultValue={route.title} required /></label>
            <label><span>Описание</span><textarea name="description" rows={5} maxLength={1000} defaultValue={route.description ?? ""} /></label>
            <button type="submit">Сохранить маршрут</button>
          </form>
          <form className="route-delete-form" action={deleteRoute}><input name="routeId" type="hidden" value={route.id} /><button type="submit">Удалить маршрут</button></form>
        </section>
      </aside>
    </div>
  </main>;
}
