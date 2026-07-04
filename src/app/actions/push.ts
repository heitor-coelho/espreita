"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function salvarPushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      usuarioId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      usuarioId: session.user.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function removerPushSubscription(endpoint: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, usuarioId: session.user.id },
  });
}
