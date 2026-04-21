import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Star, TrendingUp, ShieldCheck, Info, ArrowRight, Receipt, BellRing } from "lucide-react";
import { formatMT } from "@/lib/utils";

interface InnovationHubProps {
  memberBalance?: number;
  memberScore?: number;
}

export function InnovationHub({ memberBalance = 0, memberScore = 85 }: InnovationHubProps) {
  const [loanAmount, setLoanAmount] = useState(1000);
  const [showSim, setShowSim] = useState(false);

  // Cálculo do simulador: 10% primeiro mês, 50% após 30 dias (lógica do projeto)
  const juroPrevisto = loanAmount * 0.1;
  const totalPrevisto = loanAmount + juroPrevisto;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      
      {/* ── CARD 1: PONTUAÇÃO DE CONFIANÇA (FINTECH RATING) ── */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-panel p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16" /></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pontuação de Confiança</h3>
            <p className="text-[10px] text-amber-500/70 font-semibold tracking-widest uppercase">Score do Membro</p>
          </div>
        </div>
        
        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-display font-black text-white">{memberScore}</span>
          <span className="text-sm text-slate-500 font-medium mb-1.5">/ 100</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-slate-400">Nível de Acesso</span>
            <span className="text-emerald-400">Excelente</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${memberScore}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
            />
          </div>
        </div>
        <p className="mt-4 text-[10px] text-slate-400 italic">
          // Sua reputação permite taxas reduzidas e prioridade em levantamentos.
        </p>
      </motion.div>

      {/* ── CARD 2: SMART LOAN SIMULATOR ── */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-panel p-6 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-500/5 to-transparent relative"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Calculator className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador de Crédito</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Quanto deseja solicitar?</span>
              <span className="text-indigo-400 font-bold">{formatMT(loanAmount)}</span>
            </div>
            <input 
              type="range" min="500" max="25000" step="500"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold">
              <span className="text-slate-500">Juros (Fase 1 - 30 dias)</span>
              <span className="text-emerald-400">+{formatMT(juroPrevisto)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-white">
              <span>Total a Liquidar</span>
              <span className="text-indigo-400">{formatMT(totalPrevisto)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 3: AUDITORIA E PWA STATUS ── */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-panel p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent flex flex-col justify-between"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Performance Global</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>Sistema de Recibos: <span className="text-emerald-400 font-bold">ACTIVO</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <BellRing className="w-3.5 h-3.5 text-blue-400" />
            <span>Notificações PWA: <span className="text-blue-400 font-bold">READY</span></span>
          </div>
        </div>

        <button className="w-full mt-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all">
          Ver Relatório de Rendimento →
        </button>
      </motion.div>

    </div>
  );
}
