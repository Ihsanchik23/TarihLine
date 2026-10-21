"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Обзор", number: "01" },
  { href: "/admin/events", label: "События", number: "02" },
  { href: "/admin/people", label: "Личности", number: "03" },
  { href: "/admin/sources", label: "Источники", number: "04" },
  { href: "/admin/import", label: "Импорт", number: "05" },
  { href: "/admin/maps", label: "Карта", number: "06" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Разделы админ-панели">
      {links.map((link) => {
        const active = link.href === "/admin"
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            className={`admin-nav-link${active ? " admin-nav-link-active" : ""}`}
            href={link.href}
            key={link.href}
          >
            <span>{link.label}</span>
            <span>{link.number}</span>
          </Link>
        );
      })}
    </nav>
  );
}
