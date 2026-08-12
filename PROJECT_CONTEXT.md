# Contexto do projeto — Espreita / Oficina App

> Documento vivo de referência para o desenvolvimento. Atualize-o quando uma
> decisão de produto, arquitetura ou fluxo mudar.

## Propósito

Aplicação web responsiva para oficinas mecânicas brasileiras. A prioridade é
ser simples para uso diário no celular e útil também no desktop. Cada oficina
é um tenant isolado.

## Stack e comandos

- Next.js 16, App Router, React 19 e TypeScript estrito.
- Tailwind CSS 4; tema escuro grafite com destaque vermelho em
  `src/app/globals.css`.
- PostgreSQL + Prisma 7.
- Auth.js/NextAuth v5, credenciais por telefone e senha bcrypt, sessão JWT.
- Armazenamento S3-compatible para mídias de revisão, com upload direto por
  URL assinada.
- Testes com Vitest e Testing Library.

Comandos principais: `npm run dev`, `npm run lint`, `npm run test`,
`npm run build`, `npm run db:migrate`, `npm run oficina:criar`.

## Domínio e isolamento de dados

`Oficina` é o tenant. Todas as consultas e mutações de dados internos devem
ser filtradas pelo `oficinaId` da sessão — padrão já usado nas server actions
e páginas protegidas.

Entidades: `Usuario` (DONO/FUNCIONARIO), `Cliente`, `Veiculo`
(MOTO/CARRO/OUTRO), `Agendamento`, `ItemRevisao`, `Produto`, `Venda` e
`ItemVenda`. O schema completo está em `prisma/schema.prisma`.

Status de agendamento: `AGENDADO` → `EM_ATENDIMENTO` → `CONCLUIDO`; também
existe `CANCELADO`. A transição atual é feita pelas ações de
`src/app/actions/agendamentos.ts`.

## Fluxos implementados

- Login em `/login`; `src/proxy.ts` protege todas as rotas, com exceção do
  login e do endpoint de Auth.
- Hoje (`/`): lista os agendamentos do dia e permite iniciar/concluir
  atendimento.
- Agenda (`/agenda`): calendário semanal; chips no mobile e grade de sete
  dias no desktop.
- Novo agendamento (`/agendamentos/novo`): cria ou reaproveita cliente pelo
  telefone e veículo pela combinação placa + cliente.
- Clientes (`/clientes`, `/clientes/novo`, `/clientes/[id]`): busca por nome,
  telefone ou placa; cadastro de cliente; veículos editáveis e histórico.
- Revisão (`/agendamentos/[id]`): itens, estimativas e foto/vídeo. O link
  público `/r/[id]` é enviado ao cliente pelo WhatsApp; não há chat interno.
- Vendas (`/vendas`): placeholder. Produtos, vendas e relatórios são a
  próxima frente de produto.

## Convenções importantes

- Componentes de interface ficam em `src/components`; páginas e server actions
  em `src/app`.
- Server actions autenticam via `auth()` antes de operar dados.
- Valores monetários são `Decimal(10,2)` no banco; a UI hoje converte para
  `Number` apenas para exibir/somar.
- Datas da agenda usam horário local (`src/lib/datas.ts`).
- Telefones ainda não são normalizados formalmente; os links do WhatsApp
  assumem número brasileiro e prefixam `55`.
- Upload permite jpg/jpeg/png/webp/heic/mp4/mov/webm. As variáveis exigidas
  são `STORAGE_*`, e a URL pública do app é `NEXT_PUBLIC_APP_URL`.

## Pontos de atenção conhecidos

- Não expor nem versionar arquivos de ambiente. Há um `.ENV` local não
  rastreado; ele não deve ser inspecionado ou alterado sem necessidade.
- O README informa que, neste ambiente, `prisma generate`/build podem falhar
  se o binário do Prisma não estiver disponível. Validar com lint e testes
  unitários quando apropriado.
- O schema já inclui Produto/Venda/ItemVenda, mas a interface e o fluxo de
  loja ainda não foram implementados.
- Há uma inconsistência a resolver: `/r/[id]` foi criada para ser pública,
  mas o matcher atual de `src/proxy.ts` também a redireciona para login. Ao
  corrigir isso, tratar o URL como segredo ou introduzir mecanismo explícito
  de acesso, pois a página revela dados de cliente e veículo.

## Estado de referência inicial

Reconhecimento registrado em 12/08/2026. O repositório tinha somente o commit
inicial no histórico e alterações locais pré-existentes em `package.json`,
`package-lock.json` e um arquivo `.ENV`; essas alterações não fazem parte
deste documento nem devem ser sobrescritas por padrão.
