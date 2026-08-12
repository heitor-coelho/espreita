"use client";

import { useRef, useState } from "react";
import { obterUrlDeUpload, criarItemRevisao } from "@/app/actions/revisoes";
import { arquivoEhVideo } from "@/lib/midia";
import { apenasDecimal } from "@/lib/numero";

type ProdutoOpcao = {
  id: string;
  nome: string;
  precoVenda: string;
  estoqueQtd: number;
};

export function NovoItemRevisaoForm({
  agendamentoId,
  produtos,
}: {
  agendamentoId: string;
  produtos: ProdutoOpcao[];
}) {
  const [produtoId, setProdutoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [midias, setMidias] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelecionarProduto(id: string) {
    setProdutoId(id);
    const produto = produtos.find((p) => p.id === id);
    if (produto) {
      setDescricao(produto.nome);
      setValor(produto.precoVenda);
    }
  }

  async function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    setErro(null);
    setEnviando(true);
    try {
      for (const arquivo of arquivos) {
        const { urlDeUpload, urlPublica } = await obterUrlDeUpload(
          arquivo.name,
          arquivo.type || "application/octet-stream",
        );
        const resposta = await fetch(urlDeUpload, {
          method: "PUT",
          body: arquivo,
          headers: { "Content-Type": arquivo.type || "application/octet-stream" },
        });
        if (!resposta.ok) throw new Error("Falha ao enviar arquivo.");
        setMidias((atual) => [...atual, urlPublica]);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSalvar() {
    setErro(null);
    if (!descricao.trim()) {
      setErro("Descreva o item encontrado.");
      return;
    }

    setEnviando(true);
    try {
      await criarItemRevisao({
        agendamentoId,
        descricao,
        valor,
        midias,
        produtoId: produtoId || undefined,
      });
      setProdutoId("");
      setDescricao("");
      setValor("");
      setMidias([]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar item.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="mb-2 text-sm font-medium text-ink">Adicionar item</p>

      {produtos.length > 0 && (
        <select
          value={produtoId}
          onChange={(e) => handleSelecionarProduto(e.target.value)}
          className="campo mb-2"
        >
          <option value="">Peça do estoque (opcional)</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} · R$ {Number(p.precoVenda).toFixed(2).replace(".", ",")}
              {" · estoque "}
              {p.estoqueQtd}
            </option>
          ))}
        </select>
      )}

      {produtoId && (
        <p className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>Vinculado ao estoque — desconta 1 unidade ao concluir</span>
          <button
            type="button"
            onClick={() => setProdutoId("")}
            className="text-ink-faint underline"
          >
            remover vínculo
          </button>
        </p>
      )}

      <input
        type="text"
        placeholder="O que foi encontrado? Ex.: Pastilha de freio dianteira"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className="campo mb-2"
      />

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-ink-muted">R$</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00 (opcional)"
          value={valor}
          onChange={(e) => setValor(apenasDecimal(e.target.value))}
          className="campo"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleArquivos}
        className="mb-2 block w-full text-xs text-ink-muted"
      />

      {midias.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {midias.map((url) =>
            arquivoEhVideo(url) ? (
              <video
                key={url}
                src={url}
                muted
                className="h-12 w-12 flex-none rounded-lg object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-12 w-12 flex-none rounded-lg object-cover"
              />
            ),
          )}
        </div>
      )}

      {erro && <p className="mb-2 text-xs text-danger-ink">{erro}</p>}

      <button
        type="button"
        onClick={handleSalvar}
        disabled={enviando}
        className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Adicionar item"}
      </button>
    </div>
  );
}
