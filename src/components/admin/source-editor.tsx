"use client";

import { useActionState } from "react";
import { deleteSource, linkSourceToRecord, updateSource, type SourceActionState } from "@/app/admin/(protected)/sources/actions";

const initialState: SourceActionState = { error: null };

export type SourceEditorValues = {
  id: string;
  title: string;
  url: string;
  author: string;
  publisher: string;
  license: string;
  notes: string;
};

type DraftRecord = { id: string; title: string; type: string };

export function SourceEditor({ source, draftRecords, usageCount }: { source: SourceEditorValues; draftRecords: DraftRecord[]; usageCount: number }) {
  const [updateState, updateAction, updatePending] = useActionState(updateSource, initialState);
  const [linkState, linkAction, linkPending] = useActionState(linkSourceToRecord, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSource, initialState);
  return <>
    <form className="admin-editor-form admin-source-editor" action={updateAction}>
      <input name="source_id" type="hidden" value={source.id} />
      {updateState.error ? <div className="admin-alert" role="alert">{updateState.error}</div> : null}
      <fieldset className="admin-form-section"><legend><span>01</span> Библиографические данные</legend><div className="admin-form-grid admin-form-grid-source">
        <label className="admin-field-wide"><span>Название *</span><input name="title" required maxLength={240} defaultValue={source.title} /></label>
        <label className="admin-field-wide"><span>Ссылка</span><input name="url" type="url" placeholder="https://" defaultValue={source.url} /></label>
        <label><span>Автор</span><input name="author" maxLength={180} defaultValue={source.author} /></label>
        <label><span>Издатель</span><input name="publisher" maxLength={180} defaultValue={source.publisher} /></label>
        <label><span>Лицензия</span><input name="license" maxLength={120} defaultValue={source.license} /></label>
        <label className="admin-field-wide"><span>Примечания</span><textarea name="notes" rows={4} defaultValue={source.notes} /></label>
      </div></fieldset>
      <div className="admin-form-footer"><p>Изменения отразятся во всех связанных материалах.</p><button type="submit" disabled={updatePending}>{updatePending ? "Сохранение…" : "Сохранить изменения"}</button></div>
    </form>
    <section className="admin-source-action-card"><div><span className="admin-kicker">Повторное использование</span><h2>Добавить к черновику</h2><p>Один проверенный источник можно связать с несколькими историческими материалами.</p></div>
      {draftRecords.length ? <form action={linkAction} className="admin-source-link-form"><input name="source_id" type="hidden" value={source.id} /><select name="record_id" required defaultValue=""><option value="" disabled>Выберите материал</option>{draftRecords.map((record) => <option value={record.id} key={record.id}>{record.type === "event" ? "Событие" : "Личность"}: {record.title}</option>)}</select><button disabled={linkPending}>{linkPending ? "Добавление…" : "Добавить источник"}</button></form> : <p className="admin-source-empty-note">Нет доступных черновиков без этого источника.</p>}
      {linkState.error ? <div className="admin-alert" role="alert">{linkState.error}</div> : null}
    </section>
    <section className="admin-source-danger"><div><h2>Удаление источника</h2><p>{usageCount ? `Источник используется в ${usageCount} связях и защищён от удаления.` : "Источник нигде не используется и может быть удалён."}</p></div><form action={deleteAction}><input name="source_id" type="hidden" value={source.id} /><button type="submit" disabled={deletePending || usageCount > 0}>{deletePending ? "Удаление…" : "Удалить источник"}</button></form>{deleteState.error ? <div className="admin-alert" role="alert">{deleteState.error}</div> : null}</section>
  </>;
}
