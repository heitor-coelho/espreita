import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/auth";
import { LogOut, Settings } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { NotificacoesToggle } from "./notificacoes-toggle";
import type { Papel } from "@/types/next-auth";

export function AppShell({
  oficinaNome,
  papel,
  children,
}: {
  oficinaNome: string;
  papel: Papel;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border border-t-2 border-t-accent bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between md:max-w-4xl">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <Image
              src="/icon.svg"
              alt=""
              width={24}
              height={24}
              className="rounded-md"
            />
            {oficinaNome}
          </span>
          <div className="flex items-center gap-3">
            {papel === "DONO" && (
              <Link
                href="/admin"
                aria-label="Administração"
                title="Administração"
                className="text-ink-faint"
              >
                <Settings size={18} strokeWidth={1.75} />
              </Link>
            )}
            <NotificacoesToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                aria-label="Sair"
                className="text-ink-faint"
              >
                <LogOut size={18} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 md:max-w-4xl">
        {children}
      </main>

      <BottomNav papel={papel} />
    </div>
  );
}
