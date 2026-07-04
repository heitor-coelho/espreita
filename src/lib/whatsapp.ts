// Assume DDD + número (10/11 dígitos), sem código do país — heurística
// simples pra v1, sem normalização formal de telefone ainda.
export function montarLinkWhatsapp(telefone: string, mensagem: string): string {
  const telefoneLimpo = telefone.replace(/\D/g, "");
  return `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
}
