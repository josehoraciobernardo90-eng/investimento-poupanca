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
      transition={{ duration: 0.5, delay, ease: [0, 0.71, 0.2, 1.01] }}
      className={cn(
        "relative overflow-hidden glass-card-elite rounded-3xl p-6 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:border-primary/40 hover:-translate-y-2 group select-none",
        className
      )}
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/40 transition-all duration-700 opacity-60" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</h3>
          <div className="h-1 w-8 bg-primary/40 rounded-full group-hover:w-12 transition-all duration-500" />
        </div>
        {icon && (
          <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-primary border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            {icon}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <div className="text-4xl font-display font-black text-white tracking-tighter text-glow drop-shadow-sm mb-2">
          {value}
        </div>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
            {trend && (
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg border", 
                trend.isPositive ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
              )}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}%
              </span>
            )}
            {description && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">{description}</p>}
          </div>
        )}
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-700" />
    </motion.div>
  );
}
