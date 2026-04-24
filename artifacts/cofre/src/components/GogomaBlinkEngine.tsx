import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * ⚡ GOGOMA BLINK ENGINE v4.0 (Global)
 * Este componente monitoriza aprovações administrativas em tempo real
 * e dispara o hardware do telemóvel (Flash + Vibração) instantaneamente.
 */
export function GogomaBlinkEngine() {
  const { notifications } = useNotifications();
  const [lastProcessedId, setLastProcessedId] = useState<string>("");

  useEffect(() => {
    // Pegar a última notificação
    const lastNotif = notifications[0];
    const now = Date.now();
    const isRecent = lastNotif ? (now - lastNotif.ts * (lastNotif.ts > 1e11 ? 1 : 1000)) < 60000 : false;
    
    // Critério de ativação: Recente, Não lida, contém "Aprovado" e ID novo
    if (
      lastNotif && 
      isRecent && 
      !lastNotif.read && 
      (lastNotif.title.toLowerCase().includes("aprovado") || lastNotif.message.toLowerCase().includes("aprovado")) &&
      lastNotif.id !== lastProcessedId
    ) {
      setLastProcessedId(lastNotif.id);
      triggerHardwareSignal();
    }
  }, [notifications, lastProcessedId]);

  // Capturar retorno do background para sinalizar pendentes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const lastNotif = notifications[0];
        if (lastNotif && !lastNotif.read && (lastNotif.title.toLowerCase().includes("aprovado") || lastNotif.message.toLowerCase().includes("aprovado"))) {
          // Re-disparar se ainda não processado nesta instância
          if (lastNotif.id !== lastProcessedId) {
            setLastProcessedId(lastNotif.id);
            triggerHardwareSignal();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [notifications, lastProcessedId]);

  const triggerHardwareSignal = async () => {
    console.log("⚡ [GOGOMA BLINK] Disparando sinal de hardware...");
    
    // 1. Feedback Hápico (Vibração Profissional)
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200, 50, 400]);
    }

    // 2. Hardware Flash Pulse (Stealth Background Stream)
    let tempStream: MediaStream | null = null;
    try {
      // TENTATIVA 1: Câmara Traseira (Ideal para Lanternas Fortes)
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: "environment" } } 
        });
      } catch (e) {
        // TENTATIVA 2: Qualquer Câmara (Fallback)
        tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      const track = tempStream.getVideoTracks()[0];
      if (track) {
        // Verificar capacidades (Torch)
        const caps: any = track.getCapabilities?.() || {};
        
        // Se o hardware suportar tocha, pulsamos. Se não, apenas vibramos (já feito acima).
        if (caps.torch) {
          for (let i = 0; i < 4; i++) {
            try {
              // @ts-ignore
              await track.applyConstraints({ advanced: [{ torch: true }] });
              await new Promise(r => setTimeout(r, 70)); 
              // @ts-ignore
              await track.applyConstraints({ advanced: [{ torch: false }] });
              await new Promise(r => setTimeout(r, 70));
            } catch (e) { break; }
          }
        }
      }
    } catch (err) {
      console.warn("[GOGOMA BLINK] Hardware ocupado ou bloqueado:", err);
    } finally {
      if (tempStream) {
        tempStream.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
      }
    }
  };

  return null; // Componente puramente funcional (Headless)
}
