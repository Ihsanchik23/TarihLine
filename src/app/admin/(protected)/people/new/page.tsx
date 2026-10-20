import Link from "next/link";
import { PersonForm } from "@/components/admin/person-form";

export default function NewPersonPage() {
  return <div className="admin-dashboard admin-editor-page"><header className="admin-page-header"><div><span className="admin-kicker">Новый материал</span><h1>Добавление личности</h1><p>Заполните двуязычную биографию, годы жизни и источник.</p></div><Link className="admin-map-link" href="/admin/people">Отменить</Link></header><PersonForm /></div>;
}
