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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, rotateX: -2, rotateY: 3, perspective: 1000 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden glass-card-elite rounded-[2.5rem] p-8 group select-none cursor-default",
        className
      )}
    >
      {/* 3D Inner Shadow Effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      
      {/* Decorative Gradient Blob */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000 opacity-40" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">{title}</h3>
          <div className="h-1 w-6 bg-primary/60 rounded-full group-hover:w-16 transition-all duration-700" />
        </div>
        {icon && (
          <div className="w-14 h-14 flex items-center justify-center bg-black/40 rounded-2xl text-primary border border-white/5 shadow-2xl group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
            {icon}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <div className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter text-glow drop-shadow-2xl mb-4 group-hover:translate-x-1 transition-transform">
          {value}
        </div>
        
        {(description || trend) && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-black/30 rounded-2xl border border-white/5 backdrop-blur-md">
            {trend && (
              <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1", 
                trend.isPositive ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
              )}>
                {trend.isPositive ? "▲" : "▼"} {trend.value}%
              </span>
            )}
            {description && <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none opacity-60 group-hover:opacity-100 transition-opacity">{description}</p>}
          </div>
        )}
      </div>
      
      {/* Background Accent 3D */}
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </motion.div>
  );
}
