import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Protege todas as rotas por padrão, exceto login e arquivos estáticos.
// Qualquer página nova criada dentro do app já fica protegida automaticamente.
const PREFIXOS_SOMENTE_DONO = ["/clientes", "/vendas", "/admin"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/r/");

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  const somenteDono = PREFIXOS_SOMENTE_DONO.some((prefixo) =>
    pathname.startsWith(prefixo),
  );

  if (isLoggedIn && somenteDono && req.auth?.user.papel !== "DONO") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|png|js|json|webmanifest)$).*)",
  ],
};
