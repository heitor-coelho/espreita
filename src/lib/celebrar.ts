"use client";

// Pequeno toast de comemoração ao concluir um atendimento — pensado pra
// quem vive o dia a dia da fila (o funcionário), pra fechar uma demanda
// dar aquela sensação boa de "consegui". Fica fora da árvore do React de
// propósito: o servidor revalida a página logo depois de concluir, então
// um toast controlado por estado do React seria desmontado antes de o
// usuário ter tempo de ver.
const MENSAGENS = [
  "Boa! Mais um resolvido 🔧",
  "Show, cliente vai adorar 🚗",
  "Isso aí, detonou 💪",
  "Ótimo trabalho! ✅",
  "Mandou bem nesse atendimento 🎉",
  "Show de bola! 🙌",
  "Na régua! 🏁",
];

let toastAtual: HTMLDivElement | null = null;

export function celebrarAtendimentoConcluido() {
  if (typeof document === "undefined") return;

  toastAtual?.remove();

  const mensagem = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
  const toast = document.createElement("div");
  toast.className = "celebracao-toast";
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  toastAtual = toast;

  // Reflow forçado antes de ligar a transição, senão o navegador junta o
  // estado inicial e final numa coisa só (sem animar a entrada).
  requestAnimationFrame(() => {
    toast.classList.add("celebracao-toast-visivel");
  });

  setTimeout(() => {
    toast.classList.remove("celebracao-toast-visivel");
    setTimeout(() => {
      toast.remove();
      if (toastAtual === toast) toastAtual = null;
    }, 300);
  }, 2200);
}
