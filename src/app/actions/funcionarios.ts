"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { exigirDono } from "@/lib/autorizacao";

const schemaFuncionario = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  telefone: z.string().trim().min(8, "Telefone inválido"),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

export async function criarFuncionario(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const dadosBrutos = {
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    senha: formData.get("senha"),
  };

  const resultado = schemaFuncionario.safeParse(dadosBrutos);
  if (!resultado.success) {
    redirect(
      `/admin/funcionarios/novo?erro=${encodeURIComponent(resultado.error.issues[0]?.message ?? "Confira os dados e tente de novo.")}`,
    );
  }
  const dados = resultado.data;

  const telefoneExiste = await prisma.usuario.findUnique({
    where: { telefone: dados.telefone },
    select: { id: true },
  });
  if (telefoneExiste) {
    redirect(
      `/admin/funcionarios/novo?erro=${encodeURIComponent("Já existe uma conta com esse telefone.")}`,
    );
  }

  const senhaHash = await hashPassword(dados.senha);

  await prisma.usuario.create({
    data: {
      oficinaId: session.user.oficinaId,
      nome: dados.nome,
      telefone: dados.telefone,
      senhaHash,
      papel: "FUNCIONARIO",
    },
  });

  revalidatePath("/admin/funcionarios");
  redirect("/admin/funcionarios");
}

const schemaNovaSenha = z.object({
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

// Único jeito de recuperar acesso hoje quando um funcionário esquece a
// senha: o dono redefine por aqui. (O próprio dono esquecer a senha é um
// caso à parte — sem ninguém acima dele na oficina pra resolver — ainda em
// aberto.)
export async function redefinirSenhaFuncionario(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const resultado = schemaNovaSenha.safeParse({ senha: formData.get("senha") });
  if (!resultado.success) {
    redirect(
      `/admin/funcionarios/${id}/senha?erro=${encodeURIComponent(resultado.error.issues[0]?.message ?? "Confira a senha e tente de novo.")}`,
    );
  }

  const funcionario = await prisma.usuario.findFirst({
    where: { id, oficinaId: session.user.oficinaId, papel: "FUNCIONARIO" },
    select: { id: true },
  });
  if (!funcionario) redirect("/admin/funcionarios");

  const senhaHash = await hashPassword(resultado.data.senha);
  await prisma.usuario.update({
    where: { id },
    data: { senhaHash },
  });

  revalidatePath("/admin/funcionarios");
  redirect("/admin/funcionarios");
}

// Desativar em vez de apagar — preserva o histórico (agendamentos, vendas
// registradas por essa pessoa) e é reversível caso ela volte a trabalhar
// na oficina. Só mexe em contas FUNCIONARIO: o dono não consegue se
// desativar por aqui.
export async function alternarAtivoFuncionario(id: string) {
  const session = await auth();
  if (!session?.user) return;
  exigirDono(session.user.papel);

  const funcionario = await prisma.usuario.findFirst({
    where: { id, oficinaId: session.user.oficinaId, papel: "FUNCIONARIO" },
    select: { ativo: true },
  });
  if (!funcionario) return;

  await prisma.usuario.update({
    where: { id },
    data: { ativo: !funcionario.ativo },
  });

  revalidatePath("/admin/funcionarios");
}
