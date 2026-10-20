import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { login } from "./actions";
import "../admin.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const admin = await getAdminSession();
  if (admin) redirect("/admin");

  const { error } = await searchParams;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-brand" href="/" aria-label="TarihLine">
          <span className="admin-brand-mark">T</span>
          <span>TarihLine</span>
        </Link>
        <div className="admin-login-heading">
          <span className="admin-kicker">Управление контентом</span>
          <h1>Вход для администратора</h1>
          <p>Доступ открыт только для назначенных администраторов проекта.</p>
        </div>
        {error ? <div className="admin-alert" role="alert">{error}</div> : null}
        <form className="admin-login-form" action={login}>
          <label>
            <span>Электронная почта</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Пароль</span>
            <input name="password" type="password" autoComplete="current-password" minLength={8} required />
          </label>
          <button type="submit">Войти</button>
        </form>
        <Link className="admin-back-link" href="/">Вернуться к карте</Link>
      </section>
    </main>
  );
}
