"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Обзор", number: "01" },
  { href: "/admin/events", label: "События", number: "02" },
  { href: "/admin/people", label: "Личности", number: "03" },
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
      <span className="admin-nav-link admin-nav-link-muted">
        <span>Источники</span>
        <span>04</span>
      </span>
    </nav>
  );
}
