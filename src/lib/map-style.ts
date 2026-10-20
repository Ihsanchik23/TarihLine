import type { FeatureCollection } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import landTopology from "world-atlas/land-110m.json";
import type { HistoricalMapLayer, Language } from "@/lib/history-types";

const land = feature(
  landTopology as unknown as Topology,
  landTopology.objects.land as unknown as GeometryCollection,
) as FeatureCollection;

const colors = ["#d4a85f", "#6f9f87", "#bf765e", "#8195b2", "#aa8f69", "#7d9e9b"];
const sourcePrefix = "tarihline-history-source-";
const fillPrefix = "tarihline-history-fill-";
const linePrefix = "tarihline-history-line-";

export const tarihLineMapStyle: StyleSpecification = {
  version: 8,
  name: "TarihLine",
  sources: {
    "tarihline-land": {
      type: "geojson",
      data: land,
      attribution: "Natural Earth",
    },
  },
  layers: [
    {
      id: "tarihline-ocean",
      type: "background",
      paint: { "background-color": "#cfded9" },
    },
    {
      id: "tarihline-land-fill",
      type: "fill",
      source: "tarihline-land",
      paint: { "fill-color": "#f0e8d8", "fill-opacity": 1 },
    },
    {
      id: "tarihline-coastline",
      type: "line",
      source: "tarihline-land",
      paint: { "line-color": "#9aa89f", "line-width": 1.1, "line-opacity": 0.9 },
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
