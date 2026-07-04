"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const telefone = formData.get("telefone") as string;
  const senha = formData.get("senha") as string;

  try {
    await signIn("credentials", {
      telefone,
      senha,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}
