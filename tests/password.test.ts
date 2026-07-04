import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@/lib/password";

describe("hash de senha", () => {
  it("gera um hash diferente da senha original", async () => {
    const hash = await hashPassword("minhaSenha123");
    expect(hash).not.toBe("minhaSenha123");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("confirma a senha correta", async () => {
    const hash = await hashPassword("minhaSenha123");
    await expect(comparePassword("minhaSenha123", hash)).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await hashPassword("minhaSenha123");
    await expect(comparePassword("senhaErrada", hash)).resolves.toBe(false);
  });
});
