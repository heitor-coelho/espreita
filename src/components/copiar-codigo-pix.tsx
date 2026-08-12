"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopiarCodigoPix({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="break-all rounded-lg border border-border bg-surface-2 p-3 text-[11px] text-ink-faint">
        {codigo}
      </p>
      <button
        type="button"
        onClick={handleCopiar}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white"
      >
        {copiado ? <Check size={16} /> : <Copy size={16} />}
        {copiado ? "Código copiado" : "Copiar código Pix"}
      </button>
    </div>
  );
}
