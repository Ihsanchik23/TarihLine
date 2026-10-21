"use client";

import { useActionState } from "react";
import { importCsv, type ImportState } from "@/app/admin/(protected)/import/actions";

const initialState: ImportState = {
  error: null,
  imported: 0,
  rejected: 0,
  jobId: null,
};

export function CsvImportForm() {
  const [state, action, pending] = useActionState(importCsv, initialState);

  return (
    <form action={action} className="admin-import-form">
      <div className="admin-import-dropzone">
        <label htmlFor="csv-file">CSV-файл</label>
        <input id="csv-file" name="file" type="file" accept=".csv,text/csv" required />
        <p>До 100 строк и 900 КБ. Поддерживаются запятая, точка с запятой и табуляция.</p>
      </div>
      {state.error ? <div className="admin-error" role="alert">{state.error}</div> : null}
      {state.jobId ? (
        <div className="admin-success" role="status">
          Добавлено: {state.imported}. Отклонено: {state.rejected}.
        </div>
      ) : null}
      <button className="admin-submit" type="submit" disabled={pending}>
        {pending ? "Импорт выполняется…" : "Импортировать и опубликовать"}
      </button>
    </form>
  );
}
