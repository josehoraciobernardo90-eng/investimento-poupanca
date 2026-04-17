import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, delay = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden p-4 group select-none",
        className
      )}
      style={{
        background: 'rgba(0,10,25,0.7)',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: '4px'
      }}
    >
      {/* Micro Digital Rain Effect (Subtle) */}
      <div className="absolute inset-0 opacity-[0.02] overflow-hidden pointer-events-none">
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '4px', lineHeight: '4px', wordBreak: 'break-all' }} className="text-cyan-500 w-full h-full animate-pulse">
          {Array(20).fill("010110010101011010110").join("")}
        </div>
      </div>

      {/* HUD Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40" />

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00d4ff 2px, #00d4ff 4px)' }} />

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px', letterSpacing: '0.15em' }} className="text-cyan-500/40 uppercase font-black">{title}</p>
          <div className="h-[1px] w-4 bg-cyan-500/20 group-hover:w-8 transition-all duration-500 mt-1" />
        </div>
        {icon && (
          <div className="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 800 }} className="text-lg md:text-xl text-white tracking-tight leading-none mb-2">
          {value}
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-2">
            {trend && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px' }} className={cn(
                "font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                trend.isPositive
                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/5 text-rose-400 border-rose-500/20"
              )}>
                {trend.isPositive ? "UP" : "DN"} {trend.value}%
              </span>
            )}
            {description && (
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px' }} className="text-cyan-500/20 uppercase font-black truncate">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Hover glow line */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-500 group-hover:w-full transition-all duration-500 shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
    </motion.div>
  );
}
