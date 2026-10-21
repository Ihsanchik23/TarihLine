"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  type MapGeoJSONFeature,
  type MapMouseEvent,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalMapLayer, HistoryRecord, HistoryRelation, Language } from "@/lib/history-types";
import { collapseMapAttribution, historicalFillLayerId, renderHistoricalLayers, tarihLineMapStyle } from "@/lib/map-style";
import { PublicSidebar } from "@/components/public-sidebar";
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
    profile: "Профиль",
    compare: "Сравнить",
    layers: "Слои карты",
    events: "События",
    people: "Личности",
    records: "Объекты года",
    allEvents: "Показать все",
    noRecords: "События и личности за этот год ещё не опубликованы",
    hiddenRecords: "Объекты скрыты настройками слоёв",
    close: "Закрыть",
    previous: "Предыдущее изменение границ",
    next: "Следующее изменение границ",
    selectedYear: "Выбранный год",
    mapStates: "состояний карты",
    overview: "Обзорная шкала",
    available: "Период исторической карты",
    significance: "Историческое значение",
    sources: "Источники",
    location: "Место",
    biographyLocation: "Место связано с биографией; нахождение в выбранном году не установлено.",
    personPeriod: "Привязка относится к выбранному периоду.",
    mapUnavailable: "Карта недоступна. Временная шкала продолжает работать.",
    navigation: "Навигация",
    zoomHint: "Перетаскивайте карту и используйте колёсико или кнопки масштаба.",
    territoryHint: "Наведите на территорию или нажмите, чтобы открыть сведения.",
    territory: "Политическое образование",
    territoryPeriod: "Период на карте",
    territorySource: "Источник геометрии",
    territoryArticle: "Справочная статья",
    territoryNaming: "Название локализовано по Wikidata и редакционным правкам TarihLine.",
    ownMap: "Базовая карта",
    historicalBorders: "Исторические границы",
    bordersPending: "Проверенные границы для этого года ещё не опубликованы",
    reconstruction: "Реконструкция",
  },
  kk: {
    map: "Карта",
    catalog: "Каталог",
    profile: "Профиль",
    compare: "Салыстыру",
    layers: "Карта қабаттары",
    events: "Оқиғалар",
    people: "Тұлғалар",
    records: "Жыл нысандары",
    allEvents: "Барлығын көрсету",
    noRecords: "Бұл жылға арналған оқиғалар мен тұлғалар әлі жарияланбаған",
    hiddenRecords: "Нысандар қабат баптауларымен жасырылған",
    close: "Жабу",
    previous: "Шекаралардың алдыңғы өзгерісі",
    next: "Шекаралардың келесі өзгерісі",
    selectedYear: "Таңдалған жыл",
    mapStates: "карта күйі",
    overview: "Жалпы уақыт шкаласы",
    available: "Тарихи картаның кезеңі",
    significance: "Тарихи маңызы",
    sources: "Дереккөздер",
    location: "Орын",
    biographyLocation: "Орын өмірбаянмен байланысты; таңдалған жылы осы жерде болғаны анықталмаған.",
    personPeriod: "Байланыс таңдалған кезеңге қатысты.",
    mapUnavailable: "Карта қолжетімсіз. Уақыт шкаласы жұмысын жалғастырады.",
    navigation: "Навигация",
    zoomHint: "Картаны жылжытып, масштаб үшін дөңгелекті немесе батырмаларды пайдаланыңыз.",
    territoryHint: "Мәліметтерді ашу үшін аумаққа меңзерді апарыңыз немесе басыңыз.",
    territory: "Саяси құрылым",
    territoryPeriod: "Картадағы кезең",
    territorySource: "Геометрия дереккөзі",
    territoryArticle: "Анықтамалық мақала",
    territoryNaming: "Атау Wikidata деректері және TarihLine редакциялық түзетулері бойынша берілген.",
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
  const end = record.endYear ?? (record.type === "event" ? record.startYear : MAX_YEAR);
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
  initialCompare?: boolean;
};

type Territory = {
  featureId: string | number;
  sourceId: string;
  name: string;
  validFrom: number;
  validTo: number;
  wikipedia: string | null;
  wikidata: string | null;
  layer: HistoricalMapLayer;
};

function territoryFromFeature(feature: MapGeoJSONFeature, layer: HistoricalMapLayer, language: Language): Territory | null {
  if (feature.id === undefined) return null;
  const localizedName = language === "kk" ? feature.properties.name_kk : feature.properties.name_ru;
  const name = typeof localizedName === "string" && localizedName ? localizedName : typeof feature.properties.name === "string" ? feature.properties.name : "";
  const validFrom = Number(feature.properties.valid_from);
  const validTo = Number(feature.properties.valid_to);
  if (!name || !Number.isFinite(validFrom) || !Number.isFinite(validTo)) return null;
  return {
    featureId: feature.id,
    sourceId: feature.source,
    name,
    validFrom,
    validTo,
    wikipedia: typeof feature.properties.wikipedia === "string" ? feature.properties.wikipedia : null,
    wikidata: typeof feature.properties.wikidata === "string" ? feature.properties.wikidata : null,
    layer,
  };
}

function wikipediaUrl(value: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(value.replaceAll(" ", "_"))}`;
}

export function HistoryExplorer({ records, relations, mapLayers, initialYear, initialRecordId, initialCompare = false }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const hoveredFeatureRef = useRef<{ source: string; id: string | number } | null>(null);
  const [language, setLanguage] = useState<Language>("ru");
  const startingYear = initialYear ?? START_YEAR;
  const [year, setYear] = useState(startingYear);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showComparison, setShowComparison] = useState(initialCompare);
  const [hoveredTerritory, setHoveredTerritory] = useState<Territory | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const initialSelected = records.find((record) => record.id === initialRecordId && isVisibleInYear(record, startingYear))
    ?? records.find((record) => record.type === "event" && isVisibleInYear(record, startingYear));
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected?.id ?? null);
  const [eventCardOpen, setEventCardOpen] = useState(Boolean(initialSelected));
  const t = copy[language];
  const yearRecords = useMemo(
    () => records.filter((record) => isVisibleInYear(record, year)),
    [records, year],
  );
  const visibleRecords = yearRecords;
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const activeMapLayers = useMemo(
    () => mapLayers.filter((layer) => layer.validFrom <= year && layer.validTo >= year),
    [mapLayers, year],
  );
  const mapChangeYears = useMemo(
    () => [...new Set([
      MIN_YEAR,
      ...mapLayers.flatMap((layer) => layer.changeYears),
      MAX_YEAR,
    ].filter((value) => value >= MIN_YEAR && value <= MAX_YEAR))].sort((first, second) => first - second),
    [mapLayers],
  );
  const previousChangeYear = [...mapChangeYears].reverse().find((value) => value < year) ?? null;
  const nextChangeYear = mapChangeYears.find((value) => value > year) ?? null;

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
      setMapReady(true);
      collapseMapAttribution(map);
    });
    mapRef.current = map;

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
    const map = mapRef.current;
    if (!map || !mapReady || !activeMapLayers.length) return;
    const layersById = new Map(activeMapLayers.map((layer) => [historicalFillLayerId(layer.id), layer]));
    const layerIds = [...layersById.keys()].filter((id) => map.getLayer(id));
    if (!layerIds.length) return;

    function clearHovered() {
      const previous = hoveredFeatureRef.current;
      if (previous) map?.setFeatureState({ source: previous.source, id: previous.id }, { hover: false });
      hoveredFeatureRef.current = null;
      setHoveredTerritory(null);
      if (map) map.getCanvas().style.cursor = "";
    }

    function findTerritory(event: MapMouseEvent) {
      const feature = map?.queryRenderedFeatures(event.point, { layers: layerIds })[0];
      if (!feature) return null;
      const layer = layersById.get(feature.layer.id);
      return layer ? territoryFromFeature(feature, layer, language) : null;
    }

    function onMouseMove(event: MapMouseEvent) {
      const territory = findTerritory(event);
      if (!territory) {
        clearHovered();
        return;
      }
      const previous = hoveredFeatureRef.current;
      if (previous?.source === territory.sourceId && previous.id === territory.featureId) return;
      if (previous) map?.setFeatureState({ source: previous.source, id: previous.id }, { hover: false });
      map?.setFeatureState({ source: territory.sourceId, id: territory.featureId }, { hover: true });
      hoveredFeatureRef.current = { source: territory.sourceId, id: territory.featureId };
      setHoveredTerritory(territory);
      if (map) map.getCanvas().style.cursor = "pointer";
    }

    function onClick(event: MapMouseEvent) {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".history-marker")) return;
      const territory = findTerritory(event);
      if (territory) {
        setSelectedId(null);
        setSelectedTerritory(territory);
      }
    }

    map.on("mousemove", onMouseMove);
    map.on("mouseout", clearHovered);
    map.on("click", onClick);
    return () => {
      map.off("mousemove", onMouseMove);
      map.off("mouseout", clearHovered);
      map.off("click", onClick);
      clearHovered();
    };
  }, [activeMapLayers, language, mapReady, year]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedTerritory) setSelectedTerritory(null);
        else setSelectedId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTerritory]);

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
      element.addEventListener("click", () => {
        setSelectedTerritory(null);
        setSelectedId(record.id);
        setEventCardOpen(true);
      });

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

  function changeYear(value: number) {
    const nextYear = Math.min(MAX_YEAR, Math.max(MIN_YEAR, value));
    setYear(nextYear);
    if (selected && !isVisibleInYear(selected, nextYear)) setSelectedId(null);
    if (selectedTerritory && (selectedTerritory.validFrom > nextYear || selectedTerritory.validTo < nextYear)) setSelectedTerritory(null);
  }

  return (
    <main className="history-app has-public-sidebar">
      <PublicSidebar active={showComparison ? "compare" : "map"} language={language} onCompare={() => setShowComparison(true)} />
      <header className="app-header">
        <div className="app-brand" aria-label="TarihLine">
          <span className="app-brand__mark">T</span>
          <div>
            <strong>TarihLine</strong>
            <span>Қазақстан · 1900–2000</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="language-switch" aria-label="Тіл / Язык">
            <button className={language === "kk" ? "is-active" : ""} type="button" onClick={() => setLanguage("kk")}>ҚАЗ</button>
            <button className={language === "ru" ? "is-active" : ""} type="button" onClick={() => setLanguage("ru")}>РУС</button>
          </div>
        </div>
      </header>

      <section className="map-workspace map-workspace--map-only">
        <div className="map-stage">
          <div className="map-canvas" ref={mapContainerRef} />
          {!mapReady && !mapError && <div className="map-loading"><span />TarihLine</div>}
          {mapError && <div className="map-error"><Icon name="info"/><p>{t.mapUnavailable}</p></div>}
          <div className="map-hint">{t.zoomHint} {t.territoryHint}</div>

          {hoveredTerritory && !selectedTerritory && <div className="territory-hover" aria-live="polite"><strong>{hoveredTerritory.name}</strong><span>{hoveredTerritory.validFrom}–{hoveredTerritory.validTo}</span></div>}

          {selectedTerritory && <article className="territory-card" aria-live="polite">
            <button className="detail-close" type="button" aria-label={t.close} onClick={() => setSelectedTerritory(null)}><Icon name="close" /></button>
            <span className="territory-card__kicker">{t.territory}</span>
            <h2>{selectedTerritory.name}</h2>
            <p>{t.territoryNaming}</p>
            <dl><div><dt>{t.territoryPeriod}</dt><dd>{selectedTerritory.validFrom}–{selectedTerritory.validTo}</dd></div><div><dt>{t.territorySource}</dt><dd>{selectedTerritory.layer.source.title}</dd></div></dl>
            <div className="territory-card__links">
              <a href={selectedTerritory.layer.source.url} target="_blank" rel="noreferrer">{t.territorySource} <span aria-hidden="true">↗</span></a>
              {selectedTerritory.wikipedia ? <a href={wikipediaUrl(selectedTerritory.wikipedia)} target="_blank" rel="noreferrer">{t.territoryArticle} <span aria-hidden="true">↗</span></a> : selectedTerritory.wikidata ? <a href={`https://www.wikidata.org/wiki/${encodeURIComponent(selectedTerritory.wikidata)}`} target="_blank" rel="noreferrer">Wikidata <span aria-hidden="true">↗</span></a> : null}
            </div>
          </article>}

          {selected && (
            <article className={eventCardOpen ? "detail-card event-card is-open" : "detail-card event-card is-collapsed"} aria-live="polite" aria-hidden={!eventCardOpen}>
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
              <button className="event-card-collapse" type="button" onClick={() => setEventCardOpen(false)} aria-label={language === "ru" ? "Скрыть карточку" : "Карточканы жасыру"}><span aria-hidden="true">‹</span></button>
            </article>
          )}
          {selected && !eventCardOpen && <button className="event-card-restore" type="button" onClick={() => setEventCardOpen(true)} aria-label={language === "ru" ? "Показать карточку" : "Карточканы көрсету"}><span aria-hidden="true">›</span></button>}
        </div>
      </section>

      <section className="timeline-panel" aria-label={t.selectedYear}>
        <div className="timeline-year-control">
          <button type="button" aria-label={previousChangeYear ? `${t.previous}: ${previousChangeYear}` : t.previous} title={previousChangeYear ? `${t.previous}: ${previousChangeYear}` : t.previous} disabled={previousChangeYear === null} onClick={() => previousChangeYear !== null && changeYear(previousChangeYear)}>‹</button>
          <div><span>{t.selectedYear}</span><strong>{year}</strong><small>{mapChangeYears.length} {t.mapStates}</small></div>
          <button type="button" aria-label={nextChangeYear ? `${t.next}: ${nextChangeYear}` : t.next} title={nextChangeYear ? `${t.next}: ${nextChangeYear}` : t.next} disabled={nextChangeYear === null} onClick={() => nextChangeYear !== null && changeYear(nextChangeYear)}>›</button>
        </div>
        <div className="timeline-main">
          <div className="working-scale">
            <div className="working-scale__labels"><span>{MIN_YEAR}</span><strong>{t.available}</strong><span>{MAX_YEAR}</span></div>
            <div className="timeline-slider">
              <div className="change-year-marks" aria-hidden="true">
                {mapChangeYears.map((changeYear) => <span className={changeYear === year ? "is-active" : ""} style={{ left: `${((changeYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%` }} key={changeYear} />)}
              </div>
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
            </div>
            <div className="year-ticks">
              {Array.from({ length: 11 }, (_, index) => MIN_YEAR + index * 10).map((tick) => (
                <button className={tick === year ? "is-active" : ""} type="button" key={tick} onClick={() => changeYear(tick)}><span />{tick}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showComparison && <div className="comparison-overlay" role="dialog" aria-modal="true" aria-label={language === "ru" ? "Сравнение событий" : "Оқиғаларды салыстыру"}>
        <ComparisonView
          records={records}
          relations={relations}
          mapLayers={mapLayers}
          language={language}
          initialLeftId={selected?.type === "event" ? selected.id : null}
          onLanguageChange={setLanguage}
          onClose={() => setShowComparison(false)}
        />
      </div>}

    </main>
  );
}
