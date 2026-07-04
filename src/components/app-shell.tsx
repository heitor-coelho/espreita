import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { LogOut } from "lucide-react";
import { BottomNav } from "./bottom-nav";

export function AppShell({
  oficinaNome,
  children,
}: {
  oficinaNome: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border border-t-2 border-t-accent bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between md:max-w-4xl">
          <span className="text-sm font-medium text-ink">{oficinaNome}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" aria-label="Sair" className="text-ink-faint">
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 md:max-w-4xl">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
