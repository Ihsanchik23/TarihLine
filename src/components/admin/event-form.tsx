"use client";

import { useActionState } from "react";
import { createEventDraft, type EventFormState } from "@/app/admin/(protected)/events/actions";

const initialState: EventFormState = { error: null };

export function EventForm() {
  const [state, action, pending] = useActionState(createEventDraft, initialState);

  return (
    <form className="admin-editor-form" action={action}>
      {state.error ? <div className="admin-alert" role="alert">{state.error}</div> : null}

      <fieldset className="admin-form-section">
        <legend><span>01</span> Основные данные</legend>
        <div className="admin-form-grid admin-form-grid-languages">
          <label>
            <span>Название на русском *</span>
            <input name="title_ru" required maxLength={180} />
          </label>
          <label>
            <span>Название на казахском *</span>
            <input name="title_kk" required maxLength={180} />
          </label>
          <label>
            <span>Краткое описание на русском *</span>
            <textarea name="summary_ru" required rows={3} maxLength={500} />
          </label>
          <label>
            <span>Қазақша қысқаша сипаттама *</span>
            <textarea name="summary_kk" required rows={3} maxLength={500} />
          </label>
          <label>
            <span>Полное описание на русском *</span>
            <textarea name="description_ru" required rows={7} />
          </label>
          <label>
            <span>Қазақша толық сипаттама *</span>
            <textarea name="description_kk" required rows={7} />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend><span>02</span> Период и значение</legend>
        <div className="admin-form-grid admin-form-grid-period">
          <label>
            <span>Год начала *</span>
            <input name="start_year" type="number" min={1900} max={2000} required />
          </label>
          <label>
            <span>Год окончания</span>
            <input name="end_year" type="number" min={1900} max={2000} />
          </label>
          <label>
            <span>Точность даты *</span>
            <select name="date_precision" defaultValue="year" required>
              <option value="year">Год</option>
              <option value="range">Диапазон лет</option>
              <option value="unknown">Приблизительно</option>
            </select>
          </label>
          <label>
            <span>Категория *</span>
            <select name="category" defaultValue="politics" required>
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
            <textarea name="significance_ru" required rows={4} />
          </label>
          <label>
            <span>Қазақша тарихи маңызы *</span>
            <textarea name="significance_kk" required rows={4} />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend><span>03</span> Источник</legend>
        <p className="admin-form-intro">Черновик нельзя создать без проверяемого источника.</p>
        <div className="admin-form-grid admin-form-grid-source">
          <label className="admin-field-wide">
            <span>Название источника *</span>
            <input name="source_title" required maxLength={240} />
          </label>
          <label className="admin-field-wide">
            <span>Ссылка на источник *</span>
            <input name="source_url" type="url" required placeholder="https://" />
          </label>
          <label>
            <span>Автор</span>
            <input name="source_author" maxLength={180} />
          </label>
          <label>
            <span>Издатель</span>
            <input name="source_publisher" maxLength={180} />
          </label>
          <label>
            <span>Лицензия *</span>
            <input name="source_license" required maxLength={120} />
          </label>
        </div>
      </fieldset>

      <div className="admin-form-footer">
        <p>Событие сохранится со статусом «Черновик» и не будет видно посетителям.</p>
        <button type="submit" disabled={pending}>{pending ? "Сохранение…" : "Сохранить черновик"}</button>
      </div>
    </form>
  );
}
