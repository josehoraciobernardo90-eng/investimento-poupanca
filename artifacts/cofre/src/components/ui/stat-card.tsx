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
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 group",
        className
      )}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wide">{title}</h3>
        {icon && <div className="p-2 bg-white/5 rounded-lg text-primary">{icon}</div>}
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl font-display font-bold text-foreground text-glow mb-1">
          {value}
        </div>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-md", 
                trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
