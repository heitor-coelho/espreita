"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrCode, Check } from "lucide-react";
import { marcarVendaPaga, cancelarVenda } from "@/app/actions/vendas";

export function VendaAcoes({ vendaId }: { vendaId: string }) {
  const router = useRouter();
  const [processando, setProcessando] = useState(false);

  async function handleMarcarPago() {
    setProcessando(true);
    await marcarVendaPaga(vendaId);
    router.refresh();
  }

  async function handleCancelar() {
    if (!confirm("Cancelar essa venda? Ela sai dos relatórios, mas fica no histórico.")) return;
    setProcessando(true);
    await cancelarVenda(vendaId);
    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={handleMarcarPago}
        disabled={processando}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <Check size={14} />
        Marcar como pago
      </button>
      <Link
        href={`/vendas/${vendaId}/pix`}
        aria-label="Cobrar via Pix"
        title="Cobrar via Pix"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border bg-surface-2 text-ink-muted"
      >
        <QrCode size={16} />
      </Link>
      <button
        type="button"
        onClick={handleCancelar}
        disabled={processando}
        aria-label="Cancelar venda"
        title="Cancelar venda"
        className="text-xs text-ink-faint underline disabled:opacity-50"
      >
        cancelar
      </button>
    </div>
  );
}
