"use client";

import { useActionState } from "react";
import {
  changeEventStatus,
  type EventWorkflowState,
} from "@/app/admin/(protected)/events/actions";

const initialState: EventWorkflowState = { error: null };

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  verified: "Проверено",
  published: "Опубликовано",
};

type EventWorkflowProps = {
  recordId: string;
  status: string;
  readyForReview: boolean;
};

export function EventWorkflow({ recordId, status, readyForReview }: EventWorkflowProps) {
  const [state, action, pending] = useActionState(changeEventStatus, initialState);

  return (
    <section className={`admin-workflow admin-workflow-${status}`} aria-label="Публикация события">
      <div className="admin-workflow-copy">
        <span>Статус</span>
        <strong>{statusLabels[status] ?? status}</strong>
        <p>
          {status === "draft"
            ? readyForReview
              ? "Данные заполнены. После проверки редактирование будет заблокировано."
              : "Сначала сохраните названия места и точку на карте."
            : status === "verified"
              ? "Материал проверен и готов к публикации на общей карте."
              : "Событие доступно посетителям и отображается на карте в своём периоде."}
        </p>
      </div>
      <form action={action} className="admin-workflow-actions">
        <input name="record_id" type="hidden" value={recordId} />
        {status === "draft" ? (
          <button name="target_status" value="verified" type="submit" disabled={pending || !readyForReview}>
            {pending ? "Проверка…" : "Подтвердить данные"}
          </button>
        ) : null}
        {status === "verified" ? (
          <>
            <button className="admin-workflow-secondary" name="target_status" value="draft" type="submit" disabled={pending}>
              Вернуть в черновик
            </button>
            <button name="target_status" value="published" type="submit" disabled={pending}>
              {pending ? "Публикация…" : "Опубликовать"}
            </button>
          </>
        ) : null}
        {status === "published" ? (
          <button className="admin-workflow-secondary" name="target_status" value="verified" type="submit" disabled={pending}>
            {pending ? "Обновление…" : "Снять с публикации"}
          </button>
        ) : null}
      </form>
      {state.error ? <div className="admin-workflow-error" role="alert">{state.error}</div> : null}
    </section>
  );
}
