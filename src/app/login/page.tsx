import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
        <h1 className="text-center text-2xl font-semibold text-ink">
          Entrar na Oficina
        </h1>

        {params?.error && (
          <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
            Telefone ou senha incorretos.
          </p>
        )}

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

        <div>
          <label
            htmlFor="senha"
            className="mb-1 block text-sm font-medium text-ink-muted"
          >
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            className="campo text-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent p-3 text-lg font-semibold text-white active:bg-accent-strong"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
