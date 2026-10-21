type ValidationResult = {
  error: string | null;
  featureCount: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samePosition(first: unknown, last: unknown) {
  return Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1];
}

function validPosition(value: unknown) {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === "number"
    && Number.isFinite(value[0])
    && value[0] >= -180
    && value[0] <= 180
    && typeof value[1] === "number"
    && Number.isFinite(value[1])
    && value[1] >= -90
    && value[1] <= 90;
}

function validRing(value: unknown) {
  return Array.isArray(value)
    && value.length >= 4
    && value.every(validPosition)
    && samePosition(value[0], value[value.length - 1]);
}

function validPolygon(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every(validRing);
}

function validGeometry(value: unknown) {
  if (!isObject(value) || typeof value.type !== "string") return false;
  if (value.type === "Polygon") return validPolygon(value.coordinates);
  if (value.type === "MultiPolygon") return Array.isArray(value.coordinates) && value.coordinates.length > 0 && value.coordinates.every(validPolygon);
  return false;
}

function validFeature(value: unknown) {
  return isObject(value) && value.type === "Feature" && validGeometry(value.geometry);
}

export function validateGeoJsonText(text: string): ValidationResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: "Файл содержит некорректный JSON", featureCount: 0 };
  }

  if (!isObject(value)) return { error: "GeoJSON должен быть объектом", featureCount: 0 };
  if (value.type === "Feature") {
    return validFeature(value)
      ? { error: null, featureCount: 1 }
      : { error: "Слой должен содержать корректную геометрию Polygon или MultiPolygon", featureCount: 0 };
  }
  if (value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    return { error: "Ожидается FeatureCollection с полигонами границ", featureCount: 0 };
  }
  if (!value.features.length) return { error: "В GeoJSON нет объектов", featureCount: 0 };
  if (value.features.length > 50000) return { error: "В одном слое допускается не более 50 000 объектов", featureCount: 0 };
  if (!value.features.every(validFeature)) {
    return { error: "Все объекты должны содержать корректную геометрию Polygon или MultiPolygon", featureCount: 0 };
  }
  return { error: null, featureCount: value.features.length };
}
