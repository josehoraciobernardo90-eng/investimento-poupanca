import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";
import { 
  Shield, Wallet, UserPlus, Users, ArrowRight, Lock, Eye, EyeOff, 
  Activity, CheckCircle, Zap, BarChart3, ShieldCheck, Database,
  Cpu, TrendingUp, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

const C = 'rgba(0,212,255,1)';
const G = 'rgba(0,255,140,1)';
const M = 'rgba(255,0,128,1)';

const feats = [
  { 
    icon: ShieldCheck, 
    color: C, 
    label: "Cofre Blindado", 
    desc: "Dados criptografados end-to-end via Firebase em tempo real.",
    tag: "AES-256"
  },
  { 
    icon: Zap, 
    color: G, 
    label: "Tempo Real", 
    desc: "Saldos e lucros actualizados ao milissegundo via sync.",
    tag: "< 14ms"
  },
  { 
    icon: BarChart3, 
    color: M, 
    label: "Auditoria Fiscal", 
    desc: "Sentinela automático verifica cada centavo depositado.",
    tag: "AUTO-AUDIT"
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
      toast({ title: "Acesso Liberado", description: "Bem-vindo ao Sistema de Controlo." });
    } else {
      setError(true);
      toast({ title: "Acesso Negado", description: "Código ou Senha incorrectos.", variant: "destructive" });
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberLogin(memberPhone, memberPin)) setError(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#020617]">
      {/* ── Animated background grid ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 tech-grid-bg opacity-30" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255,0,128,0.04) 0%, transparent 60%)' }} />
      </div>

      {/* ── Scanline overlay ── */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.025]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00d4ff 2px, #00d4ff 4px)' }} />

      <div className="min-h-screen flex flex-col items-center justify-center p-5 md:p-10 relative z-20">
        <AnimatePresence mode="wait">

          {/* ═══════ TELA PRINCIPAL ═══════ */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              className="w-full max-w-4xl space-y-14 text-center"
            >
              {/* ── Logo Sci-Fi ── */}
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Anel orbital externo */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-5 rounded-full"
                      style={{ border: '1px dashed rgba(0,212,255,0.25)' }}
                    />
                    {/* Anel orbital médio */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-3 rounded-full"
                      style={{ border: '1px solid rgba(0,255,140,0.15)' }}
                    />
                    {/* Pulso de fundo */}
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'rgba(0,212,255,0.15)' }}
                    />
                    {/* Ícone principal */}
                    <div
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] flex items-center justify-center"
                      style={{ background: 'rgba(0,8,20,0.9)', border: '1px solid rgba(0,212,255,0.4)', boxShadow: '0 0 40px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,212,255,0.05)' }}
                    >
                      <motion.div
                        animate={{ filter: ['drop-shadow(0 0 4px rgba(0,212,255,0.5))', 'drop-shadow(0 0 16px rgba(0,212,255,0.9))', 'drop-shadow(0 0 4px rgba(0,212,255,0.5))'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Shield className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: C }} />
                      </motion.div>
                      {/* Cantos HUD */}
                      <span className="absolute top-0 left-0 w-3 h-3" style={{ borderTop: `2px solid ${C}`, borderLeft: `2px solid ${C}`, borderRadius: '2px 0 0 0' }} />
                      <span className="absolute top-0 right-0 w-3 h-3" style={{ borderTop: `2px solid ${C}`, borderRight: `2px solid ${C}`, borderRadius: '0 2px 0 0' }} />
                      <span className="absolute bottom-0 left-0 w-3 h-3" style={{ borderBottom: `2px solid ${C}`, borderLeft: `2px solid ${C}`, borderRadius: '0 0 0 2px' }} />
                      <span className="absolute bottom-0 right-0 w-3 h-3" style={{ borderBottom: `2px solid ${C}`, borderRight: `2px solid ${C}`, borderRadius: '0 0 2px 0' }} />
                    </div>
                  </div>
                </div>

                {/* Status bar sistêmica */}
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="h-px w-12 opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${C})` }} />
                  <div className="flex items-center gap-2 px-3 py-1 rounded" style={{ background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.2)' }}>
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,255,140,0.8)', letterSpacing: '0.2em' }}>SISTEMA ACTIVO · CHIMOIO-MZ · NODE_SECURE</span>
                  </div>
                  <div className="h-px w-12 opacity-30" style={{ background: `linear-gradient(90deg, ${C}, transparent)` }} />
                </motion.div>

                {/* Título HUD */}
                <div>
                  <h1 style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-6xl sm:text-7xl md:text-9xl text-white">
                    COFRE
                    <span style={{ color: C, textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>ELITE</span>
                  </h1>
                  <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.2em' }} className="text-white/30 uppercase mt-4">
                    // Sistema de Gestão de Poupança e Investimento Colectivo
                  </p>
                </div>
              </div>

              {/* ── Botões de Acção ── */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                <motion.button
                  onClick={() => setView("member-login")}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden w-full sm:w-auto min-w-[220px] py-4 px-8 group"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.5)', borderRadius: 3, fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(0,212,255,0.9)', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
                >
                  <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)', translateX: '-100%' }} whileHover={{ translateX: '100%', transition: { duration: 0.5 } }} />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Wallet className="w-4 h-4" />
                    Entrar como Membro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => setIsRegisterOpen(true)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto min-w-[220px] py-4 px-8 group"
                  style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 3, fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase' }}
                >
                  <span className="flex items-center justify-center gap-3">
                    <UserPlus className="w-4 h-4" />
                    Quero Ser Membro
                  </span>
                </motion.button>
              </div>

              {/* ── Feature Cards HUD ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {feats.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.1 } }}
                    className="relative p-5 text-left overflow-hidden group"
                    style={{ background: 'rgba(0,8,20,0.8)', border: `1px solid ${f.color.replace('1)', '0.15)')}`, borderRadius: 4, boxShadow: `0 0 20px ${f.color.replace('1)', '0.04)')}` }}
                    whileHover={{ borderColor: f.color.replace('1)', '0.4)'), boxShadow: `0 0 30px ${f.color.replace('1)', '0.1)')}` }}
                  >
                    {/* Tag */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded" style={{ background: f.color.replace('1)', '0.08)'), fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: f.color.replace('1)', '0.6)'), letterSpacing: '0.1em' }}>{f.tag}</div>
                    {/* Canto HUD */}
                    <span className="absolute top-0 left-0 w-2.5 h-2.5" style={{ borderTop: `1px solid ${f.color.replace('1)', '0.5)')}`, borderLeft: `1px solid ${f.color.replace('1)', '0.5)')}` }} />

                    <motion.div
                      animate={{ filter: [`drop-shadow(0 0 3px ${f.color.replace('1)', '0.4)')})`, `drop-shadow(0 0 10px ${f.color})`, `drop-shadow(0 0 3px ${f.color.replace('1)', '0.4)')})`] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                      className="mb-4"
                    >
                      <f.icon className="w-6 h-6" style={{ color: f.color }} />
                    </motion.div>
                    <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }} className="mb-2 uppercase">{f.label}</h3>
                    <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* ── Acesso Admin Oculto ── */}
              <button
                onClick={() => setView("admin-login")}
                className="flex items-center gap-2 mx-auto group transition-all"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                <Lock className="w-3 h-3 group-hover:text-cyan-400 transition-colors" />
                <span className="group-hover:text-cyan-400/50 transition-colors">Área Restrita · Administrador</span>
              </button>
            </motion.div>
          )}

          {/* ═══════ FORMULÁRIOS DE LOGIN ═══════ */}
          {(view === "admin-login" || view === "member-login") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
              className="w-full max-w-sm"
            >
              <div className={cn(
                "relative overflow-hidden p-8 sm:p-10",
                error && "ring-1 ring-rose-500/30"
              )}
                style={{ background: 'rgba(0,8,20,0.92)', border: `1px solid ${view === 'admin-login' ? 'rgba(255,0,128,0.3)' : 'rgba(0,212,255,0.3)'}`, borderRadius: 4, boxShadow: `0 0 60px ${view === 'admin-login' ? 'rgba(255,0,128,0.08)' : 'rgba(0,212,255,0.08)'}` }}
              >
                {/* Linha topo */}
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${view === 'admin-login' ? M : C}, transparent)` }} />

                {/* Cantos HUD */}
                {[['top-0 left-0', 'border-t border-l'], ['top-0 right-0', 'border-t border-r'], ['bottom-0 left-0', 'border-b border-l'], ['bottom-0 right-0', 'border-b border-r']].map(([pos, borders], i) => (
                  <span key={i} className={`absolute ${pos} w-4 h-4 ${borders}`} style={{ borderColor: view === 'admin-login' ? 'rgba(255,0,128,0.5)' : 'rgba(0,212,255,0.5)' }} />
                ))}

                {/* Botão Voltar */}
                <button
                  onClick={() => { setView("landing"); setError(false); }}
                  className="mb-8 flex items-center gap-2 group transition-colors"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                >
                  <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" style={{ color: view === 'admin-login' ? M : C }} />
                  Voltar
                </button>

                {/* Ícone + Título */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-5">
                    <motion.div
                      animate={{ rotate: view === 'admin-login' ? [0, 5, -5, 0] : 360 }}
                      transition={view === 'admin-login' ? { duration: 3, repeat: Infinity, type: 'tween' } : { duration: 10, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 rounded-full"
                      style={{ border: `1px dashed ${view === 'admin-login' ? 'rgba(255,0,128,0.2)' : 'rgba(0,212,255,0.2)'}` }}
                    />
                    <div className="w-16 h-16 rounded flex items-center justify-center"
                      style={{ background: view === 'admin-login' ? 'rgba(255,0,128,0.06)' : 'rgba(0,212,255,0.06)', border: `1px solid ${view === 'admin-login' ? 'rgba(255,0,128,0.3)' : 'rgba(0,212,255,0.3)'}`, boxShadow: `0 0 20px ${view === 'admin-login' ? 'rgba(255,0,128,0.1)' : 'rgba(0,212,255,0.1)'}` }}
                    >
                      <motion.div animate={{ filter: [`drop-shadow(0 0 4px ${view === 'admin-login' ? M : C})`, `drop-shadow(0 0 14px ${view === 'admin-login' ? M : C})`, `drop-shadow(0 0 4px ${view === 'admin-login' ? M : C})`] }} transition={{ duration: 2, repeat: Infinity }}>
                        {view === "admin-login" ? <Lock className="w-8 h-8" style={{ color: M }} /> : <Users className="w-8 h-8" style={{ color: C }} />}
                      </motion.div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '0.05em' }}>
                    {view === "admin-login" ? "ACESSO_ADMIN" : "ACESSO_MEMBRO"}
                  </h2>
                  <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: view === 'admin-login' ? 'rgba(255,0,128,0.5)' : 'rgba(0,212,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }} className="mt-1">
                    {view === "admin-login" ? "// Área de Gestão Fiduciária" : "// Portal do Investidor"}
                  </p>
                </div>

                {/* Formulário */}
                <form onSubmit={view === "admin-login" ? handleAdminSubmit : handleMemberSubmit} className="space-y-4">
                  <input
                    autoFocus
                    type="text"
                    required
                    value={view === "admin-login" ? adminId : memberPhone}
                    onChange={e => { view === "admin-login" ? setAdminId(e.target.value) : setMemberPhone(e.target.value); setError(false); }}
                    className={cn("input-elite w-full", error && "border-rose-500/40")}
                    placeholder={view === "admin-login" ? "Código de Administrador" : "Telefone ou Código"}
                  />
                  <div className="relative">
                    <input
                      type={showMemberPin ? "text" : "password"}
                      required
                      maxLength={view === "member-login" ? 6 : 30}
                      value={view === "admin-login" ? password : memberPin}
                      onChange={e => { view === "admin-login" ? setPassword(e.target.value) : setMemberPin(e.target.value); setError(false); }}
                      className={cn("input-elite w-full tracking-widest pr-14", error && "border-rose-500/40")}
                      placeholder={view === "admin-login" ? "Senha" : "PIN (6 dígitos)"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberPin(!showMemberPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors"
                    >
                      {showMemberPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                      ⚠ Credenciais inválidas. Acesso negado.
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    className="relative overflow-hidden w-full py-4 mt-2 group"
                    style={{ background: view === 'admin-login' ? 'rgba(255,0,128,0.08)' : 'rgba(0,212,255,0.08)', border: `1px solid ${view === 'admin-login' ? 'rgba(255,0,128,0.5)' : 'rgba(0,212,255,0.5)'}`, borderRadius: 3, fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: view === 'admin-login' ? 'rgba(255,0,128,0.9)' : 'rgba(0,212,255,0.9)', textTransform: 'uppercase', boxShadow: `0 0 20px ${view === 'admin-login' ? 'rgba(255,0,128,0.1)' : 'rgba(0,212,255,0.1)'}` }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {view === "admin-login" ? "Entrar no Sistema" : "Aceder Minha Conta"}
                    </span>
                  </button>
                </form>

                {/* Registo membro */}
                {view === "member-login" && (
                  <p className="text-center mt-6" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    Ainda não é membro?{" "}
                    <button
                      type="button"
                      onClick={() => { setView("landing"); setTimeout(() => setIsRegisterOpen(true), 300); }}
                      style={{ color: C, fontWeight: 700 }}
                      className="hover:brightness-125 transition-all"
                    >
                      Registar-se
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

