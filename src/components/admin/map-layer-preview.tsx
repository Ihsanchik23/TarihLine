"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { collapseMapAttribution, tarihLineMapStyle } from "@/lib/map-style";

setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

export function MapLayerPreview({ url, reconstruction }: { url: string; reconstruction: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({ container: containerRef.current, style: tarihLineMapStyle, center: [61, 39], zoom: 1.6, minZoom: 1, maxZoom: 7, attributionControl: { compact: true } });
    } catch {
      queueMicrotask(() => setError(true));
      return;
    }
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      collapseMapAttribution(map);
      map.addSource("admin-layer-preview", { type: "geojson", data: url });
      map.addLayer({ id: "admin-layer-preview-fill", type: "fill", source: "admin-layer-preview", paint: { "fill-color": ["coalesce", ["get", "fill"], "#c79a4d"], "fill-opacity": reconstruction ? 0.32 : 0.42 } });
      map.addLayer({ id: "admin-layer-preview-line", type: "line", source: "admin-layer-preview", paint: { "line-color": ["coalesce", ["get", "stroke"], "#2f4d43"], "line-width": reconstruction ? 1.4 : 1.8, ...(reconstruction ? { "line-dasharray": [3, 2] } : {}) } });
      setError(false);
    });
    return () => map.remove();
  }, [reconstruction, url]);

  return <div className="admin-map-preview"><div ref={containerRef} className="admin-map-preview-canvas" />{error ? <p>Не удалось отобразить геометрию. Проверьте доступность файла.</p> : null}</div>;
}
