"use client";

import Link from "next/link";
import type { Language } from "@/lib/history-types";
import "./public-sidebar.css";

type Page = "map" | "catalog" | "profile" | "compare";

function SidebarIcon({ page }: { page: Page }) {
  const paths = {
    map: <><path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20Z"/><path d="M9 4v13.5M15 6.5V20"/></>,
    catalog: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    compare: <><path d="M7 4h10M7 4l3-3M7 4l3 3M17 20H7M17 20l-3-3M17 20l-3 3"/><path d="M5 8v8M19 8v8"/></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[page]}</svg>;
}

export function PublicSidebar({ active, language = "ru", onCompare }: { active: Page; language?: Language; onCompare?: () => void }) {
  const labels = language === "kk"
    ? { map: "Карта", catalog: "Каталог", profile: "Профиль", compare: "Салыстыру" }
    : { map: "Карта", catalog: "Каталог", profile: "Профиль", compare: "Сравнить" };

  const itemClass = (page: Page) => active === page ? "public-sidebar__item is-active" : "public-sidebar__item";

  return (
    <aside className="public-sidebar" aria-label={language === "kk" ? "Негізгі навигация" : "Основная навигация"}>
      <nav>
        <Link className={itemClass("map")} href="/" title={labels.map}><SidebarIcon page="map"/><span>{labels.map}</span></Link>
        <Link className={itemClass("catalog")} href="/catalog" title={labels.catalog}><SidebarIcon page="catalog"/><span>{labels.catalog}</span></Link>
        <Link className={itemClass("profile")} href="/profile" title={labels.profile}><SidebarIcon page="profile"/><span>{labels.profile}</span></Link>
        {onCompare
          ? <button className={itemClass("compare")} type="button" title={labels.compare} onClick={onCompare}><SidebarIcon page="compare"/><span>{labels.compare}</span></button>
          : <Link className={itemClass("compare")} href="/?compare=1" title={labels.compare}><SidebarIcon page="compare"/><span>{labels.compare}</span></Link>}
      </nav>
    </aside>
  );
}
