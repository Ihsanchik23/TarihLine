import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("historical_records").select("id,title_ru,title_kk,status,category,person_details(birth_year,death_year,occupation_ru)").eq("record_type", "person").order("created_at", { ascending: false });
  return <div className="admin-dashboard"><header className="admin-page-header"><div><span className="admin-kicker">Материалы</span><h1>Личности</h1><p>Исторические деятели, учёные и представители культуры.</p></div><Link className="admin-primary-link admin-primary-link-top" href="/admin/people/new">Добавить личность</Link></header>
    {created === "1" ? <div className="admin-success">Черновик личности сохранён</div> : null}
    {data?.length ? <section className="admin-record-list">{data.map((person) => { const detail = Array.isArray(person.person_details) ? person.person_details[0] : person.person_details; return <Link className="admin-record-row" href={`/admin/people/${person.id}`} key={person.id}><div className="admin-record-period">{detail ? `${detail.birth_year}–${detail.death_year ?? "…"}` : "—"}</div><div className="admin-record-copy"><h2>{person.title_ru}</h2><p>{person.title_kk}{detail ? ` · ${detail.occupation_ru}` : ""}</p></div><div className="admin-record-meta"><span className={`admin-record-status admin-record-status-${person.status}`}>{person.status === "draft" ? "Черновик" : person.status === "verified" ? "Проверено" : "Опубликовано"}</span></div></Link>; })}</section> : <section className="admin-empty-state"><span>ЛИЧНОСТИ</span><h2>Записей пока нет</h2><p>Добавьте первую историческую личность с биографией и источником.</p><Link className="admin-primary-link" href="/admin/people/new">Создать черновик</Link></section>}
  </div>;
}
