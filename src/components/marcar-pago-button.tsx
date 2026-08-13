"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { marcarVendaPaga } from "@/app/actions/vendas";

export function MarcarPagoButton({ vendaId }: { vendaId: string }) {
  const router = useRouter();
  const [processando, setProcessando] = useState(false);

  async function handleClick() {
    setProcessando(true);
    await marcarVendaPaga(vendaId);
    router.push("/vendas");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={processando}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 py-3 text-sm font-semibold text-ink disabled:opacity-50"
    >
      <Check size={16} />
      {processando ? "Marcando..." : "Já recebi — marcar como pago"}
    </button>
  );
}
