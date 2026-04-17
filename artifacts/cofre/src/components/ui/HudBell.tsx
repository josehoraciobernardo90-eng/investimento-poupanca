/**
 * HudBell — Ícone de Notificação Sci-Fi HUD de Última Geração
 *
 * Características:
 *  • Shake animado ao receber novas notificações
 *  • Ondas sonoras (ripple) expansíveis ao hover
 *  • Contador holográfico com brilho neon
 *  • Pulso de fundo reactivo à contagem
 *  • Zero dependências externas além de framer-motion
 */

import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";

interface HudBellProps {
  count: number;          // número de notificações não lidas
  onClick: () => void;
  color?: string;         // cor base (default ciano)
}

export function HudBell({ count, onClick, color = "#00d4ff" }: HudBellProps) {
  const controls = useAnimation();
  const prevCount = useRef(count);

  // Shake quando chegar nova notificação
  useEffect(() => {
    if (count > prevCount.current) {
      controls.start({
        rotate: [0, -18, 16, -12, 10, -6, 4, 0],
        transition: { duration: 0.7, ease: "easeInOut" }
      });
    }
    prevCount.current = count;
  }, [count, controls]);

  const hasNotif = count > 0;

  return (
    <button
      onClick={onClick}
      aria-label={`Notificações (${count})`}
      className="relative flex items-center justify-center focus:outline-none group"
      style={{ width: 44, height: 44 }}
    >
      {/* ── Fundo base ── */}
      <span
        className="absolute inset-0 rounded"
        style={{
          background: hasNotif ? `${color}11` : "rgba(255,255,255,0.03)",
          border: `1px solid ${hasNotif ? color + "44" : "rgba(255,255,255,0.08)"}`,
          transition: "all 0.4s ease",
        }}
      />

      {/* ── Pulso de fundo (só com notifs) ── */}
      {hasNotif && (
        <motion.span
          className="absolute inset-0 rounded"
          style={{ border: `1px solid ${color}` }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.5, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* ── Ondas sonoras ao hover ── */}
      {[1, 2, 3].map(i => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded pointer-events-none"
          style={{ border: `1px solid ${color}` }}
          initial={{ opacity: 0, scale: 1 }}
          whileHover="hov"
          variants={{
            hov: {
              opacity: [0, 0.5, 0],
              scale: [1, 1.3 + i * 0.25, 1.6 + i * 0.25],
              transition: {
                delay: i * 0.12,
                duration: 0.9,
                repeat: Infinity,
                ease: "easeOut",
              },
            },
          }}
        />
      ))}

      {/* ── Ícone do sino ── */}
      <motion.div
        animate={controls}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ position: "relative", zIndex: 2 }}
      >
        <Bell
          style={{
            width: 17,
            height: 17,
            color: hasNotif ? color : "rgba(255,255,255,0.35)",
            filter: hasNotif ? `drop-shadow(0 0 6px ${color})` : "none",
            transition: "all 0.3s ease",
          }}
        />
      </motion.div>

      {/* ── Contador holográfico ── */}
      <AnimatePresence>
        {hasNotif && (
          <motion.span
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 17,
              height: 17,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              boxShadow: `0 0 10px ${color}, 0 0 20px ${color}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
              border: "1.5px solid #020617",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 8,
                fontWeight: 900,
                color: "#000",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                paddingInline: 2,
              }}
            >
              {count > 99 ? "99+" : count}
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* ── Scanner line ao hover ── */}
      <motion.span
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          top: "50%",
          zIndex: 1,
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        whileHover={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </button>
  );
}
