"use client";

import { useState } from "react";
import type { StatusAgendamento } from "@prisma/client";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AgendamentoCardConteudo } from "@/components/agendamento-card";
import { reordenarFila } from "@/app/actions/agendamentos";

type AgendamentoFila = {
  id: string;
  status: StatusAgendamento;
  dataHora: Date;
  problemaRelatado: string | null;
  cliente: { nome: string; telefone: string | null };
  veiculo: { marca: string | null; modelo: string | null; placa: string | null };
  temNovidade: boolean;
};

// Provisório: os dois modos de reordenar convivem aqui pra comparar na
// prática antes de decidir qual fica. Depois de escolhido, remove o toggle
// e o modo perdedor.
export function FilaAgendamentos({
  agendamentos,
  chavePixOficina,
  nomeOficina,
  cidadeOficina,
}: {
  agendamentos: AgendamentoFila[];
  chavePixOficina: string | null;
  nomeOficina: string;
  cidadeOficina: string | null;
}) {
  const [ordem, setOrdem] = useState(agendamentos.map((a) => a.id));
  const [modo, setModo] = useState<"botoes" | "arrastar">("botoes");
  const porId = new Map(agendamentos.map((a) => [a.id, a]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function persistir(novaOrdem: string[]) {
    setOrdem(novaOrdem);
    reordenarFila(novaOrdem);
  }

  function mover(id: string, direcao: -1 | 1) {
    const i = ordem.indexOf(id);
    const j = i + direcao;
    if (j < 0 || j >= ordem.length) return;
    const nova = [...ordem];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    persistir(nova);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const i = ordem.indexOf(String(active.id));
    const j = ordem.indexOf(String(over.id));
    persistir(arrayMove(ordem, i, j));
  }

  if (agendamentos.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">Fila de hoje</h2>
        <div className="flex overflow-hidden rounded-lg border border-border text-[11px]">
          <button
            type="button"
            onClick={() => setModo("botoes")}
            className={`px-2 py-1 ${modo === "botoes" ? "bg-accent text-white" : "text-ink-muted"}`}
          >
            Botões
          </button>
          <button
            type="button"
            onClick={() => setModo("arrastar")}
            className={`px-2 py-1 ${modo === "arrastar" ? "bg-accent text-white" : "text-ink-muted"}`}
          >
            Arrastar
          </button>
        </div>
      </div>

      {modo === "botoes" ? (
        <ul className="space-y-3" data-testid="fila-lista">
          {ordem.map((id, indice) => {
            const ag = porId.get(id);
            if (!ag) return null;
            return (
              <li key={id} className="flex items-start gap-2">
                <div className="flex flex-none flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => mover(id, -1)}
                    disabled={indice === 0}
                    aria-label="Mover pra cima"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink-faint disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(id, 1)}
                    disabled={indice === ordem.length - 1}
                    aria-label="Mover pra baixo"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink-faint disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-3">
                  <AgendamentoCardConteudo
                    agendamento={ag}
                    temNovidade={ag.temNovidade}
                    chavePixOficina={chavePixOficina}
                    nomeOficina={nomeOficina}
                    cidadeOficina={cidadeOficina}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3" data-testid="fila-lista">
              {ordem.map((id) => {
                const ag = porId.get(id);
                if (!ag) return null;
                return (
                  <CardArrastavel key={id} id={id}>
                    <AgendamentoCardConteudo
                      agendamento={ag}
                      temNovidade={ag.temNovidade}
                      chavePixOficina={chavePixOficina}
                      nomeOficina={nomeOficina}
                      cidadeOficina={cidadeOficina}
                    />
                  </CardArrastavel>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function CardArrastavel({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar pra reordenar"
        className="flex h-10 flex-none touch-none items-center justify-center rounded-md border border-border bg-surface text-ink-faint"
        style={{ width: "1.75rem" }}
      >
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-3">
        {children}
      </div>
    </li>
  );
}
