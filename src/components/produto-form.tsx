"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarProduto, atualizarProduto } from "@/app/actions/produtos";
import { apenasDecimal, apenasInteiro } from "@/lib/numero";

type ProdutoExistente = {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string | null;
  categoria: string | null;
  unidade: string | null;
  precoVenda: string;
  custo: string | null;
  estoqueQtd: number;
  estoqueMinimo: number;
};

export function ProdutoForm({ produto }: { produto?: ProdutoExistente }) {
  const router = useRouter();

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [codigo, setCodigo] = useState(produto?.codigo ?? "");
  const [categoria, setCategoria] = useState(produto?.categoria ?? "");
  const [unidade, setUnidade] = useState(produto?.unidade ?? "");
  const [precoVenda, setPrecoVenda] = useState(produto?.precoVenda ?? "");
  const [custo, setCusto] = useState(produto?.custo ?? "");
  const [estoqueQtd, setEstoqueQtd] = useState(
    produto ? String(produto.estoqueQtd) : "0",
  );
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    produto ? String(produto.estoqueMinimo) : "0",
  );

  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // "Salvo!" é só um pisca de confirmação — some sozinho pra não ficar
  // permanente caso o mecânico continue editando a peça.
  useEffect(() => {
    if (!salvo) return;
    const t = setTimeout(() => setSalvo(false), 2000);
    return () => clearTimeout(t);
  }, [salvo]);

  async function handleSalvar() {
    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const formData = new FormData();
    formData.set("nome", nome);
    formData.set("descricao", descricao);
    formData.set("codigo", codigo);
    formData.set("categoria", categoria);
    formData.set("unidade", unidade);
    formData.set("precoVenda", precoVenda);
    formData.set("custo", custo);
    formData.set("estoqueQtd", estoqueQtd);
    formData.set("estoqueMinimo", estoqueMinimo);

    try {
      if (produto) {
        await atualizarProduto(produto.id, formData);
        router.refresh();
        setSalvando(false);
        setSalvo(true);
      } else {
        const novo = await criarProduto(formData);
        router.push(`/admin/pecas/${novo.id}`);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar peça.");
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <Campo label="Nome">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="campo"
        />
      </Campo>

      <Campo label="Descrição">
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="campo"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-2">
        <Campo label="Código/SKU">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="campo"
          />
        </Campo>
        <Campo label="Categoria">
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="campo"
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Campo label="Valor de venda (R$)">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(apenasDecimal(e.target.value))}
            className="campo"
          />
        </Campo>
        <Campo label="Custo (R$)">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={custo}
            onChange={(e) => setCusto(apenasDecimal(e.target.value))}
            className="campo"
          />
        </Campo>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Campo label="Estoque atual">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={estoqueQtd}
            onChange={(e) => setEstoqueQtd(apenasInteiro(e.target.value))}
            className="campo"
          />
        </Campo>
        <Campo label="Estoque mínimo">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(apenasInteiro(e.target.value))}
            className="campo"
          />
        </Campo>
        <Campo label="Unidade">
          <input
            placeholder="un, litro..."
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="campo"
          />
        </Campo>
      </div>

      {erro && <p className="text-xs text-danger-ink">{erro}</p>}
      {salvo && <p className="text-xs text-badge-concluido-ink">Peça salva.</p>}

      <button
        type="button"
        onClick={handleSalvar}
        disabled={salvando || !nome.trim() || !precoVenda}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar peça"}
      </button>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
