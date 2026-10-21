"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toggleBookmark } from "@/app/profile/actions";
import type { HistoryRecord, HistoryRelation, Language } from "@/lib/history-types";
import "./record-detail.css";

type RelatedRecord = {
  record: HistoryRecord;
  relation: HistoryRelation;
};

const copy = {
  ru: {
    map: "Карта", catalog: "Каталог", profile: "Профиль", event: "Историческое событие", person: "Историческая личность",
    overview: "Описание", significance: "Историческое значение", facts: "Основные сведения", date: "Дата",
    location: "Место", category: "Категория", coordinates: "Координаты", sources: "Источники",
    sourcesLead: "Материалы, использованные при подготовке публикации.", related: "Связанные материалы",
    relatedLead: "События и личности, связанные с этим материалом.", mapAction: "Показать на карте",
    back: "Вернуться в каталог", openSource: "Открыть источник", noSources: "Источники пока не прикреплены",
    addFavorite: "Добавить в избранное", removeFavorite: "Убрать из избранного", loginFavorite: "Войти и сохранить",
  },
  kk: {
    map: "Карта", catalog: "Каталог", profile: "Профиль", event: "Тарихи оқиға", person: "Тарихи тұлға",
    overview: "Сипаттама", significance: "Тарихи маңызы", facts: "Негізгі мәліметтер", date: "Күні",
    location: "Орын", category: "Санат", coordinates: "Координаттар", sources: "Дереккөздер",
    sourcesLead: "Жарияланымды дайындау кезінде пайдаланылған материалдар.", related: "Байланысты материалдар",
    relatedLead: "Осы материалмен байланысты оқиғалар мен тұлғалар.", mapAction: "Картадан көрсету",
    back: "Каталогқа оралу", openSource: "Дереккөзді ашу", noSources: "Дереккөздер әзірге тіркелмеген",
    addFavorite: "Таңдаулыға қосу", removeFavorite: "Таңдаулыдан алып тастау", loginFavorite: "Кіру және сақтау",
  },
};

const categoryLabels: Record<string, { ru: string; kk: string }> = {
  politics: { ru: "Политика", kk: "Саясат" },
  war: { ru: "Войны и конфликты", kk: "Соғыстар мен қақтығыстар" },
  society: { ru: "Общество", kk: "Қоғам" },
  economy: { ru: "Экономика", kk: "Экономика" },
  culture: { ru: "Культура", kk: "Мәдениет" },
  science: { ru: "Наука и технологии", kk: "Ғылым және технология" },
};

const relationLabels: Record<string, { ru: string; kk: string }> = {
  participation: { ru: "Участие", kk: "Қатысу" },
  shared_process: { ru: "Общий процесс", kk: "Ортақ үдеріс" },
  causal: { ru: "Причинная связь", kk: "Себептік байланыс" },
  interaction: { ru: "Взаимодействие", kk: "Өзара әрекет" },
  other: { ru: "Связанный материал", kk: "Байланысты материал" },
};

function mapYear(record: HistoryRecord) {
  return Math.min(2000, Math.max(1900, record.startYear));
}

export function RecordDetail({ record, related, isAuthenticated, isBookmarked }: { record: HistoryRecord; related: RelatedRecord[]; isAuthenticated: boolean; isBookmarked: boolean }) {
  const [language, setLanguage] = useState<Language>("ru");
  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("tarihline-language");
    if (stored === "ru" || stored === "kk") queueMicrotask(() => setLanguage(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tarihline-language", language);
  }, [language]);

  const paragraphs = record.description[language].split(/\n+/).filter(Boolean);
  const coordinates = record.coordinates?.map((value) => value.toFixed(4)).join(", ");

  return <main className="record-page">
    <header className="record-header">
      <Link className="record-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <nav aria-label="Навигация"><Link href="/">{t.map}</Link><Link className="is-active" href="/catalog">{t.catalog}</Link><Link href="/profile">{t.profile}</Link></nav>
      <div className="record-language" aria-label="Тіл / Язык"><button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => setLanguage("kk")}>ҚАЗ</button><button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => setLanguage("ru")}>РУС</button></div>
    </header>

    <article>
      <section className="record-hero">
        <div className="record-hero__content">
          <Link className="record-back" href="/catalog"><span aria-hidden="true">←</span>{t.back}</Link>
          <div className="record-eyebrow"><span>{record.type === "event" ? t.event : t.person}</span><i>{categoryLabels[record.category]?.[language] ?? record.category}</i></div>
          <h1>{record.title[language]}</h1>
          <p>{record.summary[language]}</p>
          <div className="record-hero__actions">
            <Link className="record-map-action" href={`/?year=${mapYear(record)}&record=${record.id}`}>{t.mapAction}<span aria-hidden="true">↗</span></Link>
            {isAuthenticated ? <form action={toggleBookmark}><input name="recordId" type="hidden" value={record.id} /><input name="slug" type="hidden" value={record.slug} /><button className={isBookmarked ? "is-active" : ""} type="submit"><span aria-hidden="true">{isBookmarked ? "★" : "☆"}</span>{isBookmarked ? t.removeFavorite : t.addFavorite}</button></form> : <Link className="record-favorite-login" href={`/auth?next=${encodeURIComponent(`/catalog/${record.slug}`)}`}><span aria-hidden="true">☆</span>{t.loginFavorite}</Link>}
          </div>
        </div>
        <div className={`record-year record-year--${record.type}`}><small>{record.type === "event" ? t.event : t.person}</small><strong>{record.startYear}</strong>{record.endYear && record.endYear !== record.startYear ? <span>— {record.endYear}</span> : null}</div>
      </section>

      <div className="record-layout">
        <div className="record-story">
          <section className="record-section"><span>01</span><div><h2>{t.overview}</h2>{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)}</div></section>
          {record.significance?.[language] ? <section className="record-section record-section--accent"><span>02</span><div><h2>{t.significance}</h2><p>{record.significance[language]}</p></div></section> : null}
        </div>

        <aside className="record-facts">
          <h2>{t.facts}</h2>
          <dl>
            <div><dt>{t.date}</dt><dd>{record.dateLabel[language]}</dd></div>
            <div><dt>{t.location}</dt><dd>{record.location[language]}</dd></div>
            <div><dt>{t.category}</dt><dd>{categoryLabels[record.category]?.[language] ?? record.category}</dd></div>
            {coordinates ? <div><dt>{t.coordinates}</dt><dd>{coordinates}</dd></div> : null}
          </dl>
        </aside>
      </div>

      <section className="record-sources">
        <div className="record-section-heading"><span>03</span><div><h2>{t.sources}</h2><p>{t.sourcesLead}</p></div></div>
        {record.sources.length ? <ol>{record.sources.map((source, index) => <li key={`${source.url}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{source.title}</strong><small>{source.publisher}</small></div><a href={source.url} target="_blank" rel="noreferrer">{t.openSource}<span aria-hidden="true">↗</span></a></li>)}</ol> : <p className="record-no-sources">{t.noSources}</p>}
      </section>

      {related.length ? <section className="record-related">
        <div className="record-section-heading"><span>04</span><div><h2>{t.related}</h2><p>{t.relatedLead}</p></div></div>
        <div className="record-related__grid">{related.map(({ record: item, relation }) => <Link href={`/catalog/${item.slug}`} key={relation.id}><small>{relationLabels[relation.type]?.[language] ?? relation.type}</small><strong>{item.title[language]}</strong><p>{relation.explanation[language]}</p><span>{item.dateLabel[language]} · {categoryLabels[item.category]?.[language] ?? item.category}</span></Link>)}</div>
      </section> : null}
    </article>
  </main>;
}
