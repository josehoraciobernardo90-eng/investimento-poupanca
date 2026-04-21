import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, TrendingUp, Sparkles, MessageCircle, Share2, Zap, AlertCircle, Clock } from "lucide-react";
import { formatMT } from "@/lib/utils";

interface Dream {
  id: string;
  title: string;
  target: number;
  current: number;
  category: string;
}

const recentActivities = [
  { id: 1, type: "deposit", msg: "Novo aporte de capital validado!", time: "2 min atrás", icon: "✨" },
  { id: 2, type: "loan", msg: "Simulação de crédito aprovada para membro.", time: "15 min atrás", icon: "📈" },
  { id: 3, type: "liquidation", msg: "Contrato de crédito liquidado com bónus de 20%.", time: "40 min atrás", icon: "💎" },
  { id: 4, type: "penalty", msg: "Multa por atraso gerou rendimento ao coletivo.", time: "1h atrás", icon: "⚖️" },
];

export function GeralIntelligence({ memberBalance = 7500 }) {
  const [dreams, setDreams] = useState<Dream[]>([
    { id: "1", title: "Compra de Trator", target: 45000, current: memberBalance, category: "Investimento" }
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      
      {/* ── PAINEL DE SONHOS (Dreams Dashboard) ── */}
      <div className="lg:col-span-2 glass-panel p-6 border-t-4 border-t-purple-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <Target className="w-48 h-48 text-purple-400" />
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
               <Sparkles className="w-5 h-5 text-purple-400" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dashboard de Objectivos</h2>
               <p className="text-[10px] text-purple-400/70 font-semibold uppercase tracking-widest italic">Planeamento de Vida</p>
             </div>
          </div>
          <button className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-white hover:bg-purple-500/20 transition-all uppercase tracking-widest">
            Novo Sonho +
          </button>
        </div>

        <div className="space-y-6 relative z-10">
          {dreams.map((dream) => {
            const pct = (dream.current / dream.target) * 100;
            const remaining = dream.target - dream.current;
            const months = Math.ceil(remaining / (memberBalance * 0.05 || 100)); // Simulação simples

            return (
              <motion.div key={dream.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all group/item">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{dream.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold uppercase border border-purple-500/20">{dream.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase font-bold block">Falta</span>
                    <span className="text-xl font-display font-black text-white">{formatMT(remaining)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-400">Progresso Atual</span>
                    <span className="text-purple-400">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest py-1">
                    <Clock className="w-3 h-3" />
                    Projeção: Meta atingida em aprox. <span className="text-white mx-1">{months} meses</span> com este ritmo.
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── FEED DE ATIVIDADES (Live Feed) ── */}
      <div className="glass-panel p-6 flex flex-col h-full border-t-4 border-t-emerald-500">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
             <Zap className="w-5 h-5 text-emerald-400" />
           </div>
           <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feed do Cofre</h3>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
          {recentActivities.map((act, i) => (
            <motion.div 
              key={act.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:bg-white/5 transition-all cursor-default"
            >
              <span className="text-xl mt-0.5">{act.icon}</span>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-slate-200 leading-tight">{act.msg}</p>
                <span className="text-[9px] uppercase font-bold text-slate-550 mt-1 block opacity-40">{act.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
           <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all">
             <Share2 className="w-3.5 h-3.5" /> Enviar Relatório WhatsApp
           </button>
        </div>
      </div>

    </div>
  );
}
