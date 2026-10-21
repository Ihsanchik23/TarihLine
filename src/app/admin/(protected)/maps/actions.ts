"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { validateGeoJsonText } from "@/lib/geojson";
import { createClient } from "@/lib/supabase/server";

export type MapLayerActionState = {
  error: string | null;
  message?: string;
  layerId?: string;
};

type LayerFields = {
  titleRu: string;
  titleKk: string;
  areaRu: string;
  areaKk: string;
  administrativeLevel: string;
  coverage: string;
  license: string;
  sourceId: string;
  validFrom: number;
  validTo: number;
  snapshotYear: number;
  priority: number;
  reconstruction: boolean;
};

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readFields(data: FormData): LayerFields {
  return {
    titleRu: field(data, "title_ru"),
    titleKk: field(data, "title_kk"),
    areaRu: field(data, "area_label_ru"),
    areaKk: field(data, "area_label_kk"),
    administrativeLevel: field(data, "administrative_level"),
    coverage: field(data, "coverage"),
    license: field(data, "license"),
    sourceId: field(data, "source_id"),
    validFrom: Number(field(data, "valid_from")),
    validTo: Number(field(data, "valid_to")),
    snapshotYear: Number(field(data, "snapshot_year")),
    priority: Number(field(data, "priority")),
    reconstruction: field(data, "reconstruction") === "on",
  };
}

function validateFields(values: LayerFields) {
  if (!values.titleRu || !values.titleKk || !values.areaRu || !values.areaKk || !values.administrativeLevel || !values.license || !values.sourceId) return "Заполните все обязательные поля";
  if (!(["global", "partial", "local"] as string[]).includes(values.coverage)) return "Выберите охват слоя";
  if (!Number.isInteger(values.validFrom) || !Number.isInteger(values.validTo) || values.validFrom < 1900 || values.validTo > 2000 || values.validTo < values.validFrom) return "Период должен находиться в диапазоне 1900–2000";
  if (!Number.isInteger(values.snapshotYear) || values.snapshotYear < values.validFrom || values.snapshotYear > values.validTo) return "Опорный год должен находиться внутри периода слоя";
  if (!Number.isInteger(values.priority) || values.priority < 0 || values.priority > 10000) return "Приоритет должен быть целым числом от 0 до 10000";
  return null;
}

async function validateStoredGeoJson(path: string) {
  if (!/^admin\/[0-9a-f-]{36}\.geojson$/.test(path)) return { error: "Некорректный путь файла", featureCount: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("historical-maps").download(path);
  if (error || !data) return { error: "Загруженный файл не найден", featureCount: 0 };
  if (data.size > 10485760) return { error: "Размер GeoJSON превышает 10 МБ", featureCount: 0 };
  return validateGeoJsonText(await data.text());
}

export async function createMapLayer(data: FormData): Promise<MapLayerActionState> {
  await requireAdmin();
  const values = readFields(data);
  const validationError = validateFields(values);
  const path = field(data, "geojson_path");
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const [{ data: source }, geojson] = await Promise.all([
    supabase.from("sources").select("id").eq("id", values.sourceId).maybeSingle(),
    validateStoredGeoJson(path),
  ]);
  if (!source) return { error: "Выбранный источник не найден" };
  if (geojson.error) {
    if (path) await supabase.storage.from("historical-maps").remove([path]);
    return { error: geojson.error };
  }

  const { data: layer, error } = await supabase.from("border_layers").insert({
    title_ru: values.titleRu,
    title_kk: values.titleKk,
    area_label_ru: values.areaRu,
    area_label_kk: values.areaKk,
    administrative_level: values.administrativeLevel,
    coverage: values.coverage,
    license: values.license,
    source_id: values.sourceId,
    valid_from: values.validFrom,
    valid_to: values.validTo,
    snapshot_year: values.snapshotYear,
    priority: values.priority,
    reconstruction: values.reconstruction,
    geojson_path: path,
    status: "draft",
  }).select("id").single();
  if (error || !layer) {
    await supabase.storage.from("historical-maps").remove([path]);
    return { error: error?.code === "23505" ? "Этот GeoJSON уже используется" : "Не удалось создать слой" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/maps");
  return { error: null, layerId: layer.id };
}

export async function updateMapLayer(_state: MapLayerActionState, data: FormData): Promise<MapLayerActionState> {
  await requireAdmin();
  const layerId = field(data, "layer_id");
  const values = readFields(data);
  const validationError = validateFields(values);
  if (!layerId) return { error: "Слой не найден" };
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.from("border_layers").update({
    title_ru: values.titleRu,
    title_kk: values.titleKk,
    area_label_ru: values.areaRu,
    area_label_kk: values.areaKk,
    administrative_level: values.administrativeLevel,
    coverage: values.coverage,
    license: values.license,
    source_id: values.sourceId,
    valid_from: values.validFrom,
    valid_to: values.validTo,
    snapshot_year: values.snapshotYear,
    priority: values.priority,
    reconstruction: values.reconstruction,
  }).eq("id", layerId);
  if (error) return { error: "Не удалось сохранить слой" };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/maps");
  revalidatePath(`/admin/maps/${layerId}`);
  return { error: null, message: "Изменения слоя сохранены" };
}

export async function changeMapLayerStatus(_state: MapLayerActionState, data: FormData): Promise<MapLayerActionState> {
  await requireAdmin();
  const layerId = field(data, "layer_id");
  const target = field(data, "target_status");
  if (!layerId || !["draft", "verified", "published", "archived"].includes(target)) return { error: "Некорректный статус" };

  const supabase = await createClient();
  const { data: layer } = await supabase.from("border_layers").select("status,geojson_path").eq("id", layerId).maybeSingle();
  if (!layer) return { error: "Слой не найден" };
  const transitions: Record<string, string[]> = { draft: ["verified"], verified: ["draft", "published"], published: ["archived"], archived: ["draft"] };
  if (!transitions[layer.status]?.includes(target)) return { error: "Этот переход между статусами недоступен" };
  if (target === "verified" || target === "published") {
    const validation = await validateStoredGeoJson(layer.geojson_path);
    if (validation.error) return { error: validation.error };
  }

  const { data: updated, error } = await supabase.from("border_layers").update({ status: target }).eq("id", layerId).eq("status", layer.status).select("id").maybeSingle();
  if (error || !updated) return { error: "Не удалось изменить статус слоя" };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/maps");
  revalidatePath(`/admin/maps/${layerId}`);
  return { error: null, message: target === "published" ? "Слой опубликован на карте" : "Статус слоя изменён" };
}

export async function deleteMapLayer(_state: MapLayerActionState, data: FormData): Promise<MapLayerActionState> {
  await requireAdmin();
  const layerId = field(data, "layer_id");
  if (!layerId) return { error: "Слой не найден" };
  const supabase = await createClient();
  const { data: layer } = await supabase.from("border_layers").select("status,geojson_path").eq("id", layerId).maybeSingle();
  if (!layer) return { error: "Слой не найден" };
  if (!["draft", "archived"].includes(layer.status)) return { error: "Сначала переместите слой в архив" };
  const { error } = await supabase.from("border_layers").delete().eq("id", layerId);
  if (error) return { error: "Не удалось удалить слой" };
  await supabase.storage.from("historical-maps").remove([layer.geojson_path]);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/maps");
  redirect("/admin/maps?deleted=1");
}
