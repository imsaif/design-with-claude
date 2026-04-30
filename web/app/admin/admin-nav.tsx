"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./admin.module.css";

const links: { href: string; label: string; hint: string }[] = [
  { href: "/admin/signups", label: "Signups", hint: "/get-started" },
  { href: "/admin/subscribers", label: "Subscribers", hint: "tokens" },
  { href: "/admin/events", label: "Events", hint: "telemetry" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={s.tabs} aria-label="Admin sections">
      {links.map(({ href, label, hint }) => {
        const isActive =
          pathname === href ||
          pathname.startsWith(`${href}/`) ||
          (href === "/admin/signups" && pathname === "/admin");
        return (
          <Link
            key={href}
            href={href}
            className={`${s.tab} ${isActive ? s.tabActive : ""}`}
          >
            <span>{label}</span>
            <span className={s.tabHint}>{hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
