"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";

const schemaCadastro = z.object({
  nomeOficina: z.string().trim().min(1, "Informe o nome da oficina"),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().max(2).optional(),
  nomeDono: z.string().trim().min(1, "Informe seu nome"),
  telefone: z.string().trim().min(8, "Telefone inválido"),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

// Rota pública (ver src/proxy.ts) — qualquer um com o link pode criar uma
// oficina nova. Não tem convite/código porque, nesta fase, o objetivo é
// deixar fácil pra você mandar o link direto pra um mecânico testar sozinho.
export async function cadastrarOficina(formData: FormData) {
  const dadosBrutos = {
    nomeOficina: formData.get("nomeOficina"),
    cidade: formData.get("cidade"),
    estado: formData.get("estado"),
    nomeDono: formData.get("nomeDono"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  };

  const resultado = schemaCadastro.safeParse(dadosBrutos);
  if (!resultado.success) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(resultado.error.issues[0]?.message ?? "Confira os dados e tente de novo.")}`,
    );
  }
  const dados = resultado.data;

  const telefoneExiste = await prisma.usuario.findUnique({
    where: { telefone: dados.telefone },
    select: { id: true },
  });
  if (telefoneExiste) {
    redirect(
      `/cadastro?erro=${encodeURIComponent("Já existe uma conta com esse telefone. Tente entrar em vez de cadastrar.")}`,
    );
  }

  const senhaHash = await hashPassword(dados.senha);

  await prisma.oficina.create({
    data: {
      nome: dados.nomeOficina,
      cidade: dados.cidade || undefined,
      estado: dados.estado || undefined,
      usuarios: {
        create: {
          nome: dados.nomeDono,
          telefone: dados.telefone,
          email: dados.email || undefined,
          senhaHash,
          papel: "DONO",
        },
      },
    },
  });

  // Loga automaticamente — quem acabou de cadastrar não deveria precisar
  // preencher telefone/senha de novo na tela de login.
  try {
    await signIn("credentials", {
      telefone: dados.telefone,
      senha: dados.senha,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Não deveria acontecer (acabamos de criar essa conta), mas por
      // segurança manda pro login em vez de estourar erro pro usuário.
      redirect("/login");
    }
    throw error;
  }
}
