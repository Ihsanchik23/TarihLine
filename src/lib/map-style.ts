import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { HistoricalMapLayer, Language } from "@/lib/history-types";

const colors = ["#d4a85f", "#6f9f87", "#bf765e", "#8195b2", "#aa8f69", "#7d9e9b"];
const sourcePrefix = "tarihline-history-source-";
const fillPrefix = "tarihline-history-fill-";
const linePrefix = "tarihline-history-line-";
const oceanTiles = "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}";

export const tarihLineMapStyle: StyleSpecification = {
  version: 8,
  name: "TarihLine",
  sources: {
    "tarihline-base-map": {
      type: "raster",
      tiles: [oceanTiles],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 16,
      attribution: "Esri, Garmin, GEBCO, NOAA NGDC, and other contributors",
    },
  },
  layers: [
    {
      id: "tarihline-ocean",
      type: "background",
      paint: { "background-color": "#d8e2e4" },
    },
    {
      id: "tarihline-base-map",
      type: "raster",
      source: "tarihline-base-map",
      paint: {
        "raster-opacity": 0.72,
        "raster-saturation": -0.62,
        "raster-contrast": -0.08,
        "raster-brightness-min": 0.2,
        "raster-brightness-max": 0.96,
      },
    },
  ],
};

function removeHistoricalLayers(map: MapLibreMap) {
  const style = map.getStyle();
  const layerIds = style.layers
    .map((layer) => layer.id)
    .filter((id) => id.startsWith(fillPrefix) || id.startsWith(linePrefix));

  layerIds.reverse().forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });

  Object.keys(style.sources)
    .filter((id) => id.startsWith(sourcePrefix))
    .forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
}

export function renderHistoricalLayers(map: MapLibreMap, layers: HistoricalMapLayer[], language: Language) {
  if (!map.isStyleLoaded()) return;
  removeHistoricalLayers(map);

  layers.forEach((layer, index) => {
    const sourceId = `${sourcePrefix}${layer.id}`;
    const fillId = `${fillPrefix}${layer.id}`;
    const lineId = `${linePrefix}${layer.id}`;
    const color = colors[index % colors.length];

    map.addSource(sourceId, {
      type: "geojson",
      data: layer.geojsonUrl,
      attribution: `${layer.source.publisher}: ${layer.source.title} · ${layer.license}`,
    });
    map.addLayer({
      id: fillId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["coalesce", ["get", "fill"], color],
        "fill-opacity": layer.reconstruction ? 0.32 : 0.42,
      },
      metadata: {
        "tarihline:title": layer.title[language],
      },
    });
    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["coalesce", ["get", "stroke"], "#3e5148"],
        "line-width": layer.reconstruction ? 1.4 : 1.8,
        "line-opacity": 0.9,
        ...(layer.reconstruction ? { "line-dasharray": [3, 2] } : {}),
      },
      metadata: {
        "tarihline:title": layer.title[language],
      },
    });
  });
}
