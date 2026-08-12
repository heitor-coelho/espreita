/**
 * Helpers de data para a Agenda semanal.
 * Tudo em horário local (sem conversão UTC), pra ficar consistente com o
 * resto do app (ex.: inicioFimDoDia na tela Hoje).
 */

export function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function inicioDoMes(data: Date): Date {
  const d = new Date(data);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  const diaSemana = d.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sábado
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + deslocamento);
  return d;
}

export function adicionarDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

export function paraChaveDia(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function paraDataLocal(chave: string): Date {
  const [ano, mes, dia] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}
