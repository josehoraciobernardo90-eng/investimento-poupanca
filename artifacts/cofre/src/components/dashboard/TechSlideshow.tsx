import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Activity, Building, ShieldCheck, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: 1,
    title: "LIQUIDEZ IMEDIATA",
    subtitle: "Gestão Ativa de Tesouraria",
    description: "Monitorização contínua do fluxo de caixa operacional. Garantimos que os seus fundos estejam sempre acessíveis com máxima segurança institucional.",
    icon: <Building className="w-10 h-10" />,
    color: "blue",
    stats: "LIQUIDEZ GARANTIDA"
  },
  {
    id: 2,
    title: "GOVERNANÇA TRANSPARENTE",
    subtitle: "Auditoria e Segurança",
    description: "Cada transação é validada e registada sob rigorosos protocolos fiduciários. Os seus ativos encontram-se protegidos por infraestruturas de ponta.",
    icon: <ShieldCheck className="w-10 h-10" />,
    color: "emerald",
    stats: "CONFORMIDADE ATIVA"
  },
  {
    id: 3,
    title: "RENTABILIDADE OTIMIZADA",
    subtitle: "Estratégia de Crescimento",
    description: "Aplicamos análises preditivas para estruturar operações de capital de risco e alocação de ativos com retornos consistentes.",
    icon: <PieChart className="w-10 h-10" />,
    color: "indigo",
    stats: "EXPANSÃO PATRIMONIAL"
  }
];

export function TechSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[360px] rounded-3xl overflow-hidden glass-card-elite bg-slate-900 shadow-2xl">
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
      <div className="absolute top-0 right-0 w-3/4 h-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-white/10 mb-6 shadow-sm">
                 <Activity className={cn(
                   "w-3.5 h-3.5 animate-pulse", 
                   slides[current].color === 'blue' ? "text-blue-500" : slides[current].color === 'emerald' ? "text-emerald-500" : "text-indigo-500"
                 )} />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    {slides[current].stats}
                 </span>
              </div>
              
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 font-sans">
                {slides[current].subtitle}
              </h4>
              
              <h2 className="text-3xl md:text-5xl font-display font-medium text-white tracking-tight mb-5 drop-shadow-sm">
                {slides[current].title}
              </h2>
              
              <p className="text-base text-slate-400 font-light leading-relaxed">
                {slides[current].description}
              </p>
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="hidden md:flex w-32 h-32 rounded-2xl bg-slate-800/80 border border-white/5 items-center justify-center shadow-inner relative overflow-hidden group"
            >
              <div className={cn(
                "absolute inset-0 opacity-20 transition-opacity duration-1000 group-hover:opacity-40",
                slides[current].color === 'blue' ? "bg-blue-500" : slides[current].color === 'emerald' ? "bg-emerald-500" : "bg-indigo-500"
              )} />
              <div className={cn(
                "relative z-10",
                slides[current].color === 'blue' ? "text-blue-400" : slides[current].color === 'emerald' ? "text-emerald-400" : "text-indigo-400"
              )}>
                {slides[current].icon}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Layer */}
      <div className="absolute bottom-10 right-8 md:right-12 flex gap-3 z-50">
        <button 
          onClick={prev}
          className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={next}
          className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800/50">
         <motion.div 
           key={current}
           initial={{ width: 0 }}
           animate={{ width: '100%' }}
           transition={{ duration: 8, ease: "linear" }}
           className={cn("h-full", 
             slides[current].color === 'blue' ? "bg-blue-500" : slides[current].color === 'emerald' ? "bg-emerald-500" : "bg-indigo-500"
           )}
         />
      </div>
    </div>
  );
}
