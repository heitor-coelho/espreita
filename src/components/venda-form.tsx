"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { registrarVenda } from "@/app/actions/vendas";
import { apenasInteiro } from "@/lib/numero";

type ProdutoDisponivel = {
  id: string;
  nome: string;
  precoVenda: string;
  estoqueQtd: number;
  unidade: string | null;
};

type ClienteOpcao = {
  id: string;
  nome: string;
  telefone: string | null;
};

type LinhaItem = {
  produtoId: string;
  quantidade: string;
};

export function VendaForm({
  produtos,
  clientes,
}: {
  produtos: ProdutoDisponivel[];
  clientes: ClienteOpcao[];
}) {
  const router = useRouter();

  const [clienteId, setClienteId] = useState("");
  const [linhas, setLinhas] = useState<LinhaItem[]>([
    { produtoId: "", quantidade: "1" },
  ]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const produtosPorId = useMemo(
    () => new Map(produtos.map((p) => [p.id, p])),
    [produtos],
  );

  const total = linhas.reduce((soma, linha) => {
    const produto = produtosPorId.get(linha.produtoId);
    const qtd = Number(linha.quantidade) || 0;
    return soma + (produto ? Number(produto.precoVenda) * qtd : 0);
  }, 0);

  function adicionarLinha() {
    setLinhas((atual) => [...atual, { produtoId: "", quantidade: "1" }]);
  }

  function removerLinha(index: number) {
    setLinhas((atual) => atual.filter((_, i) => i !== index));
  }

  function atualizarLinha(index: number, mudanca: Partial<LinhaItem>) {
    setLinhas((atual) =>
      atual.map((linha, i) => (i === index ? { ...linha, ...mudanca } : linha)),
    );
  }

  // Cada peça só pode ser escolhida em uma linha por vez, pra não precisar
  // somar quantidades de linhas repetidas na hora de conferir estoque.
  function produtosParaLinha(index: number) {
    const escolhidosEmOutras = new Set(
      linhas
        .filter((_, i) => i !== index)
        .map((l) => l.produtoId)
        .filter(Boolean),
    );
    return produtos.filter((p) => !escolhidosEmOutras.has(p.id));
  }

  async function handleSalvar() {
    setErro(null);

    const itens = linhas
      .filter((l) => l.produtoId)
      .map((l) => ({
        produtoId: l.produtoId,
        quantidade: Number(l.quantidade) || 0,
      }));

    if (itens.length === 0) {
      setErro("Adicione pelo menos uma peça.");
      return;
    }
    if (itens.some((i) => i.quantidade < 1)) {
      setErro("Quantidade precisa ser pelo menos 1.");
      return;
    }

    setSalvando(true);

    const formData = new FormData();
    formData.set("clienteId", clienteId);
    formData.set("itens", JSON.stringify(itens));

    try {
      await registrarVenda(formData);
      router.push("/vendas");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar venda.");
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">
          Cliente (opcional)
        </span>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="campo"
        >
          <option value="">Venda avulsa, sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.telefone ? ` · ${c.telefone}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="block text-xs font-medium text-ink-muted">
          Peças vendidas
        </span>

        {linhas.map((linha, index) => {
          const opcoes = produtosParaLinha(index);
          const produto = produtosPorId.get(linha.produtoId);
          const semEstoque =
            produto && Number(linha.quantidade) > produto.estoqueQtd;

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-faint">
                  Peça {index + 1}
                </span>
                {linhas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerLinha(index)}
                    aria-label="Remover peça"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-danger-ink"
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={linha.produtoId}
                  onChange={(e) =>
                    atualizarLinha(index, { produtoId: e.target.value })
                  }
                  className="campo min-w-0 flex-1"
                >
                  <option value="">Selecione a peça</option>
                  {opcoes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} · R$ {Number(p.precoVenda).toFixed(2).replace(".", ",")}
                      {" · estoque "}
                      {p.estoqueQtd}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={linha.quantidade}
                  onChange={(e) =>
                    atualizarLinha(index, {
                      quantidade: apenasInteiro(e.target.value),
                    })
                  }
                  className="campo w-14 shrink-0 text-center"
                />
              </div>
              {semEstoque && (
                <p className="mt-1.5 text-xs text-danger-ink">
                  Estoque disponível: {produto?.estoqueQtd}
                  {produto?.unidade ? ` ${produto.unidade}` : ""}
                </p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={adicionarLinha}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent hover:text-ink"
        >
          <Plus size={14} strokeWidth={2} />
          Adicionar peça
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
        <span className="text-sm font-medium text-ink-muted">Total</span>
        <span className="text-lg font-semibold text-ink">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>

      {erro && <p className="text-xs text-danger-ink">{erro}</p>}

      <button
        type="button"
        onClick={handleSalvar}
        disabled={salvando}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {salvando ? "Registrando..." : "Registrar venda"}
      </button>
    </div>
  );
}
