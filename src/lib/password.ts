import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Gera o hash de uma senha em texto puro. Nunca armazenamos a senha
 * original — apenas este hash vai para o banco de dados.
 */
export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

/**
 * Compara uma senha em texto puro com o hash armazenado.
 */
export async function comparePassword(
  senha: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
