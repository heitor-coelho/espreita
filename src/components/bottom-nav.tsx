"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Users, ShoppingCart } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Hoje", Icon: CalendarCheck },
  { href: "/agenda", label: "Agenda", Icon: CalendarDays },
  { href: "/clientes", label: "Clientes", Icon: Users },
  { href: "/vendas", label: "Vendas", Icon: ShoppingCart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? "text-accent-strong" : "text-ink-faint"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
