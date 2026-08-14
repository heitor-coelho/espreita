import Image from "next/image";
import Link from "next/link";
import { redefinirSenhaComToken } from "@/app/actions/recuperacao-senha";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; erro?: string }>;
}) {
  const params = await searchParams;

  if (!params?.token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-center">
          <h1 className="text-xl font-semibold text-ink">Link inválido</h1>
          <p className="text-sm text-ink-muted">
            Esse link de recuperação de senha não é válido. Peça um novo.
          </p>
          <Link href="/esqueci-senha" className="text-sm text-accent-strong">
            Pedir novo link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        action={redefinirSenhaComToken}
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
          Escolher senha nova
        </h1>

        {params?.erro && (
          <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
            {params.erro}
          </p>
        )}

        <input type="hidden" name="token" value={params.token} />

        <div>
          <label
            htmlFor="senha"
            className="mb-1 block text-sm font-medium text-ink-muted"
          >
            Senha nova
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            autoFocus
            className="campo text-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent p-3 text-lg font-semibold text-white active:bg-accent-strong"
        >
          Salvar senha nova
        </button>
      </form>
    </main>
  );
}
