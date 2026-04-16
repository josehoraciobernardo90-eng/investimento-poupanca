import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Activity, Cpu, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: 1,
    title: "DINHEIRO SEMPRE DISPONÍVEL",
    subtitle: "Gestão Ativa de Capital",
    description: "Nossos sistemas monitoram o fluxo de caixa 24 horas por dia para garantir que você possa sacar seus fundos sempre que precisar.",
    icon: <Cpu className="w-8 h-8" />,
    color: "primary",
    stats: "SISTEMA ONLINE: 100%"
  },
  {
    id: 2,
    title: "TRANSPARÊNCIA TOTAL",
    subtitle: "Segurança de Elite",
    description: "Cada transação é verificada por três camadas de proteção digital. Seus ativos estão protegidos contra qualquer falha.",
    icon: <ShieldCheck className="w-8 h-8" />,
    color: "secondary",
    stats: "PROTEÇÃO ATIVA"
  },
  {
    id: 3,
    title: "LUCRO MÁXIMO GARANTIDO",
    subtitle: "Oportunidades Reais",
    description: "Usamos inteligência para identificar os melhores negócios em Chimoio, garantindo o maior retorno para o seu investimento.",
    icon: <Zap className="w-8 h-8" />,
    color: "primary",
    stats: "MÉDIA DE LUCRO: +14.2%"
  }
];

export function TechSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[320px] rounded-[2rem] overflow-hidden glass-card-elite tech-grid-bg border-primary/10">
      <div className="scanline-overlay opacity-30" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1, x: 50, rotateY: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -50, rotateY: -10 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="absolute inset-0 p-10 flex flex-col justify-center"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-black/40 border border-white/10 mb-6 group cursor-default">
                 <Activity className={cn("w-3 h-3 animate-pulse", slides[current].color === 'primary' ? "text-primary" : "text-secondary")} />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
                    {slides[current].stats}
                 </span>
              </div>
              
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.5em] mb-2 font-mono">
                {slides[current].subtitle}
              </h4>
              
              <h2 className={cn(
                "text-4xl md:text-5xl font-display font-black tracking-tighter italic mb-4 uppercase",
                slides[current].color === 'primary' ? "text-glow-blue text-white" : "text-glow-red text-white"
              )}>
                {slides[current].title}
              </h2>
              
              <p className="text-sm text-white/40 max-w-xl font-mono leading-relaxed">
                {slides[current].description}
              </p>
            </div>

            <motion.div 
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "hidden md:flex w-24 h-24 rounded-2xl bg-black/40 border border-white/5 items-center justify-center text-white shadow-2xl",
                slides[current].color === 'primary' ? "text-primary border-primary/20" : "text-secondary border-secondary/20"
              )}
            >
              {slides[current].icon}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Layer */}
      <div className="absolute bottom-10 right-10 flex gap-4 z-50">
        <button 
          onClick={prev}
          className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={next}
          className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
         <motion.div 
           key={current}
           initial={{ width: 0 }}
           animate={{ width: '100%' }}
           transition={{ duration: 6, ease: "linear" }}
           className={cn("h-full", slides[current].color === 'primary' ? "bg-primary" : "bg-secondary")}
         />
      </div>
    </div>
  );
}
