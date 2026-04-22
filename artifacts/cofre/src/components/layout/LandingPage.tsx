import React, { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";
import { 
  ShieldCheck, Wallet, UserPlus, Lock, Eye, EyeOff, 
  BarChart3, Building, ChevronRight, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const feats = [
  { 
    icon: ShieldCheck, 
    label: "Segurança de Cripto-nível", 
    desc: "A infraestrutura é blindada com padrões de encriptação militar, assegurando as suas transações."
  },
  { 
    icon: BarChart3, 
    label: "Monitorização em Tempo Real", 
    desc: "Acompanhe os rendimentos e a evolução do seu capital através de relatórios e painéis dinâmicos."
  },
  { 
    icon: Building, 
    label: "Governança Transparente", 
    desc: "Gestão fiduciária com auditorias registadas a cada movimento e distribuição de lucros rigorosa."
  },
];

export function LandingPage() {
  const { login: adminLogin } = useAdmin();
  const { login: memberLogin } = useMember();
  const { toast } = useToast();

  const [view, setView] = useState<"landing" | "admin-login" | "member-login">("landing");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberPin, setMemberPin] = useState("");
  const [showMemberPin, setShowMemberPin] = useState(false);
  const [error, setError] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(adminId, password)) {
      toast({ title: "Acesso Autorizado", description: "Sessão corporativa iniciada com sucesso." });
    } else {
      setError(true);
      toast({ title: "Falha na Autenticação", description: "Credenciais de gestão inválidas.", variant: "destructive" });
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberLogin(memberPhone, memberPin)) setError(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0F1C] text-slate-100 flex flex-col justify-center items-center">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-blue-500/10 mix-blend-screen blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-indigo-500/10 mix-blend-screen blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative z-20 overflow-x-hidden">
          {view === "landing" && (
            <div className="w-full max-w-5xl mx-auto space-y-8 md:space-y-16">
              <div className="text-center space-y-4 md:space-y-8">
                <div 
                  onClick={() => {
                    setLogoClicks(prev => prev + 1);
                    if (logoClicks >= 2) { // 3 cliques para revelar
                      setView("admin-login");
                      setLogoClicks(0);
                    }
                  }}
                  className="mx-auto w-24 h-24 sm:w-40 sm:h-40 relative drop-shadow-[0_0_40px_rgba(37,99,235,0.4)] cursor-default select-none active:scale-95 transition-transform"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                    <defs>
                      <linearGradient id="landing-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF1B8" />
                        <stop offset="50%" stopColor="#EBB320" />
                        <stop offset="100%" stopColor="#9E7606" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="46" fill="url(#landing-gold-grad)" />
                    <circle cx="50" cy="50" r="39" fill="#1E3A8A" />
                    <path d="M50 22 L76 34 L76 56 C76 78 50 88 50 88 C50 88 24 78 24 56 L24 34 L50 22 Z" fill="url(#landing-gold-grad)" />
                  </svg>
                </div>
                <div className="space-y-2 md:space-y-4">
                  <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] text-white">
                    Cofre <span className="text-blue-500">Elite</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.4em] text-blue-400">
                    Sistemas de Gestão de Capital e Investimento
                  </p>
                </div>
              </div>

              <div className="flex justify-center max-w-sm mx-auto w-full">
                <button
                  onClick={() => setView("member-login")}
                  className="w-full group relative overflow-hidden glass-panel border-white/5 hover:border-blue-500/30 p-8 rounded-[2.5rem] transition-all text-center shadow-2xl"
                >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Área do Investidor</div>
                        <div className="text-2xl font-black text-white italic tracking-tighter uppercase">Entrar no Cofre</div>
                      </div>
                    </div>
                </button>
              </div>

              <div className="text-center pt-8">
                 <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                 >
                   <UserPlus className="w-4 h-4" /> Solicitar Abertura de Conta
                 </button>
              </div>
            </div>
          )}

          {(view === "admin-login" || view === "member-login") && (
            <div className="w-full max-w-md mx-auto px-4">
              <div className="glass-panel rounded-[3rem] p-8 md:p-12 border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl text-left">
                <button
                  onClick={() => { setView("landing"); setError(false); }}
                  className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/30 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                </button>

                <form onSubmit={view === "admin-login" ? handleAdminSubmit : handleMemberSubmit} className="space-y-5">
                  {view === "admin-login" ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">ID Corporativo</label>
                        <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Senha Mestra</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Telefone</label>
                        <input type="tel" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">PIN</label>
                        <input type="password" value={memberPin} maxLength={6} onChange={(e) => setMemberPin(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-center tracking-[0.5em]" />
                      </div>
                    </div>
                  )}
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">Confirmar</button>
                </form>
              </div>
            </div>
          )}
      </div>

      <MembershipRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
