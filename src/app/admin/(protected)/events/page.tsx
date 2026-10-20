import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type EventsPageProps = {
  searchParams: Promise<{ created?: string }>;
};

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  verified: "Проверено",
  published: "Опубликовано",
  archived: "В архиве",
};

const categoryLabels: Record<string, string> = {
  politics: "Политика",
  war: "Войны и конфликты",
  society: "Общество",
  economy: "Экономика",
  culture: "Культура",
  science: "Наука и технологии",
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const supabase = await createClient();
  const { created } = await searchParams;
  const { data } = await supabase
    .from("historical_records")
    .select("id,title_ru,title_kk,status,category,created_at,event_details(start_year,end_year)")
    .eq("record_type", "event")
    .order("created_at", { ascending: false });

  const events = data ?? [];

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Материалы</span>
          <h1>События</h1>
          <p>Черновики, проверенные и опубликованные исторические события.</p>
        </div>
        <Link className="admin-primary-link admin-primary-link-top" href="/admin/events/new">Добавить событие</Link>
      </header>

      {created === "1" ? <div className="admin-success" role="status">Черновик события сохранён</div> : null}

      {events.length ? (
        <section className="admin-record-list" aria-label="Список событий">
          {events.map((event) => {
            const detail = Array.isArray(event.event_details) ? event.event_details[0] : event.event_details;
            const period = detail
              ? detail.end_year && detail.end_year !== detail.start_year
                ? `${detail.start_year}–${detail.end_year}`
                : `${detail.start_year}`
              : "Период не указан";

            return (
              <article className="admin-record-row" key={event.id}>
                <div className="admin-record-period">{period}</div>
                <div className="admin-record-copy">
                  <h2>{event.title_ru}</h2>
                  <p>{event.title_kk}</p>
                </div>
                <div className="admin-record-meta">
                  <span>{categoryLabels[event.category] ?? event.category}</span>
                  <span className={`admin-record-status admin-record-status-${event.status}`}>
                    {statusLabels[event.status] ?? event.status}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="admin-empty-state">
          <span>1900–2000</span>
          <h2>Событий пока нет</h2>
          <p>Создайте первый двуязычный черновик. Он останется скрытым до проверки и публикации.</p>
          <Link className="admin-primary-link" href="/admin/events/new">Создать событие</Link>
        </section>
      )}
    </div>
  );
}
