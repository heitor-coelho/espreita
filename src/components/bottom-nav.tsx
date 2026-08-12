"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Users, ShoppingCart } from "lucide-react";
import type { Papel } from "@/types/next-auth";

const ITEMS = [
  { href: "/", label: "Hoje", Icon: CalendarCheck, donoOnly: false },
  { href: "/agenda", label: "Agenda", Icon: CalendarDays, donoOnly: false },
  { href: "/clientes", label: "Clientes", Icon: Users, donoOnly: true },
  { href: "/vendas", label: "Vendas", Icon: ShoppingCart, donoOnly: true },
];

export function BottomNav({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.donoOnly || papel === "DONO");

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
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
