import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { AgendamentoCard } from "@/components/agendamento-card";
import {
  inicioDaSemana,
  adicionarDias,
  paraChaveDia,
  paraDataLocal,
} from "@/lib/datas";

const DIAS_LABEL = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; dia?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const hoje = new Date();

  const inicioSemana = params.inicio
    ? inicioDaSemana(paraDataLocal(params.inicio))
    : inicioDaSemana(hoje);

  const fimSemana = adicionarDias(inicioSemana, 6);
  fimSemana.setHours(23, 59, 59, 999);

  const dias = Array.from({ length: 7 }, (_, i) =>
    adicionarDias(inicioSemana, i),
  );

  const chaveHoje = paraChaveDia(hoje);
  const chavesDaSemana = dias.map((d) => paraChaveDia(d));

  const chaveSelecionada =
    params.dia && chavesDaSemana.includes(params.dia)
      ? params.dia
      : chavesDaSemana.includes(chaveHoje)
        ? chaveHoje
        : chavesDaSemana[0];

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      oficinaId: session.user.oficinaId,
      dataHora: { gte: inicioSemana, lte: fimSemana },
    },
    include: {
      cliente: true,
      veiculo: true,
      itensRevisao: {
        where: { status: { not: "PENDENTE" }, vistoOficinaEm: null },
        select: { id: true },
      },
    },
    orderBy: { dataHora: "asc" },
  });

  const porDia = new Map<string, typeof agendamentos>();
  for (const ag of agendamentos) {
    const chave = paraChaveDia(ag.dataHora);
    porDia.set(chave, [...(porDia.get(chave) ?? []), ag]);
  }

  const semanaAnteriorHref = `/agenda?inicio=${paraChaveDia(
    adicionarDias(inicioSemana, -7),
  )}`;
  const proximaSemanaHref = `/agenda?inicio=${paraChaveDia(
    adicionarDias(inicioSemana, 7),
  )}`;

  const mesFormatado = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
  }).format(fimSemana);
  const rangeFormatado = `${inicioSemana.getDate()} a ${fimSemana.getDate()} de ${mesFormatado}`;

  const listaSelecionada = porDia.get(chaveSelecionada) ?? [];

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium text-ink">Agenda</h1>
        <div className="flex items-center gap-1 text-ink-muted">
          <Link
            href={semanaAnteriorHref}
            aria-label="Semana anterior"
            className="rounded-lg p-1.5 hover:bg-surface-2"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className="px-1 text-xs capitalize">{rangeFormatado}</span>
          <Link
            href={proximaSemanaHref}
            aria-label="Próxima semana"
            className="rounded-lg p-1.5 hover:bg-surface-2"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile: chips dos dias + lista do dia selecionado */}
      <div className="md:hidden">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {dias.map((d, i) => {
            const chave = paraChaveDia(d);
            const selecionado = chave === chaveSelecionada;
            const qtd = porDia.get(chave)?.length ?? 0;
            return (
              <Link
                key={chave}
                href={`/agenda?inicio=${paraChaveDia(inicioSemana)}&dia=${chave}`}
                className={`flex min-w-[52px] flex-col items-center rounded-xl border px-2 py-2 ${
                  selecionado
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-ink-muted"
                }`}
              >
                <span className="text-[10px] uppercase">{DIAS_LABEL[i]}</span>
                <span className="text-sm font-medium">{d.getDate()}</span>
                {qtd > 0 && (
                  <span
                    className={`mt-0.5 text-[10px] ${
                      selecionado ? "text-white" : "text-ink-faint"
                    }`}
                  >
                    {qtd}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {listaSelecionada.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
            Nenhum agendamento nesse dia.
          </p>
        ) : (
          <ul className="space-y-3">
            {listaSelecionada.map((ag) => (
              <AgendamentoCard
                key={ag.id}
                agendamento={ag}
                temNovidade={ag.itensRevisao.length > 0}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Desktop: grade da semana, todos os dias visíveis */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-3">
        {dias.map((d, i) => {
          const chave = paraChaveDia(d);
          const ehHoje = chave === chaveHoje;
          const lista = porDia.get(chave) ?? [];
          return (
            <div key={chave}>
              <div
                className={`mb-2 rounded-lg px-2 py-1.5 text-center text-xs ${
                  ehHoje ? "bg-accent text-white" : "bg-surface text-ink-muted"
                }`}
              >
                <div className="uppercase">{DIAS_LABEL[i]}</div>
                <div className="font-medium">{d.getDate()}</div>
              </div>
              <ul className="space-y-2">
                {lista.length === 0 ? (
                  <li className="px-1 text-[11px] text-ink-faint">—</li>
                ) : (
                  lista.map((ag) => (
                    <AgendamentoCard
                      key={ag.id}
                      agendamento={ag}
                      compact
                      temNovidade={ag.itensRevisao.length > 0}
                    />
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
