import { motion } from "framer-motion";
import { Vault } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center relative"
      >
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <Vault className="w-8 h-8 text-primary" />
      </motion.div>
      <p className="text-muted-foreground animate-pulse text-sm">Carregando dados do cofre...</p>
    </div>
  );
}
