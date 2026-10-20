"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalMapLayer, HistoryRecord, HistoryRelation, Language } from "@/lib/history-types";
import { collapseMapAttribution, renderHistoricalLayers, tarihLineMapStyle } from "@/lib/map-style";
import { ComparisonView } from "./comparison-view";
import "./history-explorer.css";

setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

const MIN_YEAR = 1900;
const MAX_YEAR = 2000;
const START_YEAR = 1950;

const copy = {
  ru: {
    map: "Карта",
    catalog: "Каталог",
    about: "О проекте",
    compare: "Сравнить",
    layers: "Слои карты",
    events: "События",
    people: "Личности",
    records: "Объекты года",
    allEvents: "Показать все",
    noRecords: "События и личности за этот год ещё не опубликованы",
    hiddenRecords: "Объекты скрыты настройками слоёв",
    close: "Закрыть",
    previous: "Предыдущий год",
    next: "Следующий год",
    selectedYear: "Выбранный год",
    overview: "Обзорная шкала",
    available: "Период исторической карты",
    significance: "Историческое значение",
    sources: "Источники",
    location: "Место",
    biographyLocation: "Место связано с биографией; нахождение в выбранном году не установлено.",
    personPeriod: "Привязка относится к выбранному периоду.",
    mapUnavailable: "Карта недоступна. Временная шкала продолжает работать.",
    aboutTitle: "История в общем контексте",
    aboutText: "TarihLine показывает изменение политических границ мира с 1900 по 2000 год. События и личности публикуются отдельно после редакторской проверки.",
    aboutNote: "Совпадение по времени не означает причинную связь. Подтверждённые отношения между событиями будут показаны отдельно.",
    data: "Данные",
    navigation: "Навигация",
    zoomHint: "Перетаскивайте карту и используйте колёсико или кнопки масштаба.",
    ownMap: "Базовая карта",
    historicalBorders: "Исторические границы",
    bordersPending: "Проверенные границы для этого года ещё не опубликованы",
    reconstruction: "Реконструкция",
  },
  kk: {
    map: "Карта",
    catalog: "Каталог",
    about: "Жоба туралы",
    compare: "Салыстыру",
    layers: "Карта қабаттары",
    events: "Оқиғалар",
    people: "Тұлғалар",
    records: "Жыл нысандары",
    allEvents: "Барлығын көрсету",
    noRecords: "Бұл жылға арналған оқиғалар мен тұлғалар әлі жарияланбаған",
    hiddenRecords: "Нысандар қабат баптауларымен жасырылған",
    close: "Жабу",
    previous: "Алдыңғы жыл",
    next: "Келесі жыл",
    selectedYear: "Таңдалған жыл",
    overview: "Жалпы уақыт шкаласы",
    available: "Тарихи картаның кезеңі",
    significance: "Тарихи маңызы",
    sources: "Дереккөздер",
    location: "Орын",
    biographyLocation: "Орын өмірбаянмен байланысты; таңдалған жылы осы жерде болғаны анықталмаған.",
    personPeriod: "Байланыс таңдалған кезеңге қатысты.",
    mapUnavailable: "Карта қолжетімсіз. Уақыт шкаласы жұмысын жалғастырады.",
    aboutTitle: "Тарихты ортақ контексте көру",
    aboutText: "TarihLine 1900 жылдан 2000 жылға дейінгі әлемнің саяси шекараларының өзгеруін көрсетеді. Оқиғалар мен тұлғалар редакциялық тексеруден кейін бөлек жарияланады.",
    aboutNote: "Уақыттың сәйкес келуі себеп-салдарлық байланысты білдірмейді. Расталған қатынастар бөлек көрсетіледі.",
    data: "Деректер",
    navigation: "Навигация",
    zoomHint: "Картаны жылжытып, масштаб үшін дөңгелекті немесе батырмаларды пайдаланыңыз.",
    ownMap: "Негізгі карта",
    historicalBorders: "Тарихи шекаралар",
    bordersPending: "Бұл жылға арналған тексерілген шекаралар әлі жарияланбаған",
    reconstruction: "Реконструкция",
  },
};

function Icon({ name }: { name: "layers" | "event" | "person" | "fit" | "close" | "info" | "place" | "source" | "chevron" | "compare" }) {
  const paths = {
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>,
    event: <><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></>,
    person: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    fit: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><path d="m3 8 5-5m8 0 5 5M3 16l5 5m8 0 5-5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    place: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    source: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    compare: <><path d="M7 4h10M7 4l3-3M7 4l3 3M17 20H7M17 20l-3-3M17 20l-3 3"/><path d="M5 8v8M19 8v8"/></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function isVisibleInYear(record: HistoryRecord, year: number) {
  const end = record.endYear ?? MAX_YEAR;
  return record.startYear <= year && end >= year;
}

function initials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

type Props = {
  records: HistoryRecord[];
  relations: HistoryRelation[];
  mapLayers: HistoricalMapLayer[];
  initialYear?: number;
  initialRecordId?: string;
};

export function HistoryExplorer({ records, relations, mapLayers, initialYear, initialRecordId }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [language, setLanguage] = useState<Language>("ru");
  const startingYear = initialYear ?? START_YEAR;
  const [year, setYear] = useState(startingYear);
  const [showEvents, setShowEvents] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const initialSelected = records.find((record) => record.id === initialRecordId && isVisibleInYear(record, startingYear))
    ?? records.find((record) => record.type === "event" && isVisibleInYear(record, startingYear));
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected?.id ?? null);
  const t = copy[language];
  const hasRecords = records.length > 0;

  const yearRecords = useMemo(
    () => records.filter((record) => isVisibleInYear(record, year)),
    [records, year],
  );
  const visibleRecords = useMemo(
    () => yearRecords.filter((record) => record.type === "event" ? showEvents : showPeople),
    [yearRecords, showEvents, showPeople],
  );
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const activeMapLayers = useMemo(
    () => mapLayers.filter((layer) => layer.validFrom <= year && layer.validTo >= year),
    [mapLayers, year],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("tarihline-language");
    if (stored === "ru" || stored === "kk") {
      queueMicrotask(() => setLanguage(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tarihline-language", language);
  }, [language]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: MapLibreMap;

    try {
      map = new MapLibreMap({
        container: mapContainerRef.current,
        style: tarihLineMapStyle,
        center: [61, 39],
        zoom: 2.1,
        minZoom: 1,
        maxZoom: 7,
        attributionControl: { compact: true },
      });
    } catch {
      queueMicrotask(() => setMapError(true));
      return;
    }

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    const fallbackTimer = window.setTimeout(() => {
      if (!map.isStyleLoaded()) setMapError(true);
    }, 12000);
    map.on("load", () => {
      window.clearTimeout(fallbackTimer);
      setMapError(false);
      collapseMapAttribution(map);
    });
    mapRef.current = map;
    queueMicrotask(() => setMapReady(true));

    return () => {
      window.clearTimeout(fallbackTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const render = () => renderHistoricalLayers(map, activeMapLayers, language, year);
    if (map.isStyleLoaded()) render();
    else map.once("load", render);

    return () => {
      map.off("load", render);
    };
  }, [activeMapLayers, language, mapReady, year]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showAbout) setShowAbout(false);
        else setSelectedId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAbout]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const occurrences = new Map<string, number>();

    visibleRecords.forEach((record) => {
      if (!record.coordinates) return;
      const key = record.coordinates.join(":");
      const occurrence = occurrences.get(key) ?? 0;
      occurrences.set(key, occurrence + 1);
      const element = document.createElement("button");
      element.type = "button";
      element.className = `history-marker history-marker--${record.type}${selectedId === record.id ? " is-selected" : ""}`;
      element.setAttribute("aria-label", record.title[language]);
      element.title = record.title[language];
      element.textContent = record.type === "person" ? initials(record.title[language]) : `${record.startYear}`;
      element.addEventListener("click", () => setSelectedId(record.id));

      const marker = new Marker({
        element,
        anchor: "center",
        offset: occurrence ? [occurrence * 28, occurrence * -24] : [0, 0],
      })
        .setLngLat(record.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [language, mapReady, selectedId, visibleRecords]);

  useEffect(() => {
    if (!selected?.coordinates || !mapRef.current) return;
    mapRef.current.flyTo({ center: selected.coordinates, zoom: Math.max(mapRef.current.getZoom(), 4.2), duration: 850 });
  }, [selected]);

  function fitVisibleRecords() {
    const map = mapRef.current;
    const points = visibleRecords.flatMap((record) => record.coordinates ? [record.coordinates] : []);
    if (!map || !points.length) return;

    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 5, duration: 700 });
      return;
    }

    const bounds = points.reduce(
      (value, point) => value.extend(point),
      new LngLatBounds(points[0], points[0]),
    );
    map.fitBounds(bounds, { padding: 90, maxZoom: 5.5, duration: 800 });
  }

  function changeYear(value: number) {
    const nextYear = Math.min(MAX_YEAR, Math.max(MIN_YEAR, value));
    setYear(nextYear);
    if (selected && !isVisibleInYear(selected, nextYear)) setSelectedId(null);
  }

  if (showComparison) {
    return (
      <ComparisonView
        records={records}
        relations={relations}
        mapLayers={mapLayers}
        language={language}
        initialLeftId={selected?.type === "event" ? selected.id : null}
        onLanguageChange={setLanguage}
        onClose={() => setShowComparison(false)}
      />
    );
  }

  return (
    <main className="history-app">
      <header className="app-header">
        <div className="app-brand" aria-label="TarihLine">
          <span className="app-brand__mark">T</span>
          <div>
            <strong>TarihLine</strong>
            <span>Қазақстан · 1900–2000</span>
          </div>
        </div>
        <nav aria-label={t.navigation}>
          <Link className="nav-button is-active" href="/">
            <span className="nav-button__dot" />
            {t.map}
          </Link>
          <Link className="nav-button" href="/catalog">
            {t.catalog}
          </Link>
          <button className="nav-button" type="button" onClick={() => setShowAbout(true)}>
            <Icon name="info" />
            {t.about}
          </button>
          {hasRecords && (
            <button className="nav-button" type="button" onClick={() => setShowComparison(true)}>
              <Icon name="compare" />
              {t.compare}
            </button>
          )}
        </nav>
        <div className="header-actions">
          <Link className="mobile-catalog-link" href="/catalog">{t.catalog}</Link>
          <div className="language-switch" aria-label="Тіл / Язык">
            <button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => setLanguage("kk")}>ҚАЗ</button>
            <button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => setLanguage("ru")}>РУС</button>
          </div>
        </div>
      </header>

      <section className={hasRecords ? "map-workspace" : "map-workspace map-workspace--map-only"}>
        {hasRecords && <aside className="records-panel">
          <div className="panel-section layers-section">
            <div className="panel-title">
              <Icon name="layers" />
              <span>{t.layers}</span>
            </div>
            <div className="layer-toggles">
              <button className={showEvents ? "layer-toggle is-active" : "layer-toggle"} type="button" aria-pressed={showEvents} onClick={() => {
                setShowEvents((value) => !value);
                if (showEvents && selected?.type === "event") setSelectedId(null);
              }}>
                <span className="layer-icon layer-icon--event"><Icon name="event" /></span>
                <span>{t.events}</span>
                <span className="toggle-state" />
              </button>
              <button className={showPeople ? "layer-toggle is-active" : "layer-toggle"} type="button" aria-pressed={showPeople} onClick={() => {
                setShowPeople((value) => !value);
                if (showPeople && selected?.type === "person") setSelectedId(null);
              }}>
                <span className="layer-icon layer-icon--person"><Icon name="person" /></span>
                <span>{t.people}</span>
                <span className="toggle-state" />
              </button>
            </div>
          </div>

          <div className="panel-section records-section">
            <div className="records-heading">
              <div>
                <span>{t.records}</span>
                <strong>{year}</strong>
              </div>
              <button type="button" onClick={fitVisibleRecords} disabled={!visibleRecords.length}>
                <Icon name="fit" />
                {t.allEvents}
              </button>
            </div>
            <div className="record-list">
              {visibleRecords.map((record) => (
                <button
                  className={selectedId === record.id ? "record-row is-selected" : "record-row"}
                  type="button"
                  key={record.id}
                  onClick={() => setSelectedId(record.id)}
                >
                  <span className={`record-symbol record-symbol--${record.type}`}>
                    {record.type === "person" ? initials(record.title[language]) : record.startYear}
                  </span>
                  <span className="record-row__copy">
                    <strong>{record.title[language]}</strong>
                    <span>{record.location[language]}</span>
                  </span>
                  <Icon name="chevron" />
                </button>
              ))}
              {!visibleRecords.length && (
                <div className="empty-state">
                  <Icon name="info" />
                  <p>{yearRecords.length ? t.hiddenRecords : t.noRecords}</p>
                </div>
              )}
            </div>
          </div>

        </aside>}

        <div className="map-stage">
          <div className="map-canvas" ref={mapContainerRef} />
          {!mapReady && !mapError && <div className="map-loading"><span />TarihLine</div>}
          {mapError && <div className="map-error"><Icon name="info"/><p>{t.mapUnavailable}</p></div>}
          <div className="map-year-stamp"><span>{t.selectedYear}</span><strong>{year}</strong></div>
          <div className={activeMapLayers.length ? "map-layer-status is-active" : "map-layer-status"}>
            <strong>{activeMapLayers.length ? t.historicalBorders : t.ownMap}</strong>
            <span>
              {activeMapLayers.length
                ? activeMapLayers.map((layer) => `${layer.title[language]}${layer.reconstruction ? ` · ${t.reconstruction}` : ""}`).join(" · ")
                : t.bordersPending}
            </span>
          </div>
          <div className="map-hint">{t.zoomHint}</div>

          {selected && (
            <article className="detail-card" aria-live="polite">
              <button className="detail-close" type="button" aria-label={t.close} onClick={() => setSelectedId(null)}><Icon name="close" /></button>
              <div className="detail-card__type">
                <span className={`detail-type-icon detail-type-icon--${selected.type}`}><Icon name={selected.type === "event" ? "event" : "person"} /></span>
                <span>{selected.type === "event" ? t.events : t.people}</span>
                <strong>{selected.dateLabel[language]}</strong>
              </div>
              <h1>{selected.title[language]}</h1>
              <p className="detail-summary">{selected.summary[language]}</p>
              <div className="detail-meta">
                <Icon name="place" />
                <div><span>{t.location}</span><strong>{selected.location[language]}</strong></div>
              </div>
              {selected.type === "person" && (
                <p className="location-note">{selected.locationKind === "biographical" ? t.biographyLocation : t.personPeriod}</p>
              )}
              <div className="detail-body">
                <p>{selected.description[language]}</p>
                {selected.significance && (
                  <section>
                    <h2>{t.significance}</h2>
                    <p>{selected.significance[language]}</p>
                  </section>
                )}
                {selected.sources.length > 0 && (
                  <section>
                    <h2>{t.sources}</h2>
                    <div className="source-list">
                      {selected.sources.map((source) => (
                        <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                          <Icon name="source" />
                          <span><strong>{source.title}</strong><small>{source.publisher}</small></span>
                          <Icon name="chevron" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </article>
          )}
        </div>
      </section>

      <section className="timeline-panel" aria-label={t.selectedYear}>
        <div className="timeline-year-control">
          <button type="button" aria-label={t.previous} disabled={year === MIN_YEAR} onClick={() => changeYear(year - 1)}>−</button>
          <div><span>{t.selectedYear}</span><strong>{year}</strong></div>
          <button type="button" aria-label={t.next} disabled={year === MAX_YEAR} onClick={() => changeYear(year + 1)}>+</button>
        </div>
        <div className="timeline-main">
          <div className="working-scale">
            <div className="working-scale__labels"><span>{MIN_YEAR}</span><strong>{t.available}</strong><span>{MAX_YEAR}</span></div>
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              step="1"
              value={year}
              aria-label={t.selectedYear}
              onChange={(event) => changeYear(Number(event.target.value))}
              style={{ "--timeline-progress": `${((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%` } as React.CSSProperties}
            />
            <div className="year-ticks">
              {Array.from({ length: 11 }, (_, index) => MIN_YEAR + index * 10).map((tick) => (
                <button className={tick === year ? "is-active" : ""} type="button" key={tick} onClick={() => changeYear(tick)}><span />{tick}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showAbout && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowAbout(false)}>
          <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="detail-close" type="button" aria-label={t.close} onClick={() => setShowAbout(false)}><Icon name="close" /></button>
            <span className="about-kicker">TarihLine</span>
            <h2 id="about-title">{t.aboutTitle}</h2>
            <p>{t.aboutText}</p>
            <div className="about-rule"><Icon name="info"/><p>{t.aboutNote}</p></div>
            <div className="about-meta"><span><strong>1900–2000</strong>{t.data}</span><span><strong>RU · ҚАЗ</strong>Тіл / Язык</span><span><strong>MapLibre</strong>Esri World Ocean</span></div>
          </section>
        </div>
      )}
    </main>
  );
}
