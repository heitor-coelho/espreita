"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  salvarPushSubscription,
  removerPushSubscription,
} from "@/app/actions/push";

function base64UrlParaUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function NotificacoesToggle() {
  const [suportado, setSuportado] = useState(false);
  const [ativado, setAtivado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker.register("/sw.js").then(async (registro) => {
      const subscription = await registro.pushManager.getSubscription();
      setSuportado(true);
      setAtivado(!!subscription);
    });
  }, []);

  async function ativar() {
    setCarregando(true);
    try {
      const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!chavePublica) return;

      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return;

      const registro = await navigator.serviceWorker.ready;
      const subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaUint8Array(chavePublica),
      });

      await salvarPushSubscription(subscription.toJSON() as never);
      setAtivado(true);
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setCarregando(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const subscription = await registro.pushManager.getSubscription();
      if (subscription) {
        await removerPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setAtivado(false);
    } finally {
      setCarregando(false);
    }
  }

  if (!suportado) return null;

  return (
    <button
      type="button"
      onClick={ativado ? desativar : ativar}
      disabled={carregando}
      aria-label={
        ativado ? "Desativar notificações" : "Ativar notificações"
      }
      title={ativado ? "Desativar notificações" : "Ativar notificações"}
      className="text-ink-faint disabled:opacity-50"
    >
      {ativado ? <Bell size={18} strokeWidth={1.75} /> : <BellOff size={18} strokeWidth={1.75} />}
    </button>
  );
}
