"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TipoVeiculo } from "@prisma/client";
import { salvarVeiculo } from "@/app/actions/clientes";
import { TIPO_VEICULO_LABEL, TIPOS_VEICULO } from "@/lib/veiculo-tipo";

type VeiculoExistente = {
  id: string;
  tipo: TipoVeiculo;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  anoFabricacao: number | null;
  cor: string | null;
};

export function VeiculoForm({
  clienteId,
  veiculo,
  onFechar,
}: {
  clienteId: string;
  veiculo?: VeiculoExistente;
  onFechar?: () => void;
}) {
  const [tipo, setTipo] = useState<TipoVeiculo>(veiculo?.tipo ?? "MOTO");
  const [marca, setMarca] = useState(veiculo?.marca ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [ano, setAno] = useState(veiculo?.anoFabricacao?.toString() ?? "");
  const [cor, setCor] = useState(veiculo?.cor ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      await salvarVeiculo({
        veiculoId: veiculo?.id,
        clienteId,
        tipo,
        marca,
        modelo,
        placa,
        anoFabricacao: ano,
        cor,
      });
      onFechar?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar veículo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex gap-2">
        {TIPOS_VEICULO.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setTipo(opcao)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tipo === opcao
                ? "bg-accent text-white"
                : "bg-surface-2 text-ink-muted"
            }`}
          >
            {TIPO_VEICULO_LABEL[opcao]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="campo"
        />
        <input
          placeholder="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="campo"
        />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <input
          placeholder="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          className="campo col-span-2"
        />
        <input
          placeholder="Ano"
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="campo"
        />
      </div>

      <input
        placeholder="Cor"
        value={cor}
        onChange={(e) => setCor(e.target.value)}
        className="campo mt-2"
      />

      {erro && <p className="mt-2 text-xs text-danger-ink">{erro}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar veículo"}
        </button>
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg bg-surface-2 px-3 py-2 text-xs font-medium text-ink-muted"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function NovoVeiculoToggle({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);

  if (aberto) {
    return <VeiculoForm clienteId={clienteId} onFechar={() => setAberto(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAberto(true)}
      className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-ink-muted"
    >
      <Plus size={14} strokeWidth={2} />
      Adicionar veículo
    </button>
  );
}

export function EditarVeiculoToggle({
  clienteId,
  veiculo,
}: {
  clienteId: string;
  veiculo: VeiculoExistente;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <VeiculoForm
        clienteId={clienteId}
        veiculo={veiculo}
        onFechar={() => setEditando(false)}
      />
    );
  }

  const descricao =
    [veiculo.marca, veiculo.modelo].filter(Boolean).join(" ") ||
    "Sem marca/modelo";

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="w-full rounded-xl border border-border bg-surface p-3 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink">{descricao}</span>
        <span className="text-[11px] text-ink-faint">
          {TIPO_VEICULO_LABEL[veiculo.tipo]}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        {[veiculo.placa, veiculo.cor, veiculo.anoFabricacao?.toString()]
          .filter(Boolean)
          .join(" · ") || "Toque pra completar os dados"}
      </p>
    </button>
  );
}
