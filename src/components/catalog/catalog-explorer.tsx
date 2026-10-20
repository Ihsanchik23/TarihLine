"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HistoryRecord, Language } from "@/lib/history-types";
import "./catalog-explorer.css";

const copy = {
  ru: {
    map: "Карта", catalog: "Каталог", kicker: "Исторические материалы", title: "События и личности",
    lead: "Проверенные материалы TarihLine в хронологическом порядке. Найдите тему, период или исторического деятеля.",
    search: "Поиск по названию, описанию, месту или источнику", all: "Все материалы", events: "События", people: "Личности",
    category: "Категория", period: "Период", sort: "Сортировка", allCategories: "Все категории", allYears: "1900–2000",
    oldest: "Сначала ранние", newest: "Сначала поздние", alphabet: "По алфавиту", results: "материалов", oneResult: "материал",
    mapAction: "Показать на карте", sources: "источников", noResults: "Ничего не найдено", noResultsText: "Измените запрос или сбросьте один из фильтров.",
    noPublished: "Опубликованных материалов пока нет", noPublishedText: "После редакторской проверки события и личности появятся здесь автоматически.", reset: "Сбросить фильтры",
  },
  kk: {
    map: "Карта", catalog: "Каталог", kicker: "Тарихи материалдар", title: "Оқиғалар мен тұлғалар",
    lead: "TarihLine тексерілген материалдары хронологиялық ретпен. Тақырыпты, кезеңді немесе тарихи тұлғаны табыңыз.",
    search: "Атауы, сипаттамасы, орны немесе дереккөзі бойынша іздеу", all: "Барлық материалдар", events: "Оқиғалар", people: "Тұлғалар",
    category: "Санат", period: "Кезең", sort: "Сұрыптау", allCategories: "Барлық санаттар", allYears: "1900–2000",
    oldest: "Алдымен ерте", newest: "Алдымен кейінгі", alphabet: "Әліпби бойынша", results: "материал", oneResult: "материал",
    mapAction: "Картадан көрсету", sources: "дереккөз", noResults: "Ештеңе табылмады", noResultsText: "Сұрауды өзгертіңіз немесе сүзгілердің бірін алып тастаңыз.",
    noPublished: "Жарияланған материалдар әзірге жоқ", noPublishedText: "Редакциялық тексеруден кейін оқиғалар мен тұлғалар мұнда автоматты түрде пайда болады.", reset: "Сүзгілерді тазарту",
  },
};

const categoryLabels: Record<string, { ru: string; kk: string }> = {
  politics: { ru: "Политика", kk: "Саясат" }, war: { ru: "Войны и конфликты", kk: "Соғыстар мен қақтығыстар" },
  society: { ru: "Общество", kk: "Қоғам" }, economy: { ru: "Экономика", kk: "Экономика" },
  culture: { ru: "Культура", kk: "Мәдениет" }, science: { ru: "Наука и технологии", kk: "Ғылым және технология" },
};

const periods = [
  { value: "all", from: 1900, to: 2000 }, { value: "1900-1924", from: 1900, to: 1924 },
  { value: "1925-1949", from: 1925, to: 1949 }, { value: "1950-1974", from: 1950, to: 1974 },
  { value: "1975-2000", from: 1975, to: 2000 },
];

function initials(value: string) {
  return value.split(" ").slice(0, 2).map((part) => part[0]).join("");
}

function mapYear(record: HistoryRecord) {
  return Math.min(2000, Math.max(1900, record.startYear));
}

export function CatalogExplorer({ records }: { records: HistoryRecord[] }) {
  const [language, setLanguage] = useState<Language>("ru");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("oldest");
  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("tarihline-language");
    if (stored === "ru" || stored === "kk") queueMicrotask(() => setLanguage(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tarihline-language", language);
  }, [language]);

  const categories = useMemo(() => [...new Set(records.map((record) => record.category))].sort(), [records]);
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language === "kk" ? "kk-KZ" : "ru-RU");
    const selectedPeriod = periods.find((item) => item.value === period) ?? periods[0];
    const result = records.filter((record) => {
      const searchable = [record.title.ru, record.title.kk, record.summary.ru, record.summary.kk, record.description.ru, record.description.kk, record.location.ru, record.location.kk, ...record.sources.flatMap((source) => [source.title, source.publisher])].join(" ").toLocaleLowerCase(language === "kk" ? "kk-KZ" : "ru-RU");
      const endYear = record.endYear ?? 2000;
      return (!normalized || searchable.includes(normalized))
        && (type === "all" || record.type === type)
        && (category === "all" || record.category === category)
        && record.startYear <= selectedPeriod.to
        && endYear >= selectedPeriod.from;
    });
    return result.sort((a, b) => sort === "newest" ? b.startYear - a.startYear : sort === "alphabet" ? a.title[language].localeCompare(b.title[language], language) : a.startYear - b.startYear);
  }, [category, language, period, query, records, sort, type]);

  function resetFilters() {
    setQuery(""); setType("all"); setCategory("all"); setPeriod("all"); setSort("oldest");
  }

  return <main className="catalog-app">
    <header className="catalog-header">
      <Link className="catalog-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <nav aria-label={language === "ru" ? "Навигация" : "Навигация"}><Link href="/">{t.map}</Link><Link className="is-active" href="/catalog">{t.catalog}</Link></nav>
      <div className="language-switch" aria-label="Тіл / Язык"><button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => setLanguage("kk")}>ҚАЗ</button><button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => setLanguage("ru")}>РУС</button></div>
    </header>
    <section className="catalog-hero"><span>{t.kicker}</span><h1>{t.title}</h1><p>{t.lead}</p><div className="catalog-stat"><strong>{records.length}</strong><span>{records.length === 1 ? t.oneResult : t.results}</span></div></section>
    <section className="catalog-controls" aria-label={language === "ru" ? "Фильтры каталога" : "Каталог сүзгілері"}>
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
      <div className="catalog-type-tabs"><button className={type === "all" ? "is-active" : ""} type="button" onClick={() => setType("all")}>{t.all}</button><button className={type === "event" ? "is-active" : ""} type="button" onClick={() => setType("event")}>{t.events}</button><button className={type === "person" ? "is-active" : ""} type="button" onClick={() => setType("person")}>{t.people}</button></div>
      <div className="catalog-selects"><label><span>{t.category}</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{t.allCategories}</option>{categories.map((item) => <option value={item} key={item}>{categoryLabels[item]?.[language] ?? item}</option>)}</select></label><label><span>{t.period}</span><select value={period} onChange={(event) => setPeriod(event.target.value)}>{periods.map((item) => <option value={item.value} key={item.value}>{item.value === "all" ? t.allYears : item.value.replace("-", "–")}</option>)}</select></label><label><span>{t.sort}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="oldest">{t.oldest}</option><option value="newest">{t.newest}</option><option value="alphabet">{t.alphabet}</option></select></label></div>
    </section>
    <section className="catalog-results"><div className="catalog-results-heading"><span>{filteredRecords.length} {filteredRecords.length === 1 ? t.oneResult : t.results}</span>{(query || type !== "all" || category !== "all" || period !== "all") ? <button type="button" onClick={resetFilters}>{t.reset}</button> : null}</div>
      {filteredRecords.length ? <div className="catalog-grid">{filteredRecords.map((record) => <article className={`catalog-card catalog-card--${record.type}`} key={record.id}><div className="catalog-card__top"><span className="catalog-card__symbol">{record.type === "person" ? initials(record.title[language]) : record.startYear}</span><div><span>{record.type === "event" ? t.events : t.people}</span><strong>{record.dateLabel[language]}</strong></div><small>{categoryLabels[record.category]?.[language] ?? record.category}</small></div><h2>{record.title[language]}</h2><p>{record.summary[language]}</p><dl><div><dt>{language === "ru" ? "Место" : "Орын"}</dt><dd>{record.location[language]}</dd></div><div><dt>{language === "ru" ? "Основание" : "Негіз"}</dt><dd>{record.sources.length} {t.sources}</dd></div></dl><Link href={`/?year=${mapYear(record)}&record=${record.id}`}>{t.mapAction}<span aria-hidden="true">→</span></Link></article>)}</div> : <div className="catalog-empty"><span aria-hidden="true">T</span><h2>{records.length ? t.noResults : t.noPublished}</h2><p>{records.length ? t.noResultsText : t.noPublishedText}</p>{records.length ? <button type="button" onClick={resetFilters}>{t.reset}</button> : <Link href="/">{t.map}</Link>}</div>}
    </section>
  </main>;
}
