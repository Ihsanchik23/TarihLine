"use client";

import { useActionState } from "react";
import { createPersonDraft, type PersonFormState } from "@/app/admin/(protected)/people/actions";

const initialState: PersonFormState = { error: null };

export function PersonForm() {
  const [state, action, pending] = useActionState(createPersonDraft, initialState);
  return <form className="admin-editor-form" action={action}>
    {state.error ? <div className="admin-alert" role="alert">{state.error}</div> : null}
    <fieldset className="admin-form-section"><legend><span>01</span> Основные данные</legend><div className="admin-form-grid admin-form-grid-languages">
      <label><span>Имя на русском *</span><input name="title_ru" required /></label><label><span>Қазақша аты *</span><input name="title_kk" required /></label>
      <label><span>Кратко на русском *</span><textarea name="summary_ru" rows={3} required /></label><label><span>Қазақша қысқаша *</span><textarea name="summary_kk" rows={3} required /></label>
      <label><span>Биография на русском *</span><textarea name="biography_ru" rows={8} required /></label><label><span>Қазақша өмірбаян *</span><textarea name="biography_kk" rows={8} required /></label>
    </div></fieldset>
    <fieldset className="admin-form-section"><legend><span>02</span> Жизнь и деятельность</legend><div className="admin-form-grid admin-form-grid-period">
      <label><span>Год рождения *</span><input name="birth_year" type="number" min="1800" max="2000" required /></label><label><span>Год смерти</span><input name="death_year" type="number" min="1800" max="2026" /></label>
      <label><span>Категория *</span><select name="category" defaultValue="politics"><option value="politics">Политика</option><option value="war">Военное дело</option><option value="culture">Культура</option><option value="science">Наука</option><option value="society">Общество</option><option value="economy">Экономика</option></select></label>
    </div><div className="admin-form-grid admin-form-grid-languages"><label><span>Род деятельности *</span><input name="occupation_ru" required /></label><label><span>Қызмет саласы *</span><input name="occupation_kk" required /></label></div></fieldset>
    <fieldset className="admin-form-section"><legend><span>03</span> Источник</legend><div className="admin-form-grid admin-form-grid-source">
      <label className="admin-field-wide"><span>Название *</span><input name="source_title" required /></label><label className="admin-field-wide"><span>Ссылка *</span><input name="source_url" type="url" required /></label>
      <label><span>Автор</span><input name="source_author" /></label><label><span>Издатель</span><input name="source_publisher" /></label><label><span>Лицензия *</span><input name="source_license" required /></label>
    </div></fieldset>
    <div className="admin-form-footer"><p>Личность сохранится как скрытый черновик.</p><button disabled={pending}>{pending ? "Сохранение…" : "Сохранить черновик"}</button></div>
  </form>;
}
