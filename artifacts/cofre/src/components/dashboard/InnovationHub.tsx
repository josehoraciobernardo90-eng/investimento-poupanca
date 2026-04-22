import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { cn, formatMT } from "@/lib/utils";
import { dbStore } from "@/data/firebase-data";
import { Calculator, Star, TrendingUp, ShieldCheck, Info, ArrowRight, Receipt, BellRing } from "lucide-react";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";

interface InnovationHubProps {
  memberBalance?: number;
  loans?: any[]; 
  isAdmin?: boolean;
}

export function InnovationHub({ memberBalance = 0, loans = [], isAdmin = false }: InnovationHubProps) {
  const [loanAmount, setLoanAmount] = useState(1000);
  const [showRanking, setShowRanking] = useState(false);

  // MOTOR DE SCORE REALISTA
  const calculateScore = (targetLoans: any[] = loans) => {
    let baseScore = 75;
    if (!targetLoans || targetLoans.length === 0) return baseScore;
    targetLoans.forEach(emp => {
      if (emp.status === "Liquidado") baseScore += 5;
      if (emp.status === "Em espera") baseScore -= 10;
    });
    return Math.min(100, Math.max(0, baseScore));
  };

  const currentScore = calculateScore();
  const scoreLabel = currentScore > 80 ? "Excelente" : currentScore > 50 ? "Bom" : "Risco";
  const scoreColor = currentScore > 80 ? "text-emerald-400" : currentScore > 50 ? "text-amber-400" : "text-rose-400";

  // LÓGICA DE RANKING (APENAS PARA ADMIN)
  const getRanking = () => {
    if (!isAdmin) return [];
    
    // Agrupar empréstimos por usuário para calcular score individual
    const userMap: Record<string, { nome: string, loans: any[], score: number }> = {};
    
    // Buscar nomes reais do dbStore
    Object.values(dbStore.userDetails || {}).forEach((u: any) => {
       userMap[u.user.id] = { nome: u.user.nome, loans: [], score: 0 };
    });

    loans.forEach(loan => {
       if (userMap[loan.user_id]) {
          userMap[loan.user_id].loans.push(loan);
       }
    });

    return Object.values(userMap)
      .map(user => ({ ...user, score: calculateScore(user.loans) }))
      .sort((a, b) => b.score - a.score); // Melhores em cima
  };

  const ranking = getRanking();

  const juroPrevisto = loanAmount * 0.1;
  const totalPrevisto = loanAmount + juroPrevisto;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 relative">
      
      {/* ── CARD 1: PONTUAÇÃO (COM CLIQUE PARA RANKING) ── */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={() => isAdmin && setShowRanking(true)}
        className={cn(
          "glass-panel p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden group transition-all",
          isAdmin && "cursor-pointer hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
        )}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16" /></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isAdmin ? "Confiança do Grupo" : "Sua Confiança"}
            </h3>
            <p className="text-[10px] text-amber-500/70 font-semibold tracking-widest uppercase italic">Fintech Rating Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-display font-black text-white">{currentScore}</span>
          <span className="text-sm text-slate-500 font-medium mb-1.5">/ 100</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
            <span className="text-slate-400">Status Operacional</span>
            <span className={scoreColor}>{scoreLabel}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${currentScore}%` }}
              className={cn("h-full bg-gradient-to-r", 
                currentScore > 50 ? "from-amber-500 to-emerald-500" : "from-rose-500 to-amber-500"
              )}
            />
          </div>
        </div>
        <p className="mt-4 text-[10px] text-slate-500 italic leading-relaxed">
          {isAdmin 
            ? "// Clique no card para ver o ranking individual de cada membro."
            : "// Sua pontuação permite taxas reduzidas e prioridade em levantamentos."}
        </p>
      </motion.div>

      {/* ── MODAL DE RANKING DE ELITE (APENAS PORTA ADMIN) ── */}
      <AnimatePresence>
        {showRanking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRanking(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass-panel p-8 border-t-4 border-t-amber-500 bg-slate-900 shadow-[0_0_100px_rgba(251,191,36,0.3)]"
            >
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Ranking de Elite</h2>
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">Confiança Individual de Chimoio</p>
                  </div>
                  <button onClick={() => setShowRanking(false)} className="p-3 bg-white/5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all">
                    <ShieldCheck className="w-6 h-6" />
                  </button>
               </div>

               <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {ranking.map((user, i) => (
                    <motion.div 
                      key={user.nome}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "p-4 rounded-2xl flex items-center justify-between border transition-all",
                        i === 0 ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm",
                          i === 0 ? "bg-amber-500 text-black shadow-lg" : "bg-slate-800 text-slate-400 border border-white/10"
                        )}>
                          {i + 1}º
                        </div>
                        <div>
                          <p className={cn("font-bold text-lg leading-none", i === 0 ? "text-amber-400" : "text-white")}>{user.nome}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black mt-1">
                            {user.loans.length} Contratos • {user.loans.filter(l => l.status === "Liquidado").length} Sucessos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className={cn("text-2xl font-black font-display", 
                            user.score > 80 ? "text-emerald-400" : user.score > 50 ? "text-amber-400" : "text-rose-400"
                         )}>
                            {user.score}
                         </div>
                         <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SCORE</div>
                      </div>
                    </motion.div>
                  ))}
               </div>
               <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-50">
                 // O ranking é actualizado em tempo real com cada liquidação confirmada.
               </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CARD 2: SIMULADOR ── */}
      <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-500/5 to-transparent relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Calculator className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{isAdmin ? "Simulador de Proposta" : "Simule seu Crédito"}</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Valor Desejado</span>
              <span className="text-indigo-400 font-bold">{formatMT(loanAmount)}</span>
            </div>
            <input type="range" min="500" max="25000" step="500" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold">
              <span className="text-slate-500">Juros (Previsão 30 dias)</span>
              <span className="text-emerald-400">+{formatMT(juroPrevisto)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-white">
              <span>Total Estimado</span>
              <span className="text-indigo-400">{formatMT(totalPrevisto)}</span>
            </div>
          </div>
        </div>
      </motion.div>


    </div>
  );
}
