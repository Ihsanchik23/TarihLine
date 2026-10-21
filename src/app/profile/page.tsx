import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getHistoryData } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { deleteNote, logout, toggleBookmark, updateProfile } from "./actions";
import "./profile.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Личный профиль — TarihLine",
  description: "Профиль и избранные исторические материалы TarihLine",
};

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth?next=/profile");

  const [profileResult, bookmarksResult, notesResult, roleResult, history, params] = await Promise.all([
    supabase.from("profiles").select("display_name, username, preferred_language, created_at").eq("id", userId).maybeSingle(),
    supabase.from("bookmarks").select("record_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("notes").select("id, record_id, title, content, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    getHistoryData(),
    searchParams,
  ]);

  const email = typeof claimsData.claims.email === "string" ? claimsData.claims.email : "";
  const profile = profileResult.data;
  const displayName = profile?.display_name || email.split("@")[0] || "Пользователь";
  const bookmarkedIds = new Set((bookmarksResult.data ?? []).map((item) => item.record_id));
  const favorites = history.records.filter((record) => bookmarkedIds.has(record.id));
  const notes = (notesResult.data ?? []).map((note) => ({ note, record: history.records.find((record) => record.id === note.record_id) }));

  return <main className="profile-page">
    <header className="profile-header">
      <Link className="profile-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
      <nav aria-label="Навигация"><Link href="/">Карта</Link><Link href="/catalog">Каталог</Link><Link className="is-active" href="/profile">Профиль</Link></nav>
      <form action={logout}><button type="submit">Выйти</button></form>
    </header>

    <section className="profile-hero">
      <div className="profile-avatar">{initials(displayName)}</div>
      <div><span>Личный архив</span><h1>{displayName}</h1><p>{email}</p></div>
      <div className="profile-count"><strong>{favorites.length}</strong><span>в избранном</span></div>
    </section>

    <div className="profile-layout">
      <section className="profile-favorites">
        <div className="profile-section-heading"><span>01</span><div><h2>Избранные материалы</h2><p>События и личности, сохранённые для дальнейшего чтения.</p></div></div>
        {favorites.length ? <div className="profile-favorites__grid">{favorites.map((record) => <article key={record.id}><div><span>{record.type === "event" ? "Событие" : "Личность"}</span><strong>{record.dateLabel.ru}</strong></div><h3><Link href={`/catalog/${record.slug}`}>{record.title.ru}</Link></h3><p>{record.summary.ru}</p><div className="profile-favorite-actions"><Link href={`/catalog/${record.slug}`}>Открыть <span aria-hidden="true">→</span></Link><form action={toggleBookmark}><input name="recordId" type="hidden" value={record.id} /><input name="slug" type="hidden" value={record.slug} /><button type="submit">Убрать</button></form></div></article>)}</div> : <div className="profile-empty"><span>☆</span><h3>Избранное пока пусто</h3><p>Откройте материал в каталоге и нажмите «Добавить в избранное».</p><Link href="/catalog">Перейти в каталог</Link></div>}
        <div className="profile-notes">
          <div className="profile-section-heading"><span>02</span><div><h2>Личные заметки</h2><p>Все приватные записи к историческим материалам.</p></div></div>
          {notes.length ? <div className="profile-notes__grid">{notes.map(({ note, record }) => <article key={note.id}><div><span>{new Date(note.updated_at).toLocaleDateString("ru-RU")}</span><form action={deleteNote}><input name="noteId" type="hidden" value={note.id} /><input name="slug" type="hidden" value={record?.slug ?? "profile"} /><button type="submit">Удалить</button></form></div><h3>{note.title}</h3><p>{note.content}</p>{record ? <Link href={`/catalog/${record.slug}#notes`}>{record.title.ru}<span aria-hidden="true">→</span></Link> : null}</article>)}</div> : <div className="profile-notes__empty">Заметки, созданные на страницах материалов, появятся здесь.</div>}
        </div>
      </section>

      <aside className="profile-settings">
        <div className="profile-section-heading"><span>03</span><div><h2>Настройки</h2><p>Основные данные профиля.</p></div></div>
        {params.error ? <div className="profile-alert profile-alert--error" role="alert">{params.error}</div> : null}
        {params.message ? <div className="profile-alert" role="status">{params.message}</div> : null}
        <form action={updateProfile}>
          <label><span>Имя</span><input name="displayName" type="text" defaultValue={displayName} minLength={2} maxLength={80} required /></label>
          <label><span>Логин</span><input name="username" type="text" defaultValue={profile?.username ?? ""} minLength={3} maxLength={32} placeholder="username" /></label>
          <label><span>Язык материалов</span><select name="preferredLanguage" defaultValue={profile?.preferred_language ?? "ru"}><option value="ru">Русский</option><option value="kk">Қазақша</option></select></label>
          <label><span>Электронная почта</span><input type="email" value={email} disabled /></label>
          <button type="submit">Сохранить изменения</button>
        </form>
        {roleResult.data?.role === "admin" ? <Link className="profile-admin-link" href="/admin">Открыть панель администратора <span aria-hidden="true">→</span></Link> : null}
      </aside>
    </div>
  </main>;
}
