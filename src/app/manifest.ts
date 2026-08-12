import type { MetadataRoute } from "next";

// Next.js serve isso automaticamente em /manifest.webmanifest e já injeta
// o <link rel="manifest"> no <head> — não precisa mexer em layout.tsx.
// É o que permite "Adicionar à tela inicial" no celular e abrir como app
// (sem loja de aplicativo), reforçando o discurso de "app mobile" que os
// concorrentes anunciam.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão de Oficina",
    short_name: "Oficina",
    description: "Agendamentos, clientes, veículos e vendas para sua oficina.",
    start_url: "/",
    display: "standalone",
    background_color: "#14141a",
    theme_color: "#14141a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
