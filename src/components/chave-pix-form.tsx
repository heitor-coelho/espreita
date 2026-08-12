"use client";

import { useState } from "react";
import { atualizarChavePix } from "@/app/actions/oficina";

export function ChavePixForm({
  chavePixAtual,
}: {
  chavePixAtual: string | null;
}) {
  const [chavePix, setChavePix] = useState(chavePixAtual ?? "");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar() {
    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const formData = new FormData();
    formData.set("chavePix", chavePix);

    try {
      await atualizarChavePix(formData);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">
          Chave Pix
        </span>
        <input
          value={chavePix}
          onChange={(e) => setChavePix(e.target.value)}
          placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
          className="campo"
        />
      </label>

      {erro && <p className="text-xs text-danger-ink">{erro}</p>}
      {salvo && <p className="text-xs text-badge-concluido-ink">Chave Pix salva.</p>}

      <button
        type="button"
        onClick={handleSalvar}
        disabled={salvando}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar chave Pix"}
      </button>
    </div>
  );
}
