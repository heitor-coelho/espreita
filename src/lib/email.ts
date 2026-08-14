import { Resend } from "resend";

// Sem RESEND_API_KEY configurada (dev local, ou produção ainda não
// configurada), não falha — só loga o link no console. Isso deixa o fluxo
// de "esqueci senha" inteiro testável sem depender de conta externa, e
// evita que a ausência da chave derrube o cadastro/login em produção por
// um detalhe de e-mail.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// resend.dev é o remetente de teste do Resend — funciona sem verificar
// domínio, mas só entrega pro e-mail com o qual você criou a conta lá. Pra
// mandar pra qualquer cliente de verdade, configure RESEND_FROM_EMAIL com
// um remetente do seu próprio domínio verificado no Resend.
const REMETENTE = process.env.RESEND_FROM_EMAIL ?? "Oficina App <onboarding@resend.dev>";

export async function enviarEmailRecuperacaoSenha(params: {
  destinatario: string;
  nome: string;
  link: string;
}) {
  const { destinatario, nome, link } = params;

  if (!resend) {
    console.log(
      `[email:dev] RESEND_API_KEY não configurada — link de recuperação de senha para ${destinatario}:\n${link}`,
    );
    return;
  }

  await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: "Redefinir sua senha — Oficina App",
    html: `
      <p>Olá, ${nome}!</p>
      <p>Recebemos um pedido pra redefinir a senha da sua conta na Oficina App.</p>
      <p><a href="${link}">Clique aqui pra escolher uma senha nova</a></p>
      <p>Esse link expira em 30 minutos. Se não foi você quem pediu, pode ignorar este e-mail — sua senha continua a mesma.</p>
    `,
  });
}
