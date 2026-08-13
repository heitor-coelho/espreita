import Image from "next/image";
import Link from "next/link";
import { cadastrarOficina } from "./actions";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        action={cadastrarOficina}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
        <Image
          src="/icon.svg"
          alt=""
          width={64}
          height={64}
          className="mx-auto rounded-2xl"
        />

        <h1 className="text-center text-2xl font-semibold text-ink">
          Cadastrar oficina
        </h1>
        <p className="text-center text-xs text-ink-muted">
          Leva menos de um minuto. Sem cartão, sem burocracia.
        </p>

        {params?.erro && (
          <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
            {params.erro}
          </p>
        )}

        <Campo label="Nome da oficina">
          <input name="nomeOficina" required autoFocus className="campo" />
        </Campo>

        <div className="grid grid-cols-2 gap-2">
          <Campo label="Cidade (opcional)">
            <input name="cidade" className="campo" />
          </Campo>
          <Campo label="UF (opcional)">
            <input name="estado" maxLength={2} className="campo uppercase" />
          </Campo>
        </div>

        <hr className="border-border" />

        <p className="text-xs font-medium text-ink-muted">Seus dados (dono da oficina)</p>

        <Campo label="Seu nome">
          <input name="nomeDono" required className="campo" />
        </Campo>

        <Campo label="Telefone (é o que você vai usar pra entrar)">
          <input
            name="telefone"
            type="tel"
            required
            className="campo"
            placeholder="(11) 99999-9999"
          />
        </Campo>

        <Campo label="E-mail (opcional)">
          <input name="email" type="email" className="campo" />
        </Campo>

        <Campo label="Senha">
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            className="campo"
          />
        </Campo>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent p-3 text-lg font-semibold text-white active:bg-accent-strong"
        >
          Criar minha oficina
        </button>

        <p className="text-center text-xs text-ink-faint">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent-strong">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
