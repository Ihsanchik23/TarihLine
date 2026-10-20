"use client";

import { useActionState, useState } from "react";
import { createPersonDraft, updatePersonDraft, type PersonFormState } from "@/app/admin/(protected)/people/actions";
import type { HistoricalMapLayer } from "@/lib/history-types";
import { EventLocationPicker } from "./event-location-picker";

const initialState: PersonFormState = { error: null };

export type PersonFormValues = {
  recordId: string;
  sourceId: string;
  titleRu: string;
  titleKk: string;
  summaryRu: string;
  summaryKk: string;
  biographyRu: string;
  biographyKk: string;
  occupationRu: string;
  occupationKk: string;
  category: string;
  birthYear: number;
  deathYear: number | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceAuthor: string;
  sourcePublisher: string;
  sourceLicense: string;
  locationRu: string;
  locationKk: string;
  locationPrecision: string;
  longitude: number | null;
  latitude: number | null;
};

type PersonFormProps = {
  initialValues?: PersonFormValues;
  mapLayers?: HistoricalMapLayer[];
  editable?: boolean;
};

export function PersonForm({ initialValues, mapLayers = [], editable = true }: PersonFormProps) {
  const editing = Boolean(initialValues);
  const action = editing ? updatePersonDraft : createPersonDraft;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [birthYear, setBirthYear] = useState(initialValues?.birthYear ?? 1950);

  return <form className={`admin-editor-form${editable ? "" : " admin-editor-form-locked"}`} action={editable ? formAction : undefined}>
    {initialValues ? <><input name="record_id" type="hidden" value={initialValues.recordId} /><input name="source_id" type="hidden" value={initialValues.sourceId} /></> : null}
    {state.error ? <div className="admin-alert" role="alert">{state.error}</div> : null}
    <fieldset className="admin-form-section" disabled={!editable}><legend><span>01</span> Основные данные</legend><div className="admin-form-grid admin-form-grid-languages">
      <label><span>Имя на русском *</span><input name="title_ru" required maxLength={180} defaultValue={initialValues?.titleRu} /></label>
      <label><span>Қазақша аты *</span><input name="title_kk" required maxLength={180} defaultValue={initialValues?.titleKk} /></label>
      <label><span>Кратко на русском *</span><textarea name="summary_ru" rows={3} required maxLength={500} defaultValue={initialValues?.summaryRu} /></label>
      <label><span>Қазақша қысқаша *</span><textarea name="summary_kk" rows={3} required maxLength={500} defaultValue={initialValues?.summaryKk} /></label>
      <label><span>Биография на русском *</span><textarea name="biography_ru" rows={8} required defaultValue={initialValues?.biographyRu} /></label>
      <label><span>Қазақша өмірбаян *</span><textarea name="biography_kk" rows={8} required defaultValue={initialValues?.biographyKk} /></label>
    </div></fieldset>
    <fieldset className="admin-form-section" disabled={!editable}><legend><span>02</span> Жизнь и деятельность</legend><div className="admin-form-grid admin-form-grid-period">
      <label><span>Год рождения *</span><input name="birth_year" type="number" min="1800" max="2000" required defaultValue={initialValues?.birthYear} onChange={(event) => setBirthYear(Number(event.target.value) || 1900)} /></label>
      <label><span>Год смерти</span><input name="death_year" type="number" min="1800" max="2026" defaultValue={initialValues?.deathYear ?? ""} /></label>
      <label><span>Категория *</span><select name="category" defaultValue={initialValues?.category ?? "politics"}><option value="politics">Политика</option><option value="war">Военное дело</option><option value="culture">Культура</option><option value="science">Наука</option><option value="society">Общество</option><option value="economy">Экономика</option></select></label>
    </div><div className="admin-form-grid admin-form-grid-languages"><label><span>Род деятельности *</span><input name="occupation_ru" required defaultValue={initialValues?.occupationRu} /></label><label><span>Қызмет саласы *</span><input name="occupation_kk" required defaultValue={initialValues?.occupationKk} /></label></div></fieldset>
    <fieldset className="admin-form-section" disabled={!editable}><legend><span>03</span> Источник</legend><p className="admin-form-intro">Биография должна опираться на проверяемый источник.</p><div className="admin-form-grid admin-form-grid-source">
      <label className="admin-field-wide"><span>Название *</span><input name="source_title" required maxLength={240} defaultValue={initialValues?.sourceTitle} /></label>
      <label className="admin-field-wide"><span>Ссылка *</span><input name="source_url" type="url" required placeholder="https://" defaultValue={initialValues?.sourceUrl} /></label>
      <label><span>Автор</span><input name="source_author" maxLength={180} defaultValue={initialValues?.sourceAuthor} /></label>
      <label><span>Издатель</span><input name="source_publisher" maxLength={180} defaultValue={initialValues?.sourcePublisher} /></label>
      <label><span>Лицензия *</span><input name="source_license" required maxLength={120} defaultValue={initialValues?.sourceLicense} /></label>
    </div></fieldset>
    {initialValues ? <fieldset className="admin-form-section" disabled={!editable}><legend><span>04</span> Основное место на карте</legend><p className="admin-form-intro">Укажите место, с которым личность связана сильнее всего. Границы показаны для года рождения.</p><div className="admin-form-grid admin-form-grid-location">
      <label><span>Название места на русском *</span><input name="location_ru" required maxLength={180} defaultValue={initialValues.locationRu} /></label>
      <label><span>Қазақша жер атауы *</span><input name="location_kk" required maxLength={180} defaultValue={initialValues.locationKk} /></label>
      <label><span>Точность местоположения *</span><select name="location_precision" defaultValue={initialValues.locationPrecision} required><option value="point">Точная точка</option><option value="approximate">Приблизительно</option></select></label>
    </div><EventLocationPicker initialLongitude={initialValues.longitude} initialLatitude={initialValues.latitude} mapLayers={mapLayers} year={birthYear} disabled={!editable} /></fieldset> : null}
    {editable ? <div className="admin-form-footer"><p>{editing ? "Изменения останутся в черновике и не появятся на публичной карте." : "Личность сохранится как черновик. Место на карте задаётся на следующем шаге."}</p><button type="submit" disabled={pending}>{pending ? "Сохранение…" : editing ? "Сохранить изменения" : "Сохранить черновик"}</button></div> : null}
  </form>;
}
