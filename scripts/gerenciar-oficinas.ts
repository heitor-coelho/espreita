// Ferramenta de vendedor: listar oficinas e suspender/reativar acesso.
// Não existe tela no app pra isso de propósito — é uma ação que só quem
// vende o produto (você) deve conseguir fazer, nenhum DONO de oficina tem
// esse poder sobre a própria conta (nem deveria).
//
// Uso:
//   npm run oficinas:listar
//   npm run oficinas:suspender -- <id-ou-parte-do-nome>
//   npm run oficinas:reativar -- <id-ou-parte-do-nome>

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não foi configurada.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function listar() {
  const oficinas = await prisma.oficina.findMany({
    orderBy: { criadoEm: "asc" },
    include: { _count: { select: { usuarios: true } } },
  });

  if (oficinas.length === 0) {
    console.log("Nenhuma oficina cadastrada ainda.");
    return;
  }

  console.log("\n== Oficinas cadastradas ==\n");
  for (const o of oficinas) {
    const status = o.ativa ? "ativa" : "SUSPENSA";
    console.log(
      `[${status}] ${o.nome} — ${o._count.usuarios} usuário(s) — id: ${o.id}`,
    );
  }
  console.log("");
}

async function alterarStatus(termo: string, ativa: boolean) {
  if (!termo) {
    console.error(
      "Informe o id ou parte do nome da oficina. Ex.: npm run oficinas:suspender -- \"Oficina do Zé\"",
    );
    process.exit(1);
  }

  const oficinas = await prisma.oficina.findMany({
    where: {
      OR: [{ id: termo }, { nome: { contains: termo, mode: "insensitive" } }],
    },
  });

  if (oficinas.length === 0) {
    console.error(`Nenhuma oficina encontrada pra "${termo}".`);
    process.exit(1);
  }
  if (oficinas.length > 1) {
    console.error(
      `Mais de uma oficina encontrada pra "${termo}" — seja mais específico ou use o id:`,
    );
    for (const o of oficinas) console.error(`  - ${o.nome} (id: ${o.id})`);
    process.exit(1);
  }

  const oficina = oficinas[0];
  await prisma.oficina.update({ where: { id: oficina.id }, data: { ativa } });
  console.log(
    `Oficina "${oficina.nome}" agora está ${ativa ? "ATIVA" : "SUSPENSA"}.` +
      (ativa
        ? " Todos os usuários dela já conseguem entrar de novo."
        : " Ninguém dela consegue mais logar até você reativar."),
  );
}

async function main() {
  const comando = process.argv[2];
  const termo = process.argv.slice(3).join(" ").trim();

  if (comando === "suspender") return alterarStatus(termo, false);
  if (comando === "reativar") return alterarStatus(termo, true);
  return listar();
}

main()
  .catch((erro) => {
    console.error("Erro:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
