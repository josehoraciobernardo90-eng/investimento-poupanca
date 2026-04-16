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

  // Lógica contextuai baseada nos dados do membro
  const hasActiveLoan = (loans || []).some(l => l.user_id === userData?.user?.id && l.status === "Ativo");
  const isHighEarner = (userData?.lucro_acumulado || 0) > 500000; // > 5000 MT (valor base 100)
  
  const memberSlides = [
    {
      id: "status",
      title: "CONTA: STATUS_OPERACIONAL",
      subtitle: "Integridade de Rede",
      description: `Seu patrimônio total de ${formatMT(userData?.patrimonioTotal || 0)} está protegido por criptografia de ponta a ponta. Sessão segura ativa.`,
      icon: <ShieldCheck className="w-8 h-8" />,
      color: "primary",
      stats: "SEC_LEVEL: ALPHA"
    },
    ...(hasActiveLoan ? [{
      id: "loan_alert",
      title: "ALERTA: ATIVO_CIRCULANTE",
      subtitle: "Monitoramento de Prazo",
      description: "Detectamos um empréstimo ativo. Mantenha os pagamentos em dia para evitar o congelamento automático da conta.",
      icon: <ShieldAlert className="w-8 h-8 text-secondary" />,
      color: "secondary",
      stats: "RISK_LOCK: ENABLED"
    }] : []),
    {
      id: "growth",
      title: isHighEarner ? "STATUS: INVESTIDOR_ELITE" : "OPORTUNIDADE: APORTE_CLOUD",
      subtitle: isHighEarner ? "Performance de Alta Performance" : "Rentabilidade Garantida",
      description: isHighEarner 
        ? "Seu histórico de lucros superou a meta trimestral. Você tem prioridade máxima em novos fundos."
        : "Aumente seu saldo base para capturar uma fatia maior dos juros do próximo ciclo de empréstimos.",
      icon: <TrendingUp className="w-8 h-8" />,
      color: isHighEarner ? "primary" : "primary",
      stats: `ROI_EST: +10% MO`
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % memberSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [memberSlides.length]);

  return (
    <div className="relative w-full h-[280px] rounded-[2rem] overflow-hidden glass-card-elite tech-grid-bg border-primary/10">
      <div className="scanline-overlay opacity-20" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={memberSlides[current].id}
          initial={{ opacity: 0, scale: 1.05, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -30 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="absolute inset-0 p-8 flex flex-col justify-center"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-black/60 border border-white/10 mb-5">
                 <Activity className={cn("w-3 h-3 animate-pulse", memberSlides[current].color === 'primary' ? "text-primary" : "text-secondary")} />
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 font-mono">
                    {memberSlides[current].stats}
                 </span>
              </div>
              
              <h4 className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.5em] mb-1 font-mono">
                {memberSlides[current].subtitle}
              </h4>
              
              <h2 className={cn(
                "text-2xl md:text-4xl font-display font-black tracking-tighter italic mb-4 uppercase",
                memberSlides[current].color === 'primary' ? "text-glow-blue text-white" : "text-glow-red text-white"
              )}>
                {memberSlides[current].title}
              </h2>
              
              <p className="text-xs text-white/30 max-w-lg font-mono leading-relaxed italic">
                {memberSlides[current].description}
              </p>
            </div>

            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className={cn(
                "hidden sm:flex w-20 h-20 rounded-2xl bg-black/60 border border-white/5 items-center justify-center text-white/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]",
                memberSlides[current].color === 'primary' ? "border-primary/20 shadow-primary/5" : "border-secondary/20 shadow-secondary/5"
              )}
            >
              {memberSlides[current].icon}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators Cyber */}
      <div className="absolute bottom-6 left-8 flex gap-2">
        {memberSlides.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1 transition-all duration-500 rounded-full",
              i === current ? "w-8 bg-primary" : "w-2 bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Security Info Tag */}
      <div className="absolute bottom-6 right-8 flex items-center gap-2 opacity-40">
        <Info className="w-3 h-3" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Quantum Data Encryption Active</span>
      </div>
    </div>
  );
}
