import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatMT } from "@/lib/utils";

interface CommunityProps {
  totalDistributed?: number;
  activeRate?: number;
}

export function CommunityPerformance({ totalDistributed = 125430.00, activeRate = 94 }: CommunityProps) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="w-5 h-5 text-emerald-500" />
        <h2 className="text-xl font-display font-bold text-white tracking-tight uppercase">Performance do Coletivo <span className="text-emerald-500">Chimoio</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Rendimento Total do Grupo */}
        <div className="lg:col-span-2 glass-panel p-6 bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
          
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Rendimento Total Distribuído</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <ArrowUpRight className="w-3 h-3" /> +12.4%
              </div>
            </div>
            <div className="text-4xl font-display font-black text-white tracking-tighter mb-2">
              {formatMT(125430.00)}
            </div>
            <p className="text-xs text-slate-500">Lucro acumulado e reinvestido na comunidade este ano.</p>
          </div>

          <div className="mt-8 flex gap-2">
             <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
               80% Rentabilidade
             </div>
             <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
               20% Bonificação
             </div>
          </div>
        </div>

        {/* Atividade de Membros */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Users className="w-6 h-6 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Rede Ativa</span>
          </div>
          <div>
             <div className="text-3xl font-display font-bold text-white mb-1">{activeRate}%</div>
             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2 shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${activeRate}%` }}
                   transition={{ duration: 1.5 }}
                   className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-semibold">Membros com movimentação regular este mês.</p>
          </div>
        </div>

        {/* Eficiência do Capital */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Uso do Fundo</span>
          </div>
          <div>
             <div className="text-3xl font-display font-bold text-white mb-1">Moçambique</div>
             <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-semibold">Capital 100% investido na economia local.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
