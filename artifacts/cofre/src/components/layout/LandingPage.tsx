import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";
import { 
  ShieldCheck, Wallet, UserPlus, Users, ArrowRight, Lock, Eye, EyeOff, 
  BarChart3, Banknote, Building, ChevronRight, CheckCircle2
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
      {/* ── Corporate Background Layers ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-blue-500/10 mix-blend-screen blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-indigo-500/10 mix-blend-screen blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative z-20 overflow-x-hidden">
        <AnimatePresence mode="wait">

          {/* ═══════ CORPORATE MAIN LANDING ═══════ */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
              className="w-full max-w-5xl mx-auto space-y-8 md:space-y-16"
            >
              {/* ── Brand & Typography ── */}
              <div className="text-center space-y-4 md:space-y-8">
                <motion.div 
                  initial={{ rotateY: -90, scale: 0.6, opacity: 0 }} 
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }} 
                  transition={{ type: "spring", damping: 15, stiffness: 100, duration: 1.2 }}
                  className="mx-auto w-24 h-24 sm:w-40 sm:h-40 relative drop-shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform duration-500"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="landing-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF1B8" />
                        <stop offset="50%" stopColor="#EBB320" />
                        <stop offset="100%" stopColor="#9E7606" />
                      </linearGradient>
                      <linearGradient id="landing-blue-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1E3A8A" /> {/* Blue-900 */}
                        <stop offset="100%" stopColor="#2563EB" /> {/* Blue-600 */}
                      </linearGradient>
                      <filter id="landing-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    
                    {/* Outer Gold Ring */}
                    <circle cx="50" cy="50" r="46" fill="url(#landing-gold-grad)" stroke="#FFFFFF" strokeWidth="1" filter="url(#landing-glow)"/>
                    
                    {/* Inner Rich Blue Base */}
                    <circle cx="50" cy="50" r="39" fill="url(#landing-blue-grad)" />
                    
                    {/* Inner Gold Shield Base */}
                    <path d="M50 22 L76 34 L76 56 C76 78 50 88 50 88 C50 88 24 78 24 56 L24 34 L50 22 Z" fill="url(#landing-gold-grad)" />
                    
                    {/* Shield Cutout (Dark Blue Core) */}
                    <path d="M50 28 L69 38 L69 54 C69 70 50 80 50 80 C50 80 31 70 31 54 L31 38 L50 28 Z" fill="#0A0F1C" />
                    
                    {/* Keyhole */}
                    <circle cx="50" cy="46" r="7" fill="url(#landing-gold-grad)" />
                    <path d="M45 48 L55 48 L53 66 L47 66 Z" fill="url(#landing-gold-grad)" />
                    <circle cx="50" cy="64" r="2" fill="#0A0F1C" />
                  </svg>
                </motion.div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-sm font-semibold tracking-wide shadow-sm">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse" />
                  Plataforma de Gestão Fiduciária
                </div>

                <div>
                  <h1 className="font-display font-semibold text-5xl whitespace-nowrap sm:text-7xl md:text-[5.5rem] tracking-tight leading-tight drop-shadow-lg">
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">Cofre</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#EBB320] via-[#FFF1B8] to-[#9E7606] font-light ml-1">Capital</span>
                  </h1>
                  <p className="mt-4 md:mt-6 text-slate-400 font-sans text-xs sm:text-lg max-w-2xl mx-auto font-light leading-relaxed px-4">
                    A excelência em gestão de poupanças e investimentos institucionais. Simplificamos o crescimento do seu capital através de governança transparente e tecnologia de ponta.
                  </p>
                </div>
              </div>

              {/* ── Ações Corporativas Premium ── */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-6">
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }} whileTap={{ y: 0, scale: 0.98 }}
                  onClick={() => setView("member-login")}
                  className="relative group w-full sm:w-auto py-4 px-10 text-base sm:text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 overflow-hidden border border-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  <span className="flex items-center justify-center relative z-10">
                    <Wallet className="w-5 h-5 mr-3 drop-shadow-md" />
                    Acesso à Conta
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ y: 0 }}
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full sm:w-auto py-4 px-10 text-base sm:text-lg rounded-2xl border border-slate-700/50 bg-slate-800/30 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-xl shadow-black/20"
                >
                  <span className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-3 text-[#EBB320]" />
                    Abrir Conta Institucional
                  </span>
                </motion.button>
              </div>

              {/* ── Value Proposition Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-6 pt-4 md:pt-12 border-t border-white/5">
                {feats.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.4 + i * 0.1 } }}
                    className="bg-transparent md:glass-panel p-1.5 md:p-8 group hover:bg-white/5 transition-all text-left flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0"
                  >
                    <div className="w-6 h-6 md:w-10 md:h-10 shrink-0 rounded-md md:rounded-xl bg-blue-500/10 flex items-center justify-center md:mb-5 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                      <f.icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-[11px] md:text-xl font-medium text-slate-100 mb-0 md:mb-3">{f.label}</h3>
                      <p className="font-sans text-[8.5px] md:text-sm text-slate-400 leading-tight md:leading-relaxed font-light">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── Link Admin Gestão ── */}
              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => setView("admin-login")}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-300 font-sans text-xs tracking-widest uppercase transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Portal Restrito para Gestão
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ LOGIN FORMS ═══════ */}
          {(view === "admin-login" || view === "member-login") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.25 } }}
              className="w-full max-w-md"
            >
              <div className={cn(
                "glass-card-elite p-8 sm:p-12 relative overflow-hidden",
                error && "border-rose-500/30 shadow-2xl shadow-rose-500/10"
              )}>
                
                {/* ── Decorator ── */}
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1",
                  view === "admin-login" ? "bg-gradient-to-r from-transparent via-indigo-500 to-transparent" : "bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                )} />

                <button
                  onClick={() => { setView("landing"); setError(false); }}
                  className="mb-10 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-sans text-sm font-medium"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Voltar ao Portal
                </button>

                <div className="text-center mb-10">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg",
                    view === "admin-login" ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                  )}>
                    {view === "admin-login" ? <Lock className="w-8 h-8" strokeWidth={1.5} /> : <Users className="w-8 h-8" strokeWidth={1.5} />}
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-white mb-2">
                    {view === "admin-login" ? "Gestão Corporativa" : "Portal do Cliente"}
                  </h2>
                  <p className="font-sans text-sm text-slate-400 font-light">
                    {view === "admin-login" ? "Acesso reservado para administradores credenciados." : "Aceda à sua área pessoal de investimentos e poupanças."}
                  </p>
                </div>

                <form onSubmit={view === "admin-login" ? handleAdminSubmit : handleMemberSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {view === "admin-login" ? "ID Institucional" : "Telefone de Registo"}
                    </label>
                    <input
                      autoFocus
                      type="text"
                      required
                      value={view === "admin-login" ? adminId : memberPhone}
                      onChange={e => { view === "admin-login" ? setAdminId(e.target.value) : setMemberPhone(e.target.value); setError(false); }}
                      className={cn("input-elite font-sans font-medium", error && "border-rose-500/40 bg-rose-500/5")}
                      placeholder={view === "admin-login" ? "ex: ADM-2024" : "ex: 840000000"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {view === "admin-login" ? "Palavra-passe" : "Protocolo PIN"}
                    </label>
                    <div className="relative">
                      <input
                        type={showMemberPin ? "text" : "password"}
                        required
                        maxLength={view === "member-login" ? 6 : 30}
                        value={view === "admin-login" ? password : memberPin}
                        onChange={e => { view === "admin-login" ? setPassword(e.target.value) : setMemberPin(e.target.value); setError(false); }}
                        className={cn("input-elite tracking-widest pr-14 font-medium", error && "border-rose-500/40 bg-rose-500/5")}
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMemberPin(!showMemberPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showMemberPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-rose-400 text-xs font-medium text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                        Credenciais não reconhecidas. Tente novamente.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="w-full btn-primary mt-4 py-4"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Autenticar e Entrar
                  </button>
                </form>

                {view === "member-login" && (
                  <p className="text-center mt-8 font-sans text-sm font-light text-slate-400">
                    Ainda não possui conta corporativa?{" "}
                    <button
                      type="button"
                      onClick={() => { setView("landing"); setTimeout(() => setIsRegisterOpen(true), 300); }}
                      className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                    >
                      Solicitar Abertura
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <MembershipRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
