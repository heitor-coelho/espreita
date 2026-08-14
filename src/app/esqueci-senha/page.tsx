import Image from "next/image";
import Link from "next/link";
import { solicitarRecuperacaoSenha } from "@/app/actions/recuperacao-senha";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6">
        <Image
          src="/icon.svg"
          alt=""
          width={64}
          height={64}
          className="mx-auto rounded-2xl"
        />

        <h1 className="text-center text-2xl font-semibold text-ink">
          Esqueci minha senha
        </h1>

        {params?.enviado ? (
          <>
            <p className="rounded-lg bg-badge-concluido p-3 text-center text-sm text-badge-concluido-ink">
              Se existe uma conta com esse telefone e um e-mail cadastrado,
              acabamos de mandar um link pra você escolher uma senha nova.
              Confira sua caixa de entrada (e o spam).
            </p>
            <p className="text-center text-xs text-ink-faint">
              Não tem e-mail cadastrado na conta? Peça pro dono da oficina
              redefinir sua senha em Administração → Funcionários, ou fale
              com o suporte.
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-xs text-ink-muted">
              Informe o telefone da sua conta. Se ela tiver e-mail
              cadastrado, mandamos um link pra você escolher uma senha nova.
            </p>

            {params?.erro && (
              <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
                {params.erro}
              </p>
            )}

            <form action={solicitarRecuperacaoSenha} className="space-y-4">
              <div>
                <label
                  htmlFor="telefone"
                  className="mb-1 block text-sm font-medium text-ink-muted"
                >
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  required
                  autoFocus
                  className="campo text-lg"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-accent p-3 text-lg font-semibold text-white active:bg-accent-strong"
              >
                Enviar link de recuperação
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-ink-faint">
          <Link href="/login" className="text-accent-strong">
            Voltar pro login
          </Link>
        </p>
      </div>
    </main>
  );
}
