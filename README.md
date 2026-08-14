# Oficina App

Sistema completo de agendamentos, clientes, estoque, vendas e cobrança para
oficinas mecânicas em todo o Brasil — pensado para mecânicos sem prática com
tecnologia: simples de usar, funciona no celular (pra usar no dia a dia,
instalável como app via PWA) e no computador (pra visualizar relatórios).
Multi-tenant: cada oficina que se cadastra tem seus próprios dados,
totalmente isolados das demais.

## Stack técnica

- **Next.js 16** (App Router, TypeScript, Turbopack) — uma única aplicação
  web responsiva, funciona tanto no navegador do celular quanto no desktop,
  sem precisar de loja de aplicativos.
- **PWA instalável** (`src/app/manifest.ts`) — "Adicionar à tela inicial" no
  celular, abre em tela cheia como um app nativo.
- **Tailwind CSS 4** — tema escuro próprio (grafite + vermelho), tokens em
  `src/app/globals.css`.
- **PostgreSQL + Prisma ORM 7** (via `@prisma/adapter-pg`) — banco de dados
  relacional, com migrations versionadas em `prisma/migrations/`.
- **Auth.js (NextAuth v5)** — autenticação por telefone + senha (hash
  bcrypt), sessão via JWT, multi-usuário por oficina com papéis (`DONO` /
  `FUNCIONARIO`). Todas as rotas são protegidas por padrão em
  `src/proxy.ts`; só o que está explicitamente listado como público (login,
  cadastro, recuperação de senha, link de revisão do cliente) fica aberto.
- **Resend** — e-mail transacional (hoje só usado no fluxo "esqueci minha
  senha"). Sem a chave configurada, o link cai no log do servidor em vez de
  ser enviado — útil em dev, não serve pra produção.
- **web-push** — notificações push (aviso pro mecânico quando o cliente
  responde uma revisão). Opcional: sem as chaves VAPID configuradas, o sino
  de notificação simplesmente não aparece, o resto do app funciona normal.
- **Storage S3-compatible** (Cloudflare R2, AWS S3, Supabase Storage...) —
  fotos/vídeos das Revisões. Upload direto do navegador via URL assinada
  (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), o arquivo não
  passa pelo servidor Next.js.
- **qrcode** — geração de QR Code Pix (EMV/BR Code "copia e cola" e CRC16
  implementados do zero em `src/lib/pix.ts`, sem depender de gateway de
  pagamento pago).
- **@dnd-kit** — arrastar e soltar pra reordenar a fila de atendimento do
  dia.
- **lucide-react** — ícones.
- **Vitest** + **Testing Library** — testes unitários/integração.

## Modelo de dados (resumo)

Cada **Oficina** é isolada das demais (multi-tenant, toda query filtrada por
`oficinaId`). Dentro de uma oficina:

- `Usuario` — quem faz login (`DONO` ou `FUNCIONARIO`), telefone único,
  e-mail opcional (necessário só pra recuperação de senha).
- `TokenRecuperacaoSenha` — tokens de uso único do fluxo "esqueci minha
  senha" (hash do token, expira em 30min).
- `Cliente` / `Veiculo` — dados do cliente e seus veículos (`tipo`: MOTO,
  CARRO ou OUTRO).
- `Agendamento` — data/hora, status (`AGENDADO` → `EM_ATENDIMENTO` →
  `CONCLUIDO`, ou `CANCELADO`), problema relatado, serviço realizado, valor
  cobrado, ordem manual na fila do dia (`ordemFila`).
- `ItemRevisao` — peça/serviço identificado durante o atendimento: descrição,
  valor, fotos/vídeos, status da decisão do cliente (`PENDENTE` /
  `APROVADO` / `RECUSADO`). Pode estar ligado a um `Produto` do catálogo —
  quando está e o cliente aprova, vira venda automaticamente ao concluir o
  atendimento.
- `Produto` — catálogo/estoque da oficina (peças), com preço, custo e
  quantidade.
- `Venda` / `ItemVenda` — histórico de vendas (avulsas ou geradas
  automaticamente por um atendimento), com status de pagamento
  (`PENDENTE` / `PAGO` / `CANCELADO`).
- `Oficina.chavePix` — chave Pix cadastrada pelo dono, usada pra gerar
  cobrança (QR Code + copia e cola) nas vendas e ao concluir atendimentos.
- `Oficina.ativa` — chave-mestra de cobrança (hoje combinada fora do app,
  sem assinatura automática). Suspender bloqueia o login de todos os
  usuários da oficina; só é alterado via `npm run oficinas:suspender`, veja
  a seção de Scripts.

Veja o schema completo em `prisma/schema.prisma`.

## Telas implementadas

- **Cadastro** (`/cadastro`) — qualquer pessoa cria uma oficina nova
  (self-service, sem precisar de mim/CLI): nome da oficina + dados do dono.
  Loga automaticamente ao terminar.
- **Login** (`/login`) — telefone + senha, com link "Esqueci minha senha".
- **Esqueci/Redefinir senha** (`/esqueci-senha`, `/redefinir-senha`) — pede
  o telefone, manda link por e-mail (Resend) com validade de 30min e uso
  único. Sem e-mail cadastrado na conta, orienta a pedir pro dono redefinir.
- **Hoje** (`/`) — tela principal do dia a dia: fila de atendimento
  reordenável (botões ou arrastar), barra de progresso do dia, atendimento
  em curso, e uma comemoração ao concluir cada atendimento (mensagem
  variando, não é sempre a mesma). Quando termina tudo, mostra um resumo de
  fechamento do dia em vez de tela vazia.
- **Novo agendamento** (`/agendamentos/novo`) — formulário simples (cliente,
  veículo, data/hora, problema relatado). Reaproveita cliente/veículo
  existentes quando telefone/placa já estão cadastrados.
- **Agenda** (`/agenda`) — visão semanal dos agendamentos. No celular, chips
  dos 7 dias (com contador) e lista do dia selecionado. No desktop, grade
  com as 7 colunas visíveis ao mesmo tempo.
- **Revisão** (`/agendamentos/[id]`) — durante o atendimento, o mecânico
  registra os itens encontrados (descrição, valor, foto/vídeo, opcionalmente
  ligado a uma peça do estoque). O botão de envio muda de acordo com o
  estado: "Enviar revisão" (primeira vez), "Enviar revisão atualizada"
  (adicionou item novo depois de já ter enviado) ou "Cobrar resposta do
  cliente" (enviada, ainda tem item aguardando decisão) — e some quando o
  cliente já respondeu tudo. Ver detalhes técnicos abaixo.
- **Revisão pública** (`/r/[id]`) — página sem login que o cliente recebe
  pelo WhatsApp: vê fotos/descrição/valor de cada item e aprova ou recusa
  um por um.
- **Clientes** (`/clientes`) — lista com busca (nome/telefone/placa),
  cadastro manual, detalhe com veículos (cadastro/edição) e histórico de
  atendimentos.
- **Vendas** (`/vendas`) — "A receber" em destaque, resumo hoje/semana/mês,
  produtos mais vendidos no mês, seções "A receber" e "Histórico". Cada
  venda mostra se está paga, pendente ou cancelada, com botão de marcar
  como paga e gerar cobrança Pix (QR Code + copia e cola).
- **Administração** (`/admin`, só o dono vê):
  - **Peças** (`/admin/pecas`) — cadastro/edição do catálogo, controle de
    estoque.
  - **Cobrança via Pix** (`/admin/pix`) — cadastro da chave Pix da oficina.
  - **Funcionários** (`/admin/funcionarios`) — criar login de funcionário
    (nome, telefone, senha), redefinir senha dele, ativar/desativar acesso
    sem apagar histórico. Quem loga como `FUNCIONARIO` só vê Hoje e Agenda —
    sem acesso a clientes, vendas ou administração.

### Como funciona a Revisão (decisão de design)

Em vez de construir um chat dentro do app, a ideia foi aproveitar que o
WhatsApp já é universal entre mecânico e cliente no Brasil — e que o link do
WhatsApp (`wa.me`) só permite pré-preencher *texto*, não anexar foto/vídeo
diretamente. Por isso o fluxo é: o mecânico sobe as mídias (upload direto
pro storage, via URL assinada) e registra os itens em `/agendamentos/[id]`;
ao clicar em enviar, a aplicação monta uma mensagem com o resumo + um link
para `/r/[id]` — uma página pública (sem login, sem dado de outras
oficinas/clientes) onde o cliente vê fotos/vídeos, descrições e valor, e
aprova ou recusa cada item. Quando um item aprovado está ligado a uma peça
do catálogo, ele vira venda automaticamente (desconta estoque) assim que o
mecânico conclui o atendimento — sem precisar registrar tudo de novo numa
segunda tela.

## Como rodar localmente

1. **Banco de dados.** Copie `.env.example` para `.env` e preencha
   `DATABASE_URL` com uma conexão Postgres real (Neon, Supabase e Railway
   têm plano gratuito) e `AUTH_SECRET` (gere com `openssl rand -base64 32`).
   Essas duas são as únicas variáveis realmente obrigatórias pra rodar.

2. **Variáveis opcionais** (o app roda sem elas, mas com a funcionalidade
   correspondente desligada):
   - `STORAGE_*` — sem isso, upload de foto/vídeo na Revisão não funciona.
     Veja o passo a passo de configuração no `.env.example`.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — sem isso, o link de "esqueci
     minha senha" só aparece no log do servidor, não é enviado de verdade.
   - `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_SUBJECT`
     — sem isso, o sino de notificações some, resto do app funciona normal.
     Gere o par de chaves com `npx web-push generate-vapid-keys`.
   - `NEXT_PUBLIC_APP_URL` — URL pública da aplicação, usada nos links de
     revisão e recuperação de senha enviados por WhatsApp/e-mail. Em dev,
     deixe `http://localhost:3000`.

3. **Instale as dependências** (já gera o Prisma Client automaticamente via
   `postinstall`):
   ```bash
   npm install
   ```

4. **Aplique as migrations no banco:**
   ```bash
   npm run db:migrate
   ```
   Isso roda `prisma migrate dev`, que aplica todo o histórico em
   `prisma/migrations/` (ou cria uma nova migration se você tiver alterado
   `prisma/schema.prisma`).

5. **Crie a primeira oficina** (nome da oficina + dados de login do dono).
   Duas formas — use qualquer uma:
   - Pela própria aplicação: rode o servidor (`npm run dev`) e acesse
     `/cadastro`.
   - Ou pelo terminal, sem precisar rodar o servidor antes:
     ```bash
     npm run oficina:criar
     ```

6. **(Opcional) Popule dados de demonstração** — clientes, veículos,
   agendamentos, revisões e vendas de exemplo, pra testar os fluxos sem
   cadastrar tudo na mão:
   ```bash
   npm run db:seed-demo
   ```
   Requer uma oficina chamada exatamente **"Oficina Teste"** já criada
   (passo 5). Esse script não é idempotente — rodar duas vezes duplica os
   dados, então rode só uma vez por banco.

7. **Rode o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000 e entre com o telefone/senha criados no
   passo 5.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Aplica migrations pendentes (`prisma migrate deploy`) e gera o build de produção — é o comando que a hospedagem roda a cada deploy |
| `npm run start` | Sobe o build de produção já gerado |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`), sem gerar arquivos |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run db:generate` | Gera o Prisma Client a partir do schema |
| `npm run db:migrate` | Cria/aplica uma migration em dev (`prisma migrate dev`) |
| `npm run db:studio` | Interface visual do banco de dados |
| `npm run oficina:criar` | Cria uma nova oficina + usuário dono (CLI interativa) |
| `npm run db:seed-demo` | Popula dados de demonstração na "Oficina Teste" (não idempotente) |
| `npm run oficinas:listar` | Lista todas as oficinas e o status (ativa/suspensa) |
| `npm run oficinas:suspender -- "nome ou id"` | Bloqueia o login de todos os usuários de uma oficina (ex.: cliente inadimplente) |
| `npm run oficinas:reativar -- "nome ou id"` | Libera o acesso de novo |

Antes de subir qualquer mudança, o combo de verificação é:
```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Deploy em produção

Stack recomendada: **Vercel** (hospedagem do Next.js) + **Neon** (Postgres).
Um ambiente único de produção — sem staging separado por enquanto (ver
raciocínio abaixo). Passo a passo:

### 1. Banco de dados (Neon)

1. Crie conta grátis em [neon.tech](https://neon.tech).
2. **New Project** → dê um nome (ex.: `oficina-app-prod`).
3. Copie a **connection string "pooled"** (recomendada pra ambientes
   serverless como a Vercel) — algo como
   `postgresql://usuario:senha@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.

### 2. Hospedagem (Vercel)

1. Crie conta grátis em [vercel.com](https://vercel.com) (login com GitHub
   facilita, já linka os repositórios automaticamente).
2. **Add New → Project** → importe o repositório `heitor-coelho/espreita`.
3. O nome do projeto na Vercel já define a URL (`https://SEU-PROJETO.vercel.app`)
   — anote antes de configurar as variáveis, você vai precisar dela no passo
   seguinte.
4. Antes de clicar em Deploy, configure as **Environment Variables** (mesmas
   do `.env`, com valores de produção):

   | Variável | Valor em produção |
   |---|---|
   | `DATABASE_URL` | A connection string pooled do Neon (passo 1) |
   | `AUTH_SECRET` | **Gere um novo** com `openssl rand -base64 32` — nunca reuse o de dev |
   | `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` (ou seu domínio próprio, se tiver) |
   | `STORAGE_*` | As mesmas do R2 já configuradas localmente — adicione o domínio de produção na CORS Policy do bucket (R2 → bucket → Settings → CORS) |
   | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Ver aviso importante abaixo |
   | `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_SUBJECT` | Pode reaproveitar as mesmas de dev |

5. Clique em **Deploy**. O build já roda `prisma migrate deploy`
   automaticamente antes do `next build` (configurado no `npm run build`) —
   não precisa rodar migration na mão depois do deploy.
6. Depois do primeiro deploy no ar, crie a primeira oficina de produção
   pelo próprio `/cadastro` da aplicação — nada de rodar script no seu
   computador apontando pra produção.

> **Aviso sobre o Resend em produção:** sem verificar um domínio próprio no
> Resend, o remetente de teste (`onboarding@resend.dev`) só entrega e-mail
> pra caixa de entrada da própria conta Resend — **não chega pra outras
> pessoas**. Isso significa que "esqueci minha senha" não vai funcionar de
> verdade pros seus usuários reais até você verificar um domínio no Resend
> (Resend → Domains → Add Domain, aponta uns registros DNS). Enquanto isso
> não estiver feito, se alguém esquecer a senha, é você quem redefine na
> mão (dono: sem solução própria ainda; funcionário: `/admin/funcionarios`).

### Por que sem ambiente de homologação separado

Com poucos usuários de teste avisados (que topam usar sabendo que é
experimental), o ambiente local já cumpre esse papel — toda mudança passa
por aqui, testada, antes de qualquer deploy. Como a stack é Vercel + Neon,
dá pra criar preview deployments (URL + banco isolados por branch) o dia
que precisar testar algo arriscado antes de expor pros usuários reais, sem
precisar manter um segundo ambiente full-time.

## Status do projeto

**Concluído:**
- Estrutura do projeto (Next.js 16 + TypeScript + Tailwind 4), PWA instalável
- Modelagem do banco de dados (multi-tenant, papéis de usuário)
- Autenticação segura (hash de senha, sessão JWT, rotas protegidas por
  padrão), recuperação de senha por e-mail
- Cadastro de oficina self-service (`/cadastro`) e de funcionário pelo app
  (`/admin/funcionarios`)
- Tela Hoje (fila reordenável, progresso do dia, comemoração ao concluir)
- Agenda semanal (chips no celular, grade de 7 colunas no desktop)
- Revisão com foto/vídeo, envio/cobrança inteligente pro cliente via
  WhatsApp, aprovação item a item pelo cliente (`/r/[id]`)
- Clientes: lista com busca, cadastro, detalhe com veículos e histórico
- Loja: catálogo de peças/estoque, vendas (avulsas e automáticas a partir da
  revisão aprovada), relatórios de vendas por período
- Cobrança via Pix (QR Code + copia e cola, gerado sem gateway pago)
- Notificações push (aviso ao mecânico quando cliente responde a revisão)
- Suspensão de oficina inadimplente (`npm run oficinas:suspender`) — trava
  de acesso pro vendedor do produto, sem cobrança automática ainda
- Testes unitários configurados
- Deploy em produção documentado (Vercel + Neon, migrations automáticas no
  build)

**Em aberto (não bloqueia uso, mas vale saber):**
- Cobrança recorrente automática (hoje é combinada fora do app) — só vale a
  pena construir quando o volume de clientes tornar o controle manual
  inviável
- Recuperação de senha por e-mail só entrega de verdade depois de verificar
  um domínio próprio no Resend (ver seção de Deploy)
- Nota Fiscal (NFC-e/NF-e) e integração com maquininha — dependem de decisão
  de fornecedor/regime tributário, ainda não iniciado
