"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalMapLayer, HistoryRecord } from "@/lib/history-types";
import { collapseMapAttribution, renderHistoricalLayers, tarihLineMapStyle } from "@/lib/map-style";
import "./route-journey.css";

setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

type RouteItem = {
  id: string;
  authorComment: string | null;
  record: HistoryRecord;
};

type Props = {
  route: { id: string; title: string; description: string | null };
  items: RouteItem[];
  mapLayers: HistoricalMapLayer[];
};

export function RouteJourney({ route, items, mapLayers }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const initialCoordinatesRef = useRef(items[0].record.coordinates);
  const [index, setIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const current = items[index];
  const activeLayers = useMemo(() => mapLayers.filter((layer) => layer.validFrom <= current.record.startYear && layer.validTo >= current.record.startYear), [current.record.startYear, mapLayers]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: mapContainerRef.current,
        style: tarihLineMapStyle,
        center: initialCoordinatesRef.current ?? [61, 39],
        zoom: initialCoordinatesRef.current ? 4 : 2.1,
        minZoom: 1,
        maxZoom: 7,
        attributionControl: { compact: true },
      });
    } catch {
      queueMicrotask(() => setMapError(true));
      return;
    }
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    const timer = window.setTimeout(() => {
      if (!map.isStyleLoaded()) setMapError(true);
    }, 12000);
    map.on("load", () => {
      window.clearTimeout(timer);
      collapseMapAttribution(map);
      setMapError(false);
    });
    mapRef.current = map;
    queueMicrotask(() => setMapReady(true));
    return () => {
      window.clearTimeout(timer);
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const render = () => renderHistoricalLayers(map, activeLayers, "ru", current.record.startYear);
    if (map.isStyleLoaded()) render();
    else map.once("load", render);

    markerRef.current?.remove();
    if (current.record.coordinates) {
      const markerElement = document.createElement("div");
      markerElement.className = "route-map-marker";
      markerElement.textContent = String(index + 1);
      markerElement.setAttribute("aria-label", current.record.title.ru);
      markerRef.current = new Marker({ element: markerElement }).setLngLat(current.record.coordinates).addTo(map);
      map.flyTo({ center: current.record.coordinates, zoom: 4.3, duration: 900 });
    } else {
      map.flyTo({ center: [61, 39], zoom: 2.1, duration: 900 });
    }
    return () => {
      map.off("load", render);
    };
  }, [activeLayers, current.record, index, mapReady]);

  return <main className="route-journey">
    <header>
      <Link className="route-journey-brand" href="/"><span>T</span><strong>TarihLine</strong></Link>
      <div><small>ИСТОРИЧЕСКИЙ МАРШРУТ</small><h1>{route.title}</h1></div>
      <Link href={`/routes/${route.id}`}><span aria-hidden="true">←</span> Редактировать</Link>
    </header>

    <section className="route-journey-workspace">
      <aside>
        <div className="route-journey-progress"><span>Точка {index + 1} из {items.length}</span><div><i style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div></div>
        <div className="route-journey-year">{current.record.startYear}</div>
        <h2>{current.record.title.ru}</h2>
        <p>{current.record.summary.ru}</p>
        <dl><div><dt>Место</dt><dd>{current.record.location.ru}</dd></div><div><dt>Дата</dt><dd>{current.record.dateLabel.ru}</dd></div></dl>
        {current.authorComment ? <blockquote><span>Комментарий к маршруту</span><p>{current.authorComment}</p></blockquote> : null}
        <Link className="route-journey-record" href={`/catalog/${current.record.slug}`}>Открыть материал <span aria-hidden="true">↗</span></Link>
        <div className="route-journey-controls"><button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}><span aria-hidden="true">←</span> Назад</button><button type="button" onClick={() => setIndex((value) => Math.min(items.length - 1, value + 1))} disabled={index === items.length - 1}>Далее <span aria-hidden="true">→</span></button></div>
        <ol>{items.map((item, itemIndex) => <li className={itemIndex === index ? "is-active" : ""} key={item.id}><button type="button" onClick={() => setIndex(itemIndex)}><span>{String(itemIndex + 1).padStart(2, "0")}</span><div><strong>{item.record.title.ru}</strong><small>{item.record.startYear}</small></div></button></li>)}</ol>
      </aside>
      <div className="route-journey-map"><div ref={mapContainerRef} className="route-journey-map__canvas" />{mapError ? <div className="route-journey-map__error">Карта временно недоступна. Навигация по маршруту продолжает работать.</div> : null}<div className="route-journey-map__label"><span>Исторический слой</span><strong>{current.record.startYear}</strong></div></div>
    </section>
  </main>;
}
