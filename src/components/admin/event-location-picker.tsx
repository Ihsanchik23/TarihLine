"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalMapLayer } from "@/lib/history-types";
import { collapseMapAttribution, renderHistoricalLayers, tarihLineMapStyle } from "@/lib/map-style";

setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

type EventLocationPickerProps = {
  disabled?: boolean;
  initialLongitude: number | null;
  initialLatitude: number | null;
  mapLayers: HistoricalMapLayer[];
  year: number;
};

function coordinate(value: number | null) {
  return value === null ? "—" : value.toFixed(5);
}

export function EventLocationPicker({
  disabled = false,
  initialLongitude,
  initialLatitude,
  mapLayers,
  year,
}: EventLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MapLibreMap;

    try {
      const hasInitialPoint = initialLongitude !== null && initialLatitude !== null;
      map = new MapLibreMap({
        container: containerRef.current,
        style: tarihLineMapStyle,
        center: hasInitialPoint ? [initialLongitude, initialLatitude] : [61, 39],
        zoom: hasInitialPoint ? 4.5 : 2.1,
        minZoom: 1,
        maxZoom: 10,
        interactive: !disabled,
        attributionControl: { compact: true },
      });
    } catch {
      queueMicrotask(() => setMapError(true));
      return;
    }

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      setMapError(false);
      setMapReady(true);
      collapseMapAttribution(map);
    });
    map.on("click", ({ lngLat }) => {
      if (disabled) return;
      setLongitude(lngLat.lng);
      setLatitude(lngLat.lat);
    });
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [disabled, initialLatitude, initialLongitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    renderHistoricalLayers(map, mapLayers, "ru", year);
  }, [mapLayers, mapReady, year]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || longitude === null || latitude === null) return;

    if (!markerRef.current) {
      const marker = new Marker({ color: "#a36f1d", draggable: !disabled })
        .setLngLat([longitude, latitude])
        .addTo(map);
      marker.on("dragend", () => {
        const position = marker.getLngLat();
        setLongitude(position.lng);
        setLatitude(position.lat);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [disabled, latitude, longitude]);

  return (
    <div className={`admin-location-picker${disabled ? " admin-location-picker-disabled" : ""}`}>
      <div className="admin-location-map" ref={containerRef} />
      {mapError ? <p className="admin-location-error">Карта не загрузилась. Проверьте подключение и повторите попытку.</p> : null}
      <div className="admin-coordinate-strip" aria-live="polite">
        <span>Долгота <strong>{coordinate(longitude)}</strong></span>
        <span>Широта <strong>{coordinate(latitude)}</strong></span>
        <span>Границы показаны для <strong>{year}</strong> года</span>
      </div>
      <input name="longitude" type="hidden" value={longitude ?? ""} />
      <input name="latitude" type="hidden" value={latitude ?? ""} />
    </div>
  );
}
