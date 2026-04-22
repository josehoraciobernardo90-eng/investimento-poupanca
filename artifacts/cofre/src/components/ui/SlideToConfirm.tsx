import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToConfirmProps {
  onConfirm: () => void;
  label: string;
  successLabel?: string;
  className?: string;
}

export function SlideToConfirm({ onConfirm, label, successLabel = "Confirmado!", className }: SlideToConfirmProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const x = useMotionValue(0);
  
  // O limite para confirmação é a largura do container menos a largura do slider (ex: 300 - 50)
  const containerRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(250);

  useEffect(() => {
    if (containerRef.current) {
      setLimit(containerRef.current.offsetWidth - 64);
    }
  }, []);

  const opacity = useTransform(x, [0, limit * 0.5], [1, 0]);
  const bgOpacity = useTransform(x, [0, limit], [0.1, 0.3]);
  const scale = useTransform(x, [0, limit], [1, 1.02]);

  const handleDragEnd = () => {
    if (x.get() >= limit - 10) {
      setIsConfirmed(true);
      onConfirm();
    } else {
      x.set(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-16 rounded-2xl p-1 flex items-center overflow-hidden transition-all",
        isConfirmed ? "bg-emerald-600" : "bg-slate-800 border border-white/5",
        className
      )}
    >
      <AnimatePresence>
        {!isConfirmed && (
          <motion.div 
            style={{ opacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Lock className="w-3 h-3" /> {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {isConfirmed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-5 h-5 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">{successLabel}</span>
        </motion.div>
      )}

      {/* Draggable Button */}
      {!isConfirmed && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: limit }}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="w-14 h-14 bg-white rounded-xl shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
        >
          <ChevronRight className="w-6 h-6 text-slate-900 stroke-[3px]" />
        </motion.div>
      )}
      
      {/* Glow Effect */}
      <motion.div 
        style={{ width: x, opacity: bgOpacity }}
        className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-l-2xl"
      />
    </div>
  );
}

import { AnimatePresence } from "framer-motion";
