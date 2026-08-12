import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão de Oficina",
  description: "Agendamentos, clientes, veículos e vendas para sua oficina.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

// Cor da barra do navegador/status bar quando instalado como app —
// combina com o fundo do tema (src/app/globals.css).
export const viewport: Viewport = {
  themeColor: "#14141a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
