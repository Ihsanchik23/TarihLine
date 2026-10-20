import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { logout } from "../actions";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand admin-brand-light" href="/admin">
          <span className="admin-brand-mark">T</span>
          <span>TarihLine</span>
        </Link>
        <AdminNav />
        <div className="admin-sidebar-footer">
          <span>{admin.email}</span>
          <form action={logout}>
            <button type="submit">Выйти</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
