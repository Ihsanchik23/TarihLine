import { getFoundationStatus } from "@/lib/supabase/health";
import Link from "next/link";

const foundations = [
  {
    name: "Приложение",
    value: "Next.js 16",
    detail: "App Router, TypeScript и Tailwind CSS",
  },
  {
    name: "Данные",
    value: "Supabase",
    detail: "Типизированное подключение и защищённые таблицы",
  },
  {
    name: "Публикация",
    value: "Vercel",
    detail: "Автоматический деплой из ветки main",
  },
];

export default async function Home() {
  const status = await getFoundationStatus();

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="TarihLine">
          <span className="brand-mark">T</span>
          <span>TarihLine</span>
        </Link>
        <span className="stage-label">Этап 1 · Основа</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">История Казахстана · 1900–2000</p>
          <h1>Прошлое становится ближе, когда видно связи.</h1>
          <p className="lead">
            TarihLine объединит события, личности, места и источники на одной
            интерактивной карте с временной шкалой.
          </p>
          <div className="connection-state" data-state={status.connected ? "ready" : "waiting"}>
            <span className="state-dot" />
            <div>
              <strong>{status.label}</strong>
              <span>{status.detail}</span>
            </div>
          </div>
        </div>

        <div className="map-preview" aria-label="Схематичная карта Казахстана">
          <div className="map-grid" />
          <div className="route route-one" />
          <div className="route route-two" />
          <span className="marker marker-one" />
          <span className="marker marker-two" />
          <span className="marker marker-three" />
          <div className="map-caption">
            <span>Карта</span>
            <strong>Следующий этап</strong>
          </div>
          <div className="year-scale">
            <span>1900</span>
            <span>1950</span>
            <span>2000</span>
          </div>
        </div>
      </section>

      <section className="foundation-section">
        <div className="section-heading">
          <p className="eyebrow">Техническая готовность</p>
          <h2>Фундамент проекта собран</h2>
        </div>
        <div className="foundation-grid">
          {foundations.map((item, index) => (
            <article className="foundation-card" key={item.name}>
              <span className="card-number">0{index + 1}</span>
              <p>{item.name}</p>
              <h3>{item.value}</h3>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span>TarihLine</span>
        <span>Интерактивная историческая платформа</span>
      </footer>
    </main>
  );
}
