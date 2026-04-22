/**
 * ELITE PUSH ENGINE v4.0
 * Gere sons, vibração e notificações em segundo plano
 */

export const eliteNotify = {
  // 1. Notificação Visual e Sonora (Mesmo em background se PWA instalado)
  send: async (title: string, body: string) => {
    // Tocar Som Selecionado
    const selectedSound = localStorage.getItem("cofre_tone") || "elite";
    const sounds: any = {
      elite: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
      digital: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
      success: "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3"
    };

    const audio = new Audio(sounds[selectedSound]);
    audio.play().catch(() => {});

    // Vibrar Telemóvel (Padrão: 200ms vibra, 100ms pausa, 200ms vibra)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Notificação de Sistema (Push)
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png"
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification(title, { body });
      }
    }
  }
};
