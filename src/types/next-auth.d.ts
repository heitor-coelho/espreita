import { DefaultSession } from "next-auth";

export type Papel = "DONO" | "FUNCIONARIO";

declare module "next-auth" {
  interface User {
    id: string;
    oficinaId: string;
    oficinaNome: string;
    papel: Papel;
  }

  interface Session {
    user: {
      id: string;
      oficinaId: string;
      oficinaNome: string;
      papel: Papel;
    } & DefaultSession["user"];
  }
}

// O callback `jwt` do Auth.js v5 tipa o token usando o `JWT` declarado em
// "@auth/core/jwt" (next-auth/jwt apenas reexporta esse módulo). Por isso
// o augmentation precisa ser feito aqui para o TypeScript reconhecer
// `token.oficinaId` / `token.papel` dentro do callback.
declare module "@auth/core/jwt" {
  interface JWT {
    oficinaId: string;
    oficinaNome: string;
    papel: Papel;
  }
}
