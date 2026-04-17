import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldAlert, TrendingUp, Info, ShieldCheck } from "lucide-react";
import { cn, formatMT } from "@/lib/utils";

interface MemberTechSlidesProps {
  userData: any;
  loans: any[];
}

export function MemberTechSlides({ userData, loans }: MemberTechSlidesProps) {
  const [current, setCurrent] = useState(0);

  const hasActiveLoan = (loans || []).some(l => l.user_id === userData?.user?.id && l.status === "Ativo");
  const isHighEarner = (userData?.lucro_acumulado || 0) > 500000; 
  
  const memberSlides = [
    {
      id: "status",
      title: "Conta Segura e Ativa",
      subtitle: "Proteção Institucional Privada",
      description: `O seu património consolidado de ${formatMT(userData?.patrimonioTotal || 0)} encontra-se protegido pelas mais robustas políticas de governança e segurança bancária.`,
      icon: <ShieldCheck className="w-10 h-10 text-emerald-400" />,
      theme: "emerald"
    },
    ...(hasActiveLoan ? [{
      id: "loan_alert",
      title: "Aviso de Vencimento",
      subtitle: "Monitorização de Obrigações",
      description: "Consta um contrato de crédito ativo na sua carteira. Aconselhamos a verificação dos prazos para manter a sua conformidade financeira.",
      icon: <ShieldAlert className="w-10 h-10 text-rose-400" />,
      theme: "rose"
    }] : []),
    {
      id: "growth",
      title: isHighEarner ? "Estatuto Elite Reconhecido" : "Oportunidade de Alavancagem",
      subtitle: isHighEarner ? "Excelência Consolidada" : "Plano de Rentabilidade",
      description: isHighEarner 
        ? "Os seus rendimentos ultrapassaram os benchmarks previstos. O seu perfil possui agora tratamento prioritário."
        : "Reforce o seu capital no fundo e posicione-se para captar retornos otimizados no decorrer do próximo ciclo fiscal.",
      icon: <TrendingUp className="w-10 h-10 text-blue-400" />,
      theme: "blue"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % memberSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [memberSlides.length]);

  return (
    <div className="relative w-full h-[300px] rounded-3xl overflow-hidden glass-card-elite bg-slate-900 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-900/60" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={memberSlides[current].id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 p-8 md:p-10 flex flex-col justify-center"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border mb-5 shadow-sm",
                  memberSlides[current].theme === "emerald" ? "border-emerald-500/20" : memberSlides[current].theme === "rose" ? "border-rose-500/20" : "border-blue-500/20"
                )}>
                 <Activity className={cn(
                   "w-3 h-3 animate-pulse", 
                   memberSlides[current].theme === "emerald" ? "text-emerald-500" : memberSlides[current].theme === "rose" ? "text-rose-500" : "text-blue-500"
                 )} />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Atualização em tempo real</span>
              </div>
              
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                {memberSlides[current].subtitle}
              </h4>
              
              <h2 className="text-3xl md:text-4xl font-display font-medium text-white mb-4 tracking-tight drop-shadow-sm">
                {memberSlides[current].title}
              </h2>
              
              <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed">
                {memberSlides[current].description}
              </p>
            </div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn(
                "hidden sm:flex w-24 h-24 rounded-2xl bg-slate-800 border border-white/5 items-center justify-center shadow-inner relative overflow-hidden group"
              )}
            >
              <div className={cn(
                "absolute inset-0 opacity-10 transition-opacity duration-1000 group-hover:opacity-20",
                memberSlides[current].theme === "emerald" ? "bg-emerald-500" : memberSlides[current].theme === "rose" ? "bg-rose-500" : "bg-blue-500" 
              )} />
              <div className="relative z-10">
                {memberSlides[current].icon}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de Slide */}
      <div className="absolute bottom-8 left-8 flex gap-2 z-20">
        {memberSlides.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 transition-all duration-700 rounded-full",
              i === current ? "w-8 bg-blue-500" : "w-2.5 bg-slate-700"
            )}
          />
        ))}
      </div>

      {/* Info de Segurança */}
      <div className="absolute bottom-8 right-8 flex items-center gap-2 opacity-50 z-20 hidden md:flex">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ambiente 100% Auditado</span>
      </div>
    </div>
  );
}
