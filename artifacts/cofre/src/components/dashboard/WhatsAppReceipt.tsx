import React from "react";
import { motion } from "framer-motion";
import { Share2, MessageCircle, CheckCircle2, Download } from "lucide-react";
import { formatMT } from "@/lib/utils";

interface WhatsAppReceiptProps {
  type: "aporte" | "liquidacao" | "extrato";
  data: {
    membro: string;
    valor: number;
    data: string;
    codigo: string;
    lucro?: number;
  };
}

export function WhatsAppReceipt({ type, data }: WhatsAppReceiptProps) {
  
  const generateWhatsAppText = () => {
    const title = type === "aporte" ? "*✅ CONFIRMAÇÃO DE APORTE*" : type === "liquidacao" ? "*💎 LIQUIDAÇÃO DE CONTRATO*" : "*📄 EXTRATO DE CONTA*";
    const text = `
${title}
--------------------------------
🏦 *COFRE CAPITAL - CHIMOIO*
--------------------------------
👤 *Membro:* ${data.membro}
💰 *Valor:* ${formatMT(data.valor)}
📅 *Data:* ${data.data}
🆔 *Código:* ${data.codigo.toUpperCase()}
${data.lucro ? `📈 *Lucro Gerado:* ${formatMT(data.lucro)}` : ""}

*Sistema Elite v4.0 - Transparência Total*
    `;
    
    const encoded = encodeURIComponent(text.trim());
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-8 max-w-sm mx-auto bg-gradient-to-b from-slate-900 to-black border-2 border-emerald-500/30 relative overflow-hidden"
    >
      {/* Elementos Estéticos */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
           <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        
        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Comprovante Digital</h2>
        <h3 className="text-xl font-display font-black text-white italic tracking-tighter mb-6 uppercase">
          Cofre<span className="text-emerald-500">Capital</span>
        </h3>

        <div className="space-y-4 text-left border-y border-white/5 py-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Beneficiário</span>
            <span className="text-xs font-bold text-white">{data.membro}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Valor Total</span>
            <span className="text-lg font-display font-black text-emerald-400">{formatMT(data.valor)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Referência</span>
            <span className="text-xs font-mono text-slate-300">{data.codigo.slice(0,8).toUpperCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={generateWhatsAppText}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
            <Download className="w-3.5 h-3.5" /> Salvar PDF
          </button>
        </div>
        
        <p className="mt-6 text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          // Chimoio, Moçambique - Protegido por Auditoria
        </p>
      </div>
    </motion.div>
  );
}
