import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, ShieldAlert, LogOut, MessageSquare, ExternalLink } from "lucide-react";
import { useMember } from "@/hooks/use-member";
import { dbStore } from "@/data/firebase-data";
import { useToast } from "@/hooks/use-toast";

export const FrozenAccountScreen = () => {
  const { logout, memberUser } = useMember();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    import("@/data/firebase-data").then(({ storeEmitter }) => {
      const handler = () => setTick(t => t + 1);
      storeEmitter.addEventListener("change", handler);
      return () => storeEmitter.removeEventListener("change", handler);
    });
  }, []);

  const supportPhone = dbStore.dashboard.support_phone || "+258 84 000 0000";

  const handleCall = () => {
    window.location.href = `tel:${supportPhone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá Suporte, a minha conta (${memberUser?.nome || 'Membro'}) está congelada e necessito de assistência.`);
    window.open(`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${message}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="glass-panel-elite p-8 rounded-[2.5rem] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.15)] bg-slate-900/40 backdrop-blur-3xl relative overflow-hidden">
          {/* Decorative Ring */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Animated Icon Container */}
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)] border border-white/20"
              >
                <ShieldAlert className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </motion.div>
              <div className="absolute -inset-4 bg-rose-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter leading-tight">
                Acesso <span className="text-rose-500">Suspenso</span>
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-rose-500 to-transparent mx-auto rounded-full" />
            </div>

            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-[280px]">
              Detectamos uma inconsistência ou bloqueio administrativo na sua conta cofre.
            </p>

            <div className="w-full space-y-4 pt-4">
              {/* Support Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative group cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Phone className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Agente de Suporte</div>
                      <div className="text-lg font-mono font-bold text-white tracking-tighter group-hover:text-blue-400 transition-colors">
                        {supportPhone}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWhatsApp}
                  className="h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 group"
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  WhatsApp
                </button>
                <button
                  onClick={handleCall}
                  className="h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Ligar Agora
                </button>
              </div>

              <button
                onClick={() => {
                  logout();
                  toast({ title: "Sessão Terminada", description: "Aguardamos o seu contacto para regularização." });
                }}
                className="w-full h-12 flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
          
          {/* Bottom Security Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 opacity-30 grayscale pointer-events-none">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Segurança Gogoma AI</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white" />
          </div>
        </div>

        {/* Floating Intelligence Badge */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900 border border-white/10 shadow-2xl flex items-center gap-2 whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronização em Tempo Real Activa</span>
        </div>
      </motion.div>
    </div>
  );
};
