import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hashPassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não foi configurada.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function perguntar(
  rl: ReturnType<typeof createInterface>,
  pergunta: string,
  obrigatorio = true
): Promise<string> {
  while (true) {
    const resposta = (await rl.question(pergunta)).trim();
    if (resposta || !obrigatorio) return resposta;
    console.log("Esse campo é obrigatório.");
  }
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\n== Cadastro de nova oficina ==\n");

  const nomeOficina = await perguntar(rl, "Nome da oficina: ");
  const cidade = await perguntar(rl, "Cidade (opcional): ", false);
  const estado = await perguntar(rl, "Estado/UF (opcional): ", false);

  console.log("\n-- Dados do dono (login dele) --\n");
  const nomeDono = await perguntar(rl, "Nome do dono: ");
  const telefoneDono = await perguntar(
    rl,
    "Telefone do dono (usado para login): "
  );
  const emailDono = await perguntar(rl, "Email do dono (opcional): ", false);
  const senhaDono = await perguntar(rl, "Senha provisória: ");

  rl.close();

  const telefoneExiste = await prisma.usuario.findUnique({
    where: { telefone: telefoneDono },
  });

  if (telefoneExiste) {
    console.error(`\nJá existe um usuário com o telefone ${telefoneDono}.`);
    process.exit(1);
  }

  const senhaHash = await hashPassword(senhaDono);

  const oficina = await prisma.oficina.create({
    data: {
      nome: nomeOficina,
      cidade: cidade || undefined,
      estado: estado || undefined,
      usuarios: {
        create: {
          nome: nomeDono,
          telefone: telefoneDono,
          email: emailDono || undefined,
          senhaHash,
          papel: "DONO",
        },
      },
    },
  });

  console.log(`\nOficina "${oficina.nome}" criada com sucesso.`);
  console.log(`Login do dono -> telefone: ${telefoneDono} / senha: ${senhaDono}`);
  console.log("Peça pra ele trocar a senha assim que entrar pela primeira vez.\n");
}

main()
  .catch((erro) => {
    console.error("Erro ao criar oficina:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
