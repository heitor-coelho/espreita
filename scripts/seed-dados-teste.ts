import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hoje(hora: number, minuto: number) {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
}

function diasAtras(dias: number, hora: number, minuto: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

async function main() {
  const oficina = await prisma.oficina.findFirstOrThrow({ where: { nome: "Oficina Teste" } });
  const usuario = await prisma.usuario.findFirstOrThrow({ where: { oficinaId: oficina.id } });

  // ---------- Clientes + veículos ----------
  const maria = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "Maria Silva",
      telefone: "11987654321",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "MOTO", marca: "Honda", modelo: "CG 160", placa: "ABC1D23" },
      },
    },
    include: { veiculos: true },
  });

  const joao = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "João Pereira",
      telefone: "11976543210",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "MOTO", marca: "Honda", modelo: "Biz 125", placa: "DEF4E56" },
      },
    },
    include: { veiculos: true },
  });

  const carlos = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "Carlos Souza",
      telefone: "11965432109",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "CARRO", marca: "Volkswagen", modelo: "Gol", placa: "GHI7F89" },
      },
    },
    include: { veiculos: true },
  });

  const ana = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "Ana Costa",
      telefone: "11954321098",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "MOTO", marca: "Yamaha", modelo: "Fazer 250", placa: "JKL0G12" },
      },
    },
    include: { veiculos: true },
  });

  const pedro = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "Pedro Santos",
      telefone: "11943210987",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "CARRO", marca: "Fiat", modelo: "Uno", placa: "MNO3H45" },
      },
    },
    include: { veiculos: true },
  });

  const roberto = await prisma.cliente.create({
    data: {
      oficinaId: oficina.id,
      nome: "Roberto Lima",
      telefone: "11932109876",
      veiculos: {
        create: { oficinaId: oficina.id, tipo: "MOTO", marca: "Honda", modelo: "CG 160", placa: "PQR6I78" },
      },
    },
    include: { veiculos: true },
  });

  console.log("clientes criados: 6");

  // ---------- Peças ----------
  const oleo = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Óleo 20W50", precoVenda: 35, custo: 20, estoqueQtd: 20, estoqueMinimo: 5, unidade: "litro" },
  });
  const filtroOleo = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Filtro de óleo", precoVenda: 25, custo: 12, estoqueQtd: 15, estoqueMinimo: 5, unidade: "un" },
  });
  const pastilha = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Pastilha de freio dianteira", precoVenda: 80, custo: 45, estoqueQtd: 8, estoqueMinimo: 3, unidade: "jogo" },
  });
  const corrente = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Corrente de transmissão", precoVenda: 120, custo: 70, estoqueQtd: 3, estoqueMinimo: 2, unidade: "un" },
  });
  const vela = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Vela de ignição", precoVenda: 22, custo: 10, estoqueQtd: 1, estoqueMinimo: 4, unidade: "un" }, // abaixo do mínimo de propósito
  });
  const bateria = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Bateria 12V", precoVenda: 180, custo: 110, estoqueQtd: 6, estoqueMinimo: 2, unidade: "un" },
  });
  const camaraAr = await prisma.produto.create({
    data: { oficinaId: oficina.id, nome: "Câmara de ar", precoVenda: 30, custo: 15, estoqueQtd: 12, estoqueMinimo: 5, unidade: "un" },
  });

  console.log("peças criadas: 7 (Vela de ignição propositalmente abaixo do estoque mínimo)");

  // ---------- Agendamentos de hoje: fila (AGENDADO) ----------
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: roberto.id,
      veiculoId: roberto.veiculos[0].id,
      dataHora: hoje(9, 0),
      status: "AGENDADO",
      problemaRelatado: "Barulho na corrente",
    },
  });
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: ana.id,
      veiculoId: ana.veiculos[0].id,
      dataHora: hoje(10, 30),
      status: "AGENDADO",
      problemaRelatado: "Revisão geral",
    },
  });
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: pedro.id,
      veiculoId: pedro.veiculos[0].id,
      dataHora: hoje(14, 0),
      status: "AGENDADO",
      problemaRelatado: "Troca de óleo",
    },
  });

  // ---------- Agendamento de hoje: EM_ATENDIMENTO com itens de revisão ----------
  const emAtendimento = await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: maria.id,
      veiculoId: maria.veiculos[0].id,
      dataHora: hoje(8, 0),
      status: "EM_ATENDIMENTO",
      usuarioResponsavelId: usuario.id,
      problemaRelatado: "Freio fazendo barulho",
    },
  });

  await prisma.itemRevisao.create({
    data: {
      oficinaId: oficina.id,
      agendamentoId: emAtendimento.id,
      produtoId: pastilha.id,
      descricao: pastilha.nome,
      valor: pastilha.precoVenda,
      status: "APROVADO",
      decididoEm: new Date(),
      vistoOficinaEm: new Date(),
    },
  });
  await prisma.itemRevisao.create({
    data: {
      oficinaId: oficina.id,
      agendamentoId: emAtendimento.id,
      descricao: "Troca de óleo",
      valor: 35,
      status: "APROVADO",
      decididoEm: new Date(),
      vistoOficinaEm: new Date(),
    },
  });
  await prisma.itemRevisao.create({
    data: {
      oficinaId: oficina.id,
      agendamentoId: emAtendimento.id,
      descricao: "Verificar suspensão dianteira",
      status: "PENDENTE",
    },
  });
  // Simula que a revisão já foi mandada pro cliente pelo WhatsApp — reflete
  // o cenário real de "2 aprovados + 1 aguardando resposta".
  await prisma.agendamento.update({
    where: { id: emAtendimento.id },
    data: { revisaoEnviadaEm: new Date(Date.now() - 45 * 60 * 1000) },
  });

  console.log("fila de hoje: 3 agendados + 1 em atendimento (com itens de revisão)");

  // ---------- Agendamentos concluídos (histórico, últimos dias/semana/mês) ----------
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: joao.id,
      veiculoId: joao.veiculos[0].id,
      dataHora: diasAtras(2, 11, 0), // esta semana
      status: "CONCLUIDO",
      servicoRealizado: "Troca de pastilha e regulagem de freio",
      valor: 150,
      usuarioResponsavelId: usuario.id,
    },
  });
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: carlos.id,
      veiculoId: carlos.veiculos[0].id,
      dataHora: diasAtras(1, 15, 30), // esta semana
      status: "CONCLUIDO",
      servicoRealizado: "Revisão completa + troca de óleo e filtro",
      valor: 320,
      usuarioResponsavelId: usuario.id,
    },
  });
  const concluidoAntigo = await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: maria.id,
      veiculoId: maria.veiculos[0].id,
      dataHora: diasAtras(7, 9, 0), // este mês, fora da semana
      status: "CONCLUIDO",
      servicoRealizado: "Troca de vela e cabo",
      valor: 95,
      usuarioResponsavelId: usuario.id,
    },
  });
  // Um item recusado pelo cliente, pra aparecer o status no histórico
  await prisma.itemRevisao.create({
    data: {
      oficinaId: oficina.id,
      agendamentoId: concluidoAntigo.id,
      descricao: "Troca de amortecedor traseiro",
      valor: 210,
      status: "RECUSADO",
      decididoEm: diasAtras(7, 9, 30),
      vistoOficinaEm: diasAtras(7, 9, 35),
    },
  });

  // ---------- Agendamento futuro (pra testar a Agenda semanal) ----------
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(9, 0, 0, 0);
  await prisma.agendamento.create({
    data: {
      oficinaId: oficina.id,
      clienteId: pedro.id,
      veiculoId: pedro.veiculos[0].id,
      dataHora: amanha,
      status: "AGENDADO",
      problemaRelatado: "Barulho no motor",
    },
  });

  console.log("histórico: 3 concluídos (semana/mês) + 1 agendado pra amanhã");

  // ---------- Vendas avulsas (balcão, sem atendimento) ----------
  await prisma.venda.create({
    data: {
      oficinaId: oficina.id,
      usuarioId: usuario.id,
      clienteId: ana.id,
      dataHora: hoje(11, 45),
      valorTotal: Number(oleo.precoVenda) * 2 + Number(filtroOleo.precoVenda),
      itens: {
        create: [
          { produtoId: oleo.id, quantidade: 2, precoUnitario: oleo.precoVenda },
          { produtoId: filtroOleo.id, quantidade: 1, precoUnitario: filtroOleo.precoVenda },
        ],
      },
    },
  });
  await prisma.venda.create({
    data: {
      oficinaId: oficina.id,
      usuarioId: usuario.id,
      dataHora: diasAtras(1, 16, 0),
      valorTotal: camaraAr.precoVenda,
      itens: { create: [{ produtoId: camaraAr.id, quantidade: 1, precoUnitario: camaraAr.precoVenda }] },
    },
  });
  await prisma.venda.create({
    data: {
      oficinaId: oficina.id,
      usuarioId: usuario.id,
      clienteId: pedro.id,
      dataHora: diasAtras(6, 10, 0),
      valorTotal: bateria.precoVenda,
      itens: { create: [{ produtoId: bateria.id, quantidade: 1, precoUnitario: bateria.precoVenda }] },
    },
  });

  // desconta estoque das vendas avulsas acima, pra ficar consistente
  await prisma.produto.update({ where: { id: oleo.id }, data: { estoqueQtd: { decrement: 2 } } });
  await prisma.produto.update({ where: { id: filtroOleo.id }, data: { estoqueQtd: { decrement: 1 } } });
  await prisma.produto.update({ where: { id: camaraAr.id }, data: { estoqueQtd: { decrement: 1 } } });
  await prisma.produto.update({ where: { id: bateria.id }, data: { estoqueQtd: { decrement: 1 } } });

  console.log("vendas avulsas: 3 (hoje, esta semana, este mês)");
  console.log("\nPronto. Login: 11999999999 / teste123");
}

main().finally(() => prisma.$disconnect());
