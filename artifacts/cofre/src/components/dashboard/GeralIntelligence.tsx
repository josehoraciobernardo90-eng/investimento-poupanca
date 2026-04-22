import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Share2, Zap, X, Activity } from "lucide-react";
import { formatMT } from "@/lib/utils";

interface InnovationProps {
  memberBalance?: number;
  recentRequests?: any[];
  isAdmin?: boolean;
}

export function GeralIntelligence({ memberBalance = 0, recentRequests = [], isAdmin = false }: InnovationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Função para gerar o Relatório Flash do WhatsApp
  const generateFlashReport = () => {
    const header = "*📊 RELATÓRIO FLASH - COFRE CAPITAL*\n_Resumo de actividades recentes_\n\n";
    const body = recentRequests.slice(0, 10).map(req => {
      const nome = req.user_nome || req.nome || "Membro";
      const valor = req.valor ? ` - ${formatMT(req.valor)}` : "";
      const status = req.status === "Aprovado" ? " ✅" : " 💰";
      return `• ${nome}${valor}${status}`;
    }).join("\n");
    
    const footer = "\n\n━━━━━━━━━━━━━━━━━━━━\n⚡ _Gerado via Sistema Elite v4.0_";
    const text = encodeURIComponent(header + body + footer);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Transformar solicitações do banco de dados em itens do Feed Real
  const activities = recentRequests.slice(0, 12).map((req, i) => {
    let msg = "";
    let icon = "✨";
    const nome = req.user_nome || req.nome || "Membro";
    
    if (req.valor) {
      const type = req.status === "Aprovado" ? "Liquidou" : "Solicitou";
      msg = `${nome} ${type} ${formatMT(req.valor)}`;
      icon = req.status === "Aprovado" ? "✅" : "💰";
    } else {
      msg = `Inscrição de ${nome} em sistema.`;
      icon = "👤";
    }
    
    return {
      id: req.id || i.toString(),
      msg,
      time: new Date(req.ts * (req.ts > 1e11 ? 1 : 1000)).toLocaleTimeString('pt-MZ'),
      icon
    };
  });

  return (
    <>
      {/* ── BOTÃO DISPARADOR (ÍCONE NO DASHBOARD) ── */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-900/40 rounded-3xl p-5 border border-white/5 flex items-center justify-between active:scale-95 transition-all group hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20">
              <Activity className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
           </div>
           <div className="text-left">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Actividade do Grupo</p>
              <h3 className="text-sm font-bold text-white">Feed ao Vivo do Cofre</h3>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
        </div>
      </button>

      {/* ── MODAL DO FEED (GAVETA) ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-0 sm:pb-4 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#090D14] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t border-white/10 sm:border border-white/5 shadow-[0_-20px_100px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col max-h-[85vh]"
            >
               {/* Header do Modal */}
               <div className="p-6 pb-2 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Zap className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div>
                        <h2 className="text-base font-black text-white italic uppercase tracking-tighter">Motor de Atividade</h2>
                        <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Actualizado em Tempo Real</p>
                     </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-3 bg-white/5 rounded-full text-slate-400">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Conteúdo do Feed */}
               <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                  {activities.length > 0 ? activities.map((act, i) => (
                    <motion.div 
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4"
                    >
                      <span className="text-xl mt-0.5">{act.icon}</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-slate-200 leading-tight">{act.msg}</p>
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-[9px] uppercase font-black text-slate-500 opacity-60 tracking-widest">{act.time}</span>
                           <span className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full">Verificado</span>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="py-20 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-20 italic">
                      Aguardando novas movimentações...
                    </div>
                  )}
               </div>

               {/* Footer / Botão WhatsApp */}
               <div className="p-6 bg-emerald-500/[0.02] border-t border-white/5">
                  <button 
                    onClick={generateFlashReport}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 text-black text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4" /> Relatório Flash WhatsApp
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
