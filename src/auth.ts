import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        telefone: { label: "Telefone", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const telefone = credentials?.telefone as string | undefined;
        const senha = credentials?.senha as string | undefined;

        if (!telefone || !senha) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { telefone },
          include: { oficina: true },
        });

        // usuario.ativo: a própria oficina desativou esse funcionário.
        // usuario.oficina.ativa: o vendedor do app suspendeu a oficina
        // inteira (ex.: cliente inadimplente) — bloqueia todo mundo dela,
        // incluindo o dono, mesmo com a senha certa.
        if (!usuario || !usuario.ativo || !usuario.oficina.ativa) return null;

        const senhaValida = await comparePassword(senha, usuario.senhaHash);
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          oficinaId: usuario.oficinaId,
          oficinaNome: usuario.oficina.nome,
          papel: usuario.papel,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.oficinaId = user.oficinaId;
        token.oficinaNome = user.oficinaNome;
        token.papel = user.papel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.oficinaId = token.oficinaId;
        session.user.oficinaNome = token.oficinaNome;
        session.user.papel = token.papel;
      }
      return session;
    },
  },
});
