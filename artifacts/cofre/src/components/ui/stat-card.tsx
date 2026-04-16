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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, rotateX: 2, perspective: 1000 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden glass-card-elite rounded-[1.5rem] p-6 group select-none cursor-crosshair tech-grid-bg",
        className
      )}
    >
      {/* 3D Scanline Animation Pulse */}
      <div className="scanline-overlay group-hover:opacity-60 transition-opacity" />
      
      {/* Cyber Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary/40 rounded-br-xl" />
      
      {/* Decorative Cyber Pulse Blur */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/40 transition-all duration-1000 opacity-30" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_5px_rgba(0,212,255,1)]" />
             <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] font-mono">{title}</h3>
          </div>
          <div className="h-[2px] w-4 bg-primary/40 rounded-full group-hover:w-12 transition-all duration-700" />
        </div>
        {icon && (
          <div className="w-12 h-12 flex items-center justify-center bg-black/60 rounded-xl text-primary border border-white/5 shadow-2xl group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
            {icon}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl md:text-4xl font-mono font-black text-white tracking-tighter text-glow-blue drop-shadow-2xl mb-3 group-hover:translate-x-1 transition-transform flex items-baseline gap-2">
          {value}
          <span className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">DAT.LINK</span>
        </div>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-4 p-2 bg-black/60 rounded-xl border border-white/5 border-l-primary/40 border-l-2">
            {trend && (
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-sm border flex items-center gap-1 font-mono", 
                trend.isPositive ? "bg-primary/10 text-primary border-primary/30" : "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {trend.isPositive ? "▲" : "▼"} {trend.value}%
              </span>
            )}
            {description && <p className="text-[9px] text-white/50 font-black uppercase tracking-widest leading-none font-mono">{description}</p>}
          </div>
        )}
      </div>
      
      {/* Bottom Data Stream line */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black">
         <div className="h-full w-0 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-1000" />
      </div>
    </motion.div>
  );
}
