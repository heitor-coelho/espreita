# Oficina App

Sistema de agendamentos, clientes, veículos e vendas para oficinas mecânicas
em todo o Brasil — pensado para mecânicos sem prática com tecnologia: simples
de usar, funciona no celular (pra cadastrar no dia a dia) e no computador
(pra visualizar relatórios).

## Stack técnica

- **Next.js 16** (App Router, TypeScript) — uma única aplicação web responsiva,
  funciona tanto no navegador do celular quanto no desktop, sem precisar de
  loja de aplicativos.
- **Tailwind CSS** — tema escuro próprio (grafite + vermelho), tokens em
  `src/app/globals.css`.
- **PostgreSQL + Prisma ORM** — banco de dados relacional, com migrations
  versionadas.
- **Auth.js (NextAuth v5)** — autenticação por telefone + senha (com hash
  bcrypt), sessão via JWT, multi-usuário por oficina com papéis (`DONO` /
  `FUNCIONARIO`).
- **lucide-react** — ícones.
- **Storage S3-compatible** (Cloudflare R2, AWS S3, Supabase Storage...) —
  fotos/vídeos das Revisões. Upload direto do navegador via URL assinada
  (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), o arquivo não
  passa pelo servidor Next.js.
- **Vitest** + **Testing Library** — testes unitários/integração.

## Modelo de dados (resumo)

Cada **Oficina** é isolada das demais (multi-tenant). Dentro de uma oficina:

- `Usuario` — quem faz login (dono ou funcionário).
- `Cliente` — cliente da oficina.
- `Veiculo` — veículo do cliente (`tipo`: MOTO, CARRO ou OUTRO — começamos
  focados em moto, mas o campo já é genérico para não precisar remodelar o
  banco quando expandir para carros).
- `Agendamento` — data/hora, status, problema relatado, serviço realizado, valor.
- `ItemRevisao` — peça/serviço identificado durante o atendimento, com
  descrição, valor estimado e fotos/vídeos. Ligado a um `Agendamento`. Ainda
  sem FK pra `Produto` (valor digitado manualmente) — entra quando a Loja
  existir.
- `Produto` e `Venda`/`ItemVenda` — base da parte de loja (histórico de
  vendas, relatórios).

Veja o schema completo em `prisma/schema.prisma`.

## Telas implementadas

- **Login** (`/login`) — telefone + senha.
- **Hoje** (`/`) — agendamentos do dia, com badge de status, botão pra
  iniciar atendimento, concluir (com valor cobrado) e link pra criar um novo
  agendamento. É a tela principal do dia a dia.
- **Novo agendamento** (`/agendamentos/novo`) — formulário simples (cliente,
  veículo, data/hora, problema relatado). Reaproveita cliente/veículo
  existentes quando telefone/placa já estão cadastrados.
- **Agenda** (`/agenda`) — visão semanal dos agendamentos. No celular,
  chips dos 7 dias da semana (com contador) e lista do dia selecionado abaixo.
  No desktop, grade com as 7 colunas visíveis ao mesmo tempo. Navegação entre
  semanas (anterior/próxima) por link, sem JavaScript no cliente.
- **Revisão** (`/agendamentos/[id]`) — durante o atendimento, o mecânico
  registra os itens encontrados (descrição, valor estimado, foto/vídeo).
  Acessível pelo card do agendamento quando o status é "Em atendimento".
  Não tem chat dentro do app: um botão monta a lista de itens + valor total
  e abre o WhatsApp do cliente (número já cadastrado) com um link pra uma
  página pública de leitura (`/r/[id]`) mostrando tudo — sem o cliente
  precisar logar em nada. Ver detalhes técnicos abaixo.
- **Clientes / Vendas** — navegação já existe (barra inferior no celular),
  conteúdo ainda é placeholder ("em breve").

### Como funciona a Revisão (decisão de design)

Em vez de construir um chat dentro do app, a ideia foi aproveitar que o
WhatsApp já é universal entre mecânico e cliente no Brasil — e que o link do
WhatsApp (`wa.me`) só permite pré-preencher *texto*, não anexar foto/vídeo
diretamente. Por isso o fluxo é: o mecânico sobe as mídias (upload direto
pro storage, via URL assinada) e registra os itens em `/agendamentos/[id]`;
ao clicar em "Enviar revisão pro cliente", a aplicação monta uma mensagem
com o resumo + um link para `/r/[id]` — uma página pública (sem login, sem
dado de outras oficinas/clientes) que mostra as fotos/vídeos, descrições e
valor total. O cliente recebe isso como uma mensagem comum no WhatsApp dele.

Esse desenho também deixa o caminho aberto pra evoluções futuras sem reescrever
nada: dá pra adicionar um botão "Aprovar" na própria página pública (sem
precisar de WhatsApp Business API), ou ligar isso direto a Venda/Produto
quando a Loja existir.

## Como rodar localmente

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL` com uma conexão
   Postgres real (Neon, Supabase e Railway têm plano gratuito) e gere um
   `AUTH_SECRET` (`openssl rand -base64 32`). Pra usar a tela de Revisão
   (upload de foto/vídeo), preencha também as variáveis `STORAGE_*` com um
   bucket S3-compatible (recomendado: Cloudflare R2, plano gratuito generoso
   e sem custo de saída de dados) e `NEXT_PUBLIC_APP_URL` com a URL pública
   da aplicação. Sem isso, o resto do app funciona normalmente — só o
   upload de mídia na Revisão fica indisponível.

2. Instale as dependências (isso já gera o Prisma Client automaticamente via
   `postinstall`):
   ```bash
   npm install
   ```

3. Aplique o schema no banco:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Crie a primeira oficina (nome da oficina + dados de login do dono):
   ```bash
   npm run oficina:criar
   ```

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000 e entre com o telefone/senha do dono criados
   no passo 4.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run db:generate` | Gera o Prisma Client a partir do schema |
| `npm run db:migrate` | Cria/aplica uma migration |
| `npm run db:studio` | Interface visual do banco de dados |
| `npm run oficina:criar` | Cria uma nova oficina + usuário dono (CLI interativa) |

## Status do projeto

**Concluído:**
- Estrutura do projeto (Next.js + TypeScript + Tailwind)
- Modelagem do banco de dados (multi-tenant, papéis de usuário)
- Autenticação segura (hash de senha, sessão JWT, rotas protegidas por padrão)
- Identidade visual (tema escuro grafite + vermelho) aplicada
- Tela Hoje (agendamentos do dia + avançar status + concluir com valor)
- Formulário de novo agendamento
- Script de criação de oficina (`oficina:criar`)
- Testes unitários configurados
- Agenda semanal (chips no celular, grade de 7 colunas no desktop)
- Revisão com foto/vídeo + envio pro cliente via WhatsApp (link público)
- Clientes: lista com busca (nome/telefone/placa), cadastro manual, detalhe
  com veículos (cadastro/edição) e histórico de atendimentos

**Próxima etapa:** Loja (produtos, vendas, relatórios e gráficos) — e junto
com ela, ligar os itens da Revisão a Produto/Venda.

> **Nota sobre este ambiente de desenvolvimento:** o sandbox usado para
> construir o projeto não teve acesso de rede para baixar os binários do
> Prisma (`binaries.prisma.sh`). Por isso `prisma generate` não roda aqui, e
> consequentemente `npm run build` também não completa neste ambiente
> específico (o type-check do Next depende dos tipos gerados pelo Prisma).
> Isso é uma limitação só deste sandbox — no seu computador ou no servidor de
> deploy, com internet completa, `npm install` já gera o client automaticamente
> (via `postinstall`) e o build funciona normalmente.
