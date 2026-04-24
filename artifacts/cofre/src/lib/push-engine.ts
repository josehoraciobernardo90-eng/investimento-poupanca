/**
 * ELITE PUSH ENGINE v4.0
 * Gere sons, vibração e notificações em segundo plano
 */

export const eliteNotify = {
  // 1. Notificação Visual e Sonora (Foco em Intensidade)
  send: async (title: string, body: string) => {
    // Som de Aprovação de Alta Prioridade
    const sounds: any = {
      elite: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
    };

    const audio = new Audio(sounds.elite);
    audio.volume = 1.0;
    audio.play().catch(() => {
      console.warn("Autoplay bloqueado pelo browser. O sinal sonoro requer interação prévia.");
    });

    // Padrão de Vibração de Urgência (Mais longo para ser sentido no bolso)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }

    // Notificação Nativa do Sistema
    if (Notification.permission === "granted") {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        // Enviar via Service Worker (Melhor para background)
        reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [200, 100, 200, 100, 500],
          tag: 'approval-notif',
          renotify: true
        } as any);
      } else {
        new Notification(title, { body, icon: "/icon-192.png" } as any);
      }
    }
  }
};
