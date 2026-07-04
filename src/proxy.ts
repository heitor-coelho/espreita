import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Protege todas as rotas por padrão, exceto login e arquivos estáticos.
// Qualquer página nova criada dentro do app já fica protegida automaticamente.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/r/");

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|png|js|json|webmanifest)$).*)",
  ],
};
