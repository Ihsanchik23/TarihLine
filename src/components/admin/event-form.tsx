"use client";

import { useActionState, useState } from "react";
import {
  createEventDraft,
  updateEventDraft,
  type EventFormState,
} from "@/app/admin/(protected)/events/actions";
import type { HistoricalMapLayer } from "@/lib/history-types";
import { EventLocationPicker } from "./event-location-picker";

const initialState: EventFormState = { error: null };

export type EventFormValues = {
  recordId: string;
  sourceId: string;
  titleRu: string;
  titleKk: string;
  summaryRu: string;
  summaryKk: string;
  descriptionRu: string;
  descriptionKk: string;
  significanceRu: string;
  significanceKk: string;
  category: string;
  startYear: number;
  endYear: number | null;
  datePrecision: string;
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

type EventFormProps = {
  initialValues?: EventFormValues;
  mapLayers?: HistoricalMapLayer[];
};

export function EventForm({ initialValues, mapLayers = [] }: EventFormProps) {
  const editing = Boolean(initialValues);
  const action = editing ? updateEventDraft : createEventDraft;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [startYear, setStartYear] = useState(initialValues?.startYear ?? 1950);

  return (
    <form className="admin-editor-form" action={formAction}>
      {initialValues ? (
        <>
          <input name="record_id" type="hidden" value={initialValues.recordId} />
          <input name="source_id" type="hidden" value={initialValues.sourceId} />
        </>
      ) : null}
      {state.error ? <div className="admin-alert" role="alert">{state.error}</div> : null}

      <fieldset className="admin-form-section">
        <legend><span>01</span> Основные данные</legend>
        <div className="admin-form-grid admin-form-grid-languages">
          <label>
            <span>Название на русском *</span>
            <input name="title_ru" required maxLength={180} defaultValue={initialValues?.titleRu} />
          </label>
          <label>
            <span>Название на казахском *</span>
            <input name="title_kk" required maxLength={180} defaultValue={initialValues?.titleKk} />
          </label>
          <label>
            <span>Краткое описание на русском *</span>
            <textarea name="summary_ru" required rows={3} maxLength={500} defaultValue={initialValues?.summaryRu} />
          </label>
          <label>
            <span>Қазақша қысқаша сипаттама *</span>
            <textarea name="summary_kk" required rows={3} maxLength={500} defaultValue={initialValues?.summaryKk} />
          </label>
          <label>
            <span>Полное описание на русском *</span>
            <textarea name="description_ru" required rows={7} defaultValue={initialValues?.descriptionRu} />
          </label>
          <label>
            <span>Қазақша толық сипаттама *</span>
            <textarea name="description_kk" required rows={7} defaultValue={initialValues?.descriptionKk} />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend><span>02</span> Период и значение</legend>
        <div className="admin-form-grid admin-form-grid-period">
          <label>
            <span>Год начала *</span>
            <input
              name="start_year"
              type="number"
              min={1900}
              max={2000}
              required
              defaultValue={initialValues?.startYear}
              onChange={(event) => setStartYear(Number(event.target.value) || 1900)}
            />
          </label>
          <label>
            <span>Год окончания</span>
            <input name="end_year" type="number" min={1900} max={2000} defaultValue={initialValues?.endYear ?? ""} />
          </label>
          <label>
            <span>Точность даты *</span>
            <select name="date_precision" defaultValue={initialValues?.datePrecision ?? "year"} required>
              <option value="year">Год</option>
              <option value="range">Диапазон лет</option>
              <option value="unknown">Приблизительно</option>
            </select>
          </label>
          <label>
            <span>Категория *</span>
            <select name="category" defaultValue={initialValues?.category ?? "politics"} required>
              <option value="politics">Политика</option>
              <option value="war">Войны и конфликты</option>
              <option value="society">Общество</option>
              <option value="economy">Экономика</option>
              <option value="culture">Культура</option>
              <option value="science">Наука и технологии</option>
            </select>
          </label>
        </div>
        <div className="admin-form-grid admin-form-grid-languages">
          <label>
            <span>Историческое значение на русском *</span>
            <textarea name="significance_ru" required rows={4} defaultValue={initialValues?.significanceRu} />
          </label>
          <label>
            <span>Қазақша тарихи маңызы *</span>
            <textarea name="significance_kk" required rows={4} defaultValue={initialValues?.significanceKk} />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend><span>03</span> Источник</legend>
        <p className="admin-form-intro">Каждое событие должно опираться на проверяемый источник.</p>
        <div className="admin-form-grid admin-form-grid-source">
          <label className="admin-field-wide">
            <span>Название источника *</span>
            <input name="source_title" required maxLength={240} defaultValue={initialValues?.sourceTitle} />
          </label>
          <label className="admin-field-wide">
            <span>Ссылка на источник *</span>
            <input name="source_url" type="url" required placeholder="https://" defaultValue={initialValues?.sourceUrl} />
          </label>
          <label>
            <span>Автор</span>
            <input name="source_author" maxLength={180} defaultValue={initialValues?.sourceAuthor} />
          </label>
          <label>
            <span>Издатель</span>
            <input name="source_publisher" maxLength={180} defaultValue={initialValues?.sourcePublisher} />
          </label>
          <label>
            <span>Лицензия *</span>
            <input name="source_license" required maxLength={120} defaultValue={initialValues?.sourceLicense} />
          </label>
        </div>
      </fieldset>

      {initialValues ? (
        <fieldset className="admin-form-section">
          <legend><span>04</span> Место на карте</legend>
          <p className="admin-form-intro">Нажмите на карту или перетащите маркер. Исторические границы соответствуют году начала события.</p>
          <div className="admin-form-grid admin-form-grid-location">
            <label>
              <span>Название места на русском *</span>
              <input name="location_ru" required maxLength={180} defaultValue={initialValues.locationRu} />
            </label>
            <label>
              <span>Қазақша жер атауы *</span>
              <input name="location_kk" required maxLength={180} defaultValue={initialValues.locationKk} />
            </label>
            <label>
              <span>Точность местоположения *</span>
              <select name="location_precision" defaultValue={initialValues.locationPrecision} required>
                <option value="point">Точная точка</option>
                <option value="approximate">Приблизительно</option>
              </select>
            </label>
          </div>
          <EventLocationPicker
            initialLongitude={initialValues.longitude}
            initialLatitude={initialValues.latitude}
            mapLayers={mapLayers}
            year={startYear}
          />
        </fieldset>
      ) : null}

      <div className="admin-form-footer">
        <p>{editing ? "Изменения останутся в черновике и не появятся на публичной карте." : "Событие сохранится как черновик. Место на карте задаётся на следующем шаге."}</p>
        <button type="submit" disabled={pending}>{pending ? "Сохранение…" : editing ? "Сохранить изменения" : "Сохранить черновик"}</button>
      </div>
    </form>
  );
}
