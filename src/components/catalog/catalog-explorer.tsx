"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HistoryRecord, Language } from "@/lib/history-types";
import { PublicSidebar } from "@/components/public-sidebar";
import "./catalog-explorer.css";

const copy = {
  ru: {
    map: "Карта", catalog: "Каталог", profile: "Профиль", kicker: "Исторические материалы", title: "События и личности",
    lead: "Проверенные материалы TarihLine в хронологическом порядке. Найдите тему, период или исторического деятеля.",
    search: "Поиск по названию, описанию, месту или источнику", all: "Все материалы", events: "События", people: "Личности",
    category: "Категория", period: "Период", sort: "Сортировка", allCategories: "Все категории", allYears: "1900–2000",
    oldest: "Сначала ранние", newest: "Сначала поздние", alphabet: "По алфавиту", results: "материалов", oneResult: "материал",
    readAction: "Читать материал", mapAction: "На карте", sources: "источников", noResults: "Ничего не найдено", noResultsText: "Измените запрос или сбросьте один из фильтров.",
    noPublished: "Опубликованных материалов пока нет", noPublishedText: "Добавленные события и личности появятся здесь автоматически.", reset: "Сбросить фильтры",
  },
  kk: {
    map: "Карта", catalog: "Каталог", profile: "Профиль", kicker: "Тарихи материалдар", title: "Оқиғалар мен тұлғалар",
    lead: "TarihLine тексерілген материалдары хронологиялық ретпен. Тақырыпты, кезеңді немесе тарихи тұлғаны табыңыз.",
    search: "Атауы, сипаттамасы, орны немесе дереккөзі бойынша іздеу", all: "Барлық материалдар", events: "Оқиғалар", people: "Тұлғалар",
    category: "Санат", period: "Кезең", sort: "Сұрыптау", allCategories: "Барлық санаттар", allYears: "1900–2000",
    oldest: "Алдымен ерте", newest: "Алдымен кейінгі", alphabet: "Әліпби бойынша", results: "материал", oneResult: "материал",
    readAction: "Материалды оқу", mapAction: "Картада", sources: "дереккөз", noResults: "Ештеңе табылмады", noResultsText: "Сұрауды өзгертіңіз немесе сүзгілердің бірін алып тастаңыз.",
    noPublished: "Жарияланған материалдар әзірге жоқ", noPublishedText: "Редакциялық тексеруден кейін оқиғалар мен тұлғалар мұнда автоматты түрде пайда болады.", reset: "Сүзгілерді тазарту",
  },
};

const categoryLabels: Record<string, { ru: string; kk: string }> = {
  history: { ru: "История", kk: "Тарих" },
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

type FilterOption = { value: string; label: string };

function BrandedSelect({ label, value, options, onChange }: { label: string; value: string; options: FilterOption[]; onChange: (value: string) => void }) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return <details className="catalog-filter">
    <summary>
      <span><small>{label}</small><strong>{selected.label}</strong></span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m7 9 5 5 5-5" /></svg>
    </summary>
    <div className="catalog-filter__menu" role="listbox" aria-label={label}>
      {options.map((option) => <button className={option.value === value ? "is-active" : ""} type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={(event) => {
        onChange(option.value);
        event.currentTarget.closest("details")?.removeAttribute("open");
      }}><span>{option.label}</span>{option.value === value ? <span aria-hidden="true">✓</span> : null}</button>)}
    </div>
  </details>;
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

  const categoryOptions = [{ value: "all", label: t.allCategories }, ...categories.map((item) => ({ value: item, label: categoryLabels[item]?.[language] ?? item }))];
  const periodOptions = periods.map((item) => ({ value: item.value, label: item.value === "all" ? t.allYears : item.value.replace("-", "–") }));
  const sortOptions = [{ value: "oldest", label: t.oldest }, { value: "newest", label: t.newest }, { value: "alphabet", label: t.alphabet }];

  return <main className="catalog-app has-public-sidebar">
    <PublicSidebar active="catalog" language={language} />
    <header className="catalog-header">
      <Link className="catalog-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <div className="language-switch" aria-label="Тіл / Язык"><button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => setLanguage("kk")}>ҚАЗ</button><button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => setLanguage("ru")}>РУС</button></div>
    </header>
    <section className="catalog-hero"><div><span>{t.kicker}</span><h1>{t.title}</h1><p>{t.lead}</p></div><div className="catalog-stat"><strong>{records.length}</strong><span>{records.length === 1 ? t.oneResult : t.results}</span></div></section>
    <section className="catalog-controls" aria-label={language === "ru" ? "Фильтры каталога" : "Каталог сүзгілері"}>
      <label className="catalog-search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
      <div className="catalog-type-tabs"><button className={type === "all" ? "is-active" : ""} type="button" onClick={() => setType("all")}>{t.all}</button><button className={type === "event" ? "is-active" : ""} type="button" onClick={() => setType("event")}>{t.events}</button><button className={type === "person" ? "is-active" : ""} type="button" onClick={() => setType("person")}>{t.people}</button></div>
      <div className="catalog-selects"><BrandedSelect label={t.category} value={category} options={categoryOptions} onChange={setCategory}/><BrandedSelect label={t.period} value={period} options={periodOptions} onChange={setPeriod}/><BrandedSelect label={t.sort} value={sort} options={sortOptions} onChange={setSort}/></div>
    </section>
    <section className="catalog-results"><div className="catalog-results-heading"><span>{filteredRecords.length} {filteredRecords.length === 1 ? t.oneResult : t.results}</span>{(query || type !== "all" || category !== "all" || period !== "all") ? <button type="button" onClick={resetFilters}>{t.reset}</button> : null}</div>
      {filteredRecords.length ? <div className="catalog-list">{filteredRecords.map((record, index) => <article className={`catalog-list-item catalog-list-item--${record.type}`} key={record.id}>
        <div className="catalog-list-item__date"><span>{String(index + 1).padStart(2, "0")}</span><strong>{record.type === "person" ? initials(record.title[language]) : record.startYear}</strong><small>{record.dateLabel[language]}</small></div>
        <div className="catalog-list-item__content"><div className="catalog-list-item__eyebrow"><span>{record.type === "event" ? t.events : t.people}</span><span>{categoryLabels[record.category]?.[language] ?? record.category}</span></div><h2><Link href={`/catalog/${record.slug}`}>{record.title[language]}</Link></h2><p>{record.summary[language]}</p><div className="catalog-list-item__meta"><span>{record.location[language]}</span><span>{record.sources.length} {t.sources}</span></div></div>
        <div className="catalog-list-item__actions"><Link href={`/catalog/${record.slug}`}>{t.readAction}<span aria-hidden="true">→</span></Link><Link href={`/?year=${mapYear(record)}&record=${record.id}`}>{t.mapAction}</Link></div>
      </article>)}</div> : <div className="catalog-empty"><span aria-hidden="true">T</span><h2>{records.length ? t.noResults : t.noPublished}</h2><p>{records.length ? t.noResultsText : t.noPublishedText}</p>{records.length ? <button type="button" onClick={resetFilters}>{t.reset}</button> : <Link href="/">{t.map}</Link>}</div>}
    </section>
  </main>;
}
