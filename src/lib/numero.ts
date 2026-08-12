/**
 * Sanitizadores pros campos numéricos digitados em formulário.
 *
 * `<input type="number" step="1">` sozinho não impede digitar "3.7" — o
 * navegador só invalida no submit. Como os formulários daqui são
 * controlados via useState (não usam <form action> nativo), filtramos o
 * valor a cada tecla: campos que representam quantidade/estoque ficam
 * travados em inteiro, campos de dinheiro aceitam só um separador decimal.
 */

export function apenasInteiro(valor: string): string {
  return valor.replace(/[^0-9]/g, "");
}

export function apenasDecimal(valor: string): string {
  const limpo = valor.replace(/[^0-9.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  if (resto.length === 0) return inteiro;
  return `${inteiro}.${resto.join("")}`;
}
