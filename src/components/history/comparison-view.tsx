"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import type { HistoricalMapLayer, HistoryRecord, HistoryRelation, Language } from "@/lib/history-types";
import { renderHistoricalLayers, tarihLineMapStyle } from "@/lib/map-style";

const comparisonCopy = {
  ru: {
    title: "Сравнение событий",
    subtitle: "Два события в едином историческом контексте",
    back: "Вернуться к карте",
    first: "Первое событие",
    second: "Второе событие",
    choose: "Выберите событие",
    swap: "Поменять местами",
    difference: "Разница между событиями",
    sameYear: "События произошли в одном году",
    oneYear: "1 год",
    years: "лет",
    relation: "Подтверждённая связь",
    noRelation: "Подтверждённая связь между выбранными событиями пока не установлена.",
    place: "Место",
    significance: "Историческое значение",
    source: "Источник",
    prototype: "Тестовый набор",
    duplicate: "Для сравнения выберите два разных события",
    mapUnavailable: "Карта недоступна",
  },
  kk: {
    title: "Оқиғаларды салыстыру",
    subtitle: "Екі оқиға бір тарихи контексте",
    back: "Картаға оралу",
    first: "Бірінші оқиға",
    second: "Екінші оқиға",
    choose: "Оқиғаны таңдаңыз",
    swap: "Орындарын ауыстыру",
    difference: "Оқиғалар арасындағы айырма",
    sameYear: "Оқиғалар бір жылы болды",
    oneYear: "1 жыл",
    years: "жыл",
    relation: "Расталған байланыс",
    noRelation: "Таңдалған оқиғалар арасындағы расталған байланыс әзірге анықталмаған.",
    place: "Орын",
    significance: "Тарихи маңызы",
    source: "Дереккөз",
    prototype: "Сынақ жинағы",
    duplicate: "Салыстыру үшін екі түрлі оқиғаны таңдаңыз",
    mapUnavailable: "Карта қолжетімсіз",
  },
};

type ComparisonMapProps = {
  record: HistoryRecord;
  language: Language;
  mapLayers: HistoricalMapLayer[];
};

function ComparisonMap({ record, language, mapLayers }: ComparisonMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !record.coordinates) return;

    let map: MapLibreMap;

    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: tarihLineMapStyle,
        center: record.coordinates,
        zoom: 3.5,
        minZoom: 1,
        maxZoom: 7,
      });
    } catch {
      queueMicrotask(() => setError(true));
      return;
    }
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

    const element = document.createElement("div");
    element.className = "comparison-marker";
    element.textContent = `${record.startYear}`;
    element.setAttribute("aria-label", record.title[language]);
    const marker = new Marker({ element }).setLngLat(record.coordinates).addTo(map);
    const fallbackTimer = window.setTimeout(() => {
      if (!map.isStyleLoaded()) setError(true);
    }, 12000);

    map.on("load", () => {
      window.clearTimeout(fallbackTimer);
      setError(false);
      renderHistoricalLayers(
        map,
        mapLayers.filter((layer) => layer.validFrom <= record.startYear && layer.validTo >= record.startYear),
        language,
      );
    });

    return () => {
      window.clearTimeout(fallbackTimer);
      marker.remove();
      map.remove();
    };
  }, [language, mapLayers, record]);

  return (
    <div className="comparison-map">
      <div ref={containerRef} className="comparison-map__canvas" />
      {error && <span className="comparison-map__error">{comparisonCopy[language].mapUnavailable}</span>}
      <strong className="comparison-map__year">{record.startYear}</strong>
    </div>
  );
}

type EventPanelProps = {
  label: string;
  record: HistoryRecord;
  events: HistoryRecord[];
  mapLayers: HistoricalMapLayer[];
  otherId: string;
  language: Language;
  onChange: (id: string) => void;
};

function EventPanel({ label, record, events, mapLayers, otherId, language, onChange }: EventPanelProps) {
  const t = comparisonCopy[language];

  return (
    <article className="comparison-panel">
      <div className="comparison-panel__selector">
        <label htmlFor={`comparison-${label}`}>{label}</label>
        <select id={`comparison-${label}`} value={record.id} onChange={(event) => onChange(event.target.value)}>
          {events.map((event) => (
            <option value={event.id} disabled={event.id === otherId} key={event.id}>
              {event.startYear} · {event.title[language]}
            </option>
          ))}
        </select>
      </div>
      {record.coordinates && <ComparisonMap record={record} language={language} mapLayers={mapLayers} />}
      <div className="comparison-panel__content">
        <div className="comparison-date">{record.dateLabel[language]}</div>
        <h2>{record.title[language]}</h2>
        <p>{record.summary[language]}</p>
        <dl>
          <div>
            <dt>{t.place}</dt>
            <dd>{record.location[language]}</dd>
          </div>
          {record.significance && (
            <div>
              <dt>{t.significance}</dt>
              <dd>{record.significance[language]}</dd>
            </div>
          )}
        </dl>
        {record.sources[0] && (
          <a className="comparison-source" href={record.sources[0].url} target="_blank" rel="noreferrer">
            <span>{t.source}</span>
            <strong>{record.sources[0].publisher}</strong>
          </a>
        )}
      </div>
    </article>
  );
}

type Props = {
  records: HistoryRecord[];
  relations: HistoryRelation[];
  mapLayers: HistoricalMapLayer[];
  language: Language;
  prototype: boolean;
  initialLeftId: string | null;
  onLanguageChange: (language: Language) => void;
  onClose: () => void;
};

export function ComparisonView({ records, relations, mapLayers, language, prototype, initialLeftId, onLanguageChange, onClose }: Props) {
  const events = useMemo(
    () => records.filter((record) => record.type === "event").sort((a, b) => a.startYear - b.startYear),
    [records],
  );
  const defaultLeft = events.find((event) => event.id === initialLeftId) ?? events[0];
  const defaultRight = events.find((event) => event.id !== defaultLeft?.id && event.startYear >= 1961)
    ?? events.find((event) => event.id !== defaultLeft?.id);
  const [leftId, setLeftId] = useState(defaultLeft?.id ?? "");
  const [rightId, setRightId] = useState(defaultRight?.id ?? "");
  const left = events.find((event) => event.id === leftId) ?? defaultLeft;
  const right = events.find((event) => event.id === rightId) ?? defaultRight;
  const t = comparisonCopy[language];

  if (!left || !right) return null;

  const yearDifference = Math.abs(right.startYear - left.startYear);
  const relation = relations.find((item) => (
    item.fromRecordId === left.id && item.toRecordId === right.id
  ) || (
    item.fromRecordId === right.id && item.toRecordId === left.id
  ));

  function changeLeft(id: string) {
    if (id !== rightId) setLeftId(id);
  }

  function changeRight(id: string) {
    if (id !== leftId) setRightId(id);
  }

  function swap() {
    setLeftId(rightId);
    setRightId(leftId);
  }

  return (
    <main className="comparison-app">
      <header className="comparison-header">
        <button className="comparison-back" type="button" onClick={onClose}>
          <span aria-hidden="true">←</span>
          {t.back}
        </button>
        <div className="comparison-heading">
          <span>TarihLine</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="comparison-actions">
          {prototype && <span className="prototype-badge">{t.prototype}</span>}
          <div className="language-switch" aria-label="Тіл / Язык">
            <button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => onLanguageChange("kk")}>ҚАЗ</button>
            <button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => onLanguageChange("ru")}>РУС</button>
          </div>
        </div>
      </header>

      <section className="comparison-toolbar">
        <div>
          <span>{t.difference}</span>
          <strong>{yearDifference === 0 ? t.sameYear : yearDifference === 1 ? t.oneYear : `${yearDifference} ${t.years}`}</strong>
        </div>
        <button type="button" onClick={swap}><span aria-hidden="true">⇄</span>{t.swap}</button>
      </section>

      <section className="comparison-grid">
        <EventPanel label={t.first} record={left} events={events} mapLayers={mapLayers} otherId={right.id} language={language} onChange={changeLeft} />
        <EventPanel label={t.second} record={right} events={events} mapLayers={mapLayers} otherId={left.id} language={language} onChange={changeRight} />
      </section>

      <section className={relation ? "comparison-relation is-confirmed" : "comparison-relation"}>
        <span className="comparison-relation__mark">{relation ? "✓" : "i"}</span>
        <div>
          <span>{t.relation}</span>
          <p>{relation ? relation.explanation[language] : t.noRelation}</p>
        </div>
      </section>
    </main>
  );
}
