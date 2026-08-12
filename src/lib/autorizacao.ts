import type { Papel } from "@/types/next-auth";

// Lança erro em vez de usar redirect() — algumas actions daqui são chamadas
// via try/catch no client (não `<form action>` nativo), e redirect() dentro
// de um try/catch do client pode ser engolido em vez de navegar. Middleware
// (src/proxy.ts) já bloqueia a rota antes; isso aqui é defesa em profundidade.
export function exigirDono(papel: Papel) {
  if (papel !== "DONO") {
    throw new Error("Acesso restrito ao dono da oficina.");
  }
}
