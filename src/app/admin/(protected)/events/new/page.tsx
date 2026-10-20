import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div className="admin-dashboard admin-editor-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Новый материал</span>
          <h1>Создание события</h1>
          <p>Заполните русскую и казахскую версии, период и источник.</p>
        </div>
        <Link className="admin-map-link" href="/admin/events">Отменить</Link>
      </header>
      <EventForm />
    </div>
  );
}
