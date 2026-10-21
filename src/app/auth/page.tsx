import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSidebar } from "@/components/public-sidebar";
import { login, register } from "./actions";
import "./auth.css";

export const metadata: Metadata = {
  title: "Вход и регистрация — TarihLine",
  description: "Личный аккаунт TarihLine для избранных исторических материалов",
};

type Props = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function AuthPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/profile");

  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/profile";

  return <main className="auth-page has-public-sidebar">
    <PublicSidebar active="profile" />
    <Link className="auth-brand" href="/"><span>T</span><div><strong>TarihLine</strong><small>Қазақстан · 1900–2000</small></div></Link>
    <section className="auth-intro">
      <span>Личный архив</span>
      <h1>Сохраняйте историю для себя</h1>
      <p>Добавляйте события и личности в избранное. Все сохранённые материалы будут доступны в одном профиле.</p>
      <Link href="/catalog">Посмотреть каталог <span aria-hidden="true">→</span></Link>
    </section>
    <section className="auth-panel">
      <div className="auth-panel__heading"><span>Аккаунт TarihLine</span><h2>Вход или регистрация</h2><p>Один аккаунт для личной коллекции исторических материалов.</p></div>
      {params.error ? <div className="auth-alert auth-alert--error" role="alert">{params.error}</div> : null}
      {params.message ? <div className="auth-alert" role="status">{params.message}</div> : null}
      <div className="auth-forms">
        <form action={login}>
          <h3>Войти</h3>
          <input name="next" type="hidden" value={next} />
          <label><span>Электронная почта</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Пароль</span><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button type="submit">Войти в аккаунт</button>
        </form>
        <div className="auth-divider"><span>или</span></div>
        <form action={register}>
          <h3>Создать аккаунт</h3>
          <input name="next" type="hidden" value={next} />
          <label><span>Имя</span><input name="displayName" type="text" autoComplete="name" minLength={2} maxLength={80} required /></label>
          <label><span>Электронная почта</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Пароль</span><input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button type="submit">Зарегистрироваться</button>
        </form>
      </div>
      <p className="auth-note">После регистрации может потребоваться подтверждение электронной почты.</p>
    </section>
  </main>;
}
