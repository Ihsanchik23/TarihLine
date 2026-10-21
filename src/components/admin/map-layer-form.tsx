"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { changeMapLayerStatus, createMapLayer, deleteMapLayer, updateMapLayer, type MapLayerActionState } from "@/app/admin/(protected)/maps/actions";
import { validateGeoJsonText } from "@/lib/geojson";
import { createClient } from "@/lib/supabase/browser";

const initialState: MapLayerActionState = { error: null };

type SourceOption = {
  id: string;
  title: string;
  license: string | null;
};

export type MapLayerValues = {
  id: string;
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
  status: string;
};

function LayerFields({ sources, values }: { sources: SourceOption[]; values?: MapLayerValues }) {
  return <>
    <fieldset className="admin-form-section"><legend><span>01</span> Название и территория</legend><div className="admin-form-grid admin-form-grid-languages">
      <label><span>Название на русском *</span><input name="title_ru" maxLength={180} defaultValue={values?.titleRu} required /></label>
      <label><span>Название на казахском *</span><input name="title_kk" maxLength={180} defaultValue={values?.titleKk} required /></label>
      <label><span>Территория на русском *</span><input name="area_label_ru" maxLength={180} defaultValue={values?.areaRu} required /></label>
      <label><span>Территория на казахском *</span><input name="area_label_kk" maxLength={180} defaultValue={values?.areaKk} required /></label>
    </div></fieldset>
    <fieldset className="admin-form-section"><legend><span>02</span> Период и классификация</legend><div className="admin-form-grid admin-map-layer-period">
      <label><span>Начало *</span><input name="valid_from" type="number" min={1900} max={2000} defaultValue={values?.validFrom ?? 1900} required /></label>
      <label><span>Конец *</span><input name="valid_to" type="number" min={1900} max={2000} defaultValue={values?.validTo ?? 2000} required /></label>
      <label><span>Опорный год *</span><input name="snapshot_year" type="number" min={1900} max={2000} defaultValue={values?.snapshotYear ?? 1950} required /></label>
      <label><span>Приоритет *</span><input name="priority" type="number" min={0} max={10000} defaultValue={values?.priority ?? 100} required /></label>
      <label><span>Уровень *</span><select name="administrative_level" defaultValue={values?.administrativeLevel ?? "country"}><option value="country">Государства</option><option value="polity">Политические образования</option><option value="region">Регионы</option><option value="province">Административные единицы</option></select></label>
      <label><span>Охват *</span><select name="coverage" defaultValue={values?.coverage ?? "global"}><option value="global">Весь мир</option><option value="partial">Часть мира</option><option value="local">Локальная территория</option></select></label>
      <label className="admin-map-layer-checkbox"><input name="reconstruction" type="checkbox" defaultChecked={values?.reconstruction ?? true} /><span>Историческая реконструкция</span></label>
    </div></fieldset>
    <fieldset className="admin-form-section"><legend><span>03</span> Происхождение данных</legend><div className="admin-form-grid admin-form-grid-source">
      <label className="admin-field-wide"><span>Источник *</span><select name="source_id" defaultValue={values?.sourceId ?? ""} required><option value="" disabled>Выберите набор данных или публикацию</option>{sources.map((source) => <option value={source.id} key={source.id}>{source.title}</option>)}</select></label>
      <label className="admin-field-wide"><span>Лицензия *</span><input name="license" maxLength={120} defaultValue={values?.license} placeholder="Например, CC BY 4.0" required /></label>
    </div></fieldset>
  </>;
}

export function NewMapLayerForm({ sources }: { sources: SourceOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileSummary, setFileSummary] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("geojson_file");
    if (!(file instanceof File) || !file.size) {
      setError("Выберите GeoJSON-файл");
      return;
    }
    if (file.size > 10485760) {
      setError("Размер GeoJSON превышает 10 МБ");
      return;
    }
    const validation = validateGeoJsonText(await file.text());
    if (validation.error) {
      setError(validation.error);
      return;
    }

    setPending(true);
    setError(null);
    const path = `admin/${crypto.randomUUID()}.geojson`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("historical-maps").upload(path, file, { cacheControl: "3600", contentType: "application/geo+json", upsert: false });
    if (uploadError) {
      setError("Не удалось загрузить GeoJSON в хранилище");
      setPending(false);
      return;
    }

    data.delete("geojson_file");
    data.set("geojson_path", path);
    const result = await createMapLayer(data);
    if (result.error || !result.layerId) {
      await supabase.storage.from("historical-maps").remove([path]);
      setError(result.error ?? "Не удалось создать слой");
      setPending(false);
      return;
    }
    router.push(`/admin/maps/${result.layerId}?created=1`);
    router.refresh();
  }

  return <form className="admin-editor-form" onSubmit={submit}>
    {error ? <div className="admin-alert" role="alert">{error}</div> : null}
    <LayerFields sources={sources} />
    <fieldset className="admin-form-section"><legend><span>04</span> Геометрия</legend><div className="admin-map-upload">
      <label><span>GeoJSON-файл *</span><input name="geojson_file" type="file" accept=".geojson,application/geo+json,application/json" required onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return setFileSummary(null);
        if (file.size > 10485760) return setFileSummary("Файл превышает 10 МБ");
        const result = validateGeoJsonText(await file.text());
        setFileSummary(result.error ?? `${result.featureCount.toLocaleString("ru-RU")} полигонов · ${(file.size / 1048576).toFixed(2)} МБ`);
      }} /></label>
      <p>{fileSummary ?? "Поддерживаются FeatureCollection с геометриями Polygon и MultiPolygon, до 10 МБ."}</p>
    </div></fieldset>
    <div className="admin-form-footer"><p>Новый слой сохранится как черновик и не появится на публичной карте.</p><button type="submit" disabled={pending}>{pending ? "Проверка и загрузка…" : "Создать слой"}</button></div>
  </form>;
}

export function MapLayerEditor({ layer, sources }: { layer: MapLayerValues; sources: SourceOption[] }) {
  const [updateState, updateAction, updatePending] = useActionState(updateMapLayer, initialState);
  const [statusState, statusAction, statusPending] = useActionState(changeMapLayerStatus, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteMapLayer, initialState);
  const transitions: Record<string, Array<{ value: string; label: string; secondary?: boolean }>> = {
    draft: [{ value: "verified", label: "Отметить проверенным" }],
    verified: [{ value: "draft", label: "Вернуть в черновики", secondary: true }, { value: "published", label: "Опубликовать" }],
    published: [{ value: "archived", label: "Переместить в архив", secondary: true }],
    archived: [{ value: "draft", label: "Вернуть в черновики" }],
  };

  return <>
    <form className="admin-editor-form" action={updateAction}>
      <input name="layer_id" type="hidden" value={layer.id} />
      {updateState.error ? <div className="admin-alert" role="alert">{updateState.error}</div> : null}
      {updateState.message ? <div className="admin-success" role="status">{updateState.message}</div> : null}
      <LayerFields sources={sources} values={layer} />
      <div className="admin-form-footer"><p>Изменения опубликованного слоя сразу влияют на карту.</p><button type="submit" disabled={updatePending}>{updatePending ? "Сохранение…" : "Сохранить изменения"}</button></div>
    </form>
    <section className={`admin-workflow admin-workflow-${layer.status}`}><div className="admin-workflow-copy"><span>Статус слоя</span><strong>{layer.status === "draft" ? "Черновик" : layer.status === "verified" ? "Проверено" : layer.status === "published" ? "Опубликовано" : "В архиве"}</strong><p>Перед публикацией файл повторно проходит серверную проверку.</p></div><div className="admin-workflow-actions">{(transitions[layer.status] ?? []).map((transition) => <form action={statusAction} key={transition.value}><input name="layer_id" type="hidden" value={layer.id} /><input name="target_status" type="hidden" value={transition.value} /><button className={transition.secondary ? "admin-workflow-secondary" : ""} disabled={statusPending}>{transition.label}</button></form>)}</div>{statusState.error ? <div className="admin-workflow-error" role="alert">{statusState.error}</div> : null}{statusState.message ? <div className="admin-success" role="status">{statusState.message}</div> : null}</section>
    <section className="admin-source-danger"><div><h2>Удаление слоя</h2><p>{layer.status === "draft" || layer.status === "archived" ? "Будут удалены запись и GeoJSON-файл." : "Опубликованный или проверенный слой сначала нужно переместить в архив."}</p></div><form action={deleteAction}><input name="layer_id" type="hidden" value={layer.id} /><button type="submit" disabled={deletePending || !["draft", "archived"].includes(layer.status)}>{deletePending ? "Удаление…" : "Удалить слой"}</button></form>{deleteState.error ? <div className="admin-alert" role="alert">{deleteState.error}</div> : null}</section>
  </>;
}
