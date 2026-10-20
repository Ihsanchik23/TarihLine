import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CountCardProps = {
  label: string;
  value: number;
  detail: string;
};

function CountCard({ label, value, detail }: CountCardProps) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value.toLocaleString("ru-RU")}</strong>
      <p>{detail}</p>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [records, events, people, sources, layers] = await Promise.all([
    supabase.from("historical_records").select("id", { count: "exact", head: true }),
    supabase.from("historical_records").select("id", { count: "exact", head: true }).eq("record_type", "event"),
    supabase.from("historical_records").select("id", { count: "exact", head: true }).eq("record_type", "person"),
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("border_layers").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const counts = {
    records: records.count ?? 0,
    events: events.count ?? 0,
    people: people.count ?? 0,
    sources: sources.count ?? 0,
    layers: layers.count ?? 0,
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Панель управления</span>
          <h1>Контент TarihLine</h1>
          <p>Данные на карте появляются только после проверки и публикации.</p>
        </div>
        <Link className="admin-map-link" href="/">Открыть карту</Link>
      </header>

      <section className="admin-stats" aria-label="Сводка данных">
        <CountCard label="Все записи" value={counts.records} detail="Черновики и опубликованные материалы" />
        <CountCard label="События" value={counts.events} detail="Исторические события в базе" />
        <CountCard label="Личности" value={counts.people} detail="Исторические личности в базе" />
        <CountCard label="Источники" value={counts.sources} detail="Использованные публикации и наборы" />
      </section>

      <section className="admin-foundation-card">
        <div>
          <span className="admin-section-number">01</span>
          <div>
            <h2>Основа бэкенда готова</h2>
            <p>Авторизация, проверка роли администратора, защищённые маршруты и политики доступа работают через Supabase.</p>
          </div>
        </div>
        <div className="admin-foundation-status">
          <span className="admin-status-dot" />
          <span>{counts.layers} опубликованный слой границ</span>
        </div>
      </section>

      <section className="admin-next-section">
        <span className="admin-kicker">Библиография</span>
        <h2>Управление источниками</h2>
        <p>Проверяйте ссылки, лицензии и использование одного источника в разных исторических материалах.</p>
        <Link className="admin-primary-link" href="/admin/sources">Открыть источники</Link>
      </section>
    </div>
  );
}
