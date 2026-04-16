import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";
import { Shield, Wallet, UserPlus, Users, ArrowRight, Lock, Eye, EyeOff, Activity, Globe, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { login: adminLogin } = useAdmin();
  const { login: memberLogin } = useMember();
  const { toast } = useToast();
  
  const [view, setView] = useState<"landing" | "admin-login" | "member-login">("landing");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // Admin Login State
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  
  // Member Login State
  const [memberPhone, setMemberPhone] = useState("");
  const [memberPin, setMemberPin] = useState("");
  const [showMemberPin, setShowMemberPin] = useState(false);

  const [error, setError] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(adminId, password)) {
      toast({ title: "Acesso Concedido", description: "Terminal Administrativo Liberado." });
    } else {
      setError(true);
      toast({ title: "Erro de Autenticação", description: "Credenciais Master Inválidas.", variant: "destructive" });
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberLogin(memberPhone, memberPin)) {
      // Toast is handled inside useMember
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto selection:bg-primary/30 selection:text-white font-sans">
      
      {/* Background 3D Depth Elements Cyber */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[160px] -z-10" />
      
      <div className="scanline-overlay opacity-30 -z-5" />

      <div className="min-h-screen flex flex-col items-center justify-center p-6 perspective-[2000px]">
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div 
              key="landing-view"
              initial={{ opacity: 0, rotateX: 20, y: 50 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -10, transition: { duration: 0.4 } }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="w-full max-w-5xl space-y-16 text-center py-12"
            >
              {/* Header / Logo Section Elite */}
              <div className="space-y-8 relative">
                <motion.div 
                   animate={{ y: [0, -10, 0], rotateY: [0, 10, -10, 0] }}
                   transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                   className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] mx-auto flex items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(0,212,255,0.2)] relative group"
                >
                  <Shield className="w-12 h-12 text-primary text-glow-blue" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-[2.6rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">
                    <Activity className="w-3 h-3 text-primary animate-pulse" />
                    STATUS: SECURE • NODE: CHIMOIO_01
                  </div>
                  <h1 className="text-6xl md:text-9xl font-display font-black text-white tracking-tighter leading-none text-glow-blue uppercase italic">
                    Cyber<span className="text-secondary not-italic">Vault</span>
                  </h1>
                </div>
                
                <p className="text-white/30 text-[10px] max-w-md mx-auto font-black italic uppercase tracking-[0.4em] leading-relaxed">
                   [Protocolo de Gestão de Ativos Cloud] • Alta Performance & Segurança Militar
                </p>
              </div>

              {/* Central Action Buttons High-End */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                 <button 
                  onClick={() => setView("member-login")}
                  className="btn-elite min-w-[280px]"
                 >
                    <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                    Terminal do Membro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
                 
                 <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="min-w-[280px] px-10 py-5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <UserPlus className="w-5 h-5" /> 
                    Nova Adesão
                 </button>
              </div>

              {/* Admin Access Anchor */}
              <div className="pt-8">
                <button 
                  onClick={() => setView("admin-login")}
                  className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary transition-colors flex items-center gap-3 mx-auto"
                >
                  <Lock className="w-3 h-3" />
                  ACESSO ADMINISTRATIVO RESTRITO
                </button>
              </div>

              {/* Info Badges */}
              <div className="pt-12 flex flex-wrap justify-center gap-12 opacity-30">
                {[
                  { icon: <Globe className="w-3 h-3"/>, text: "GLOBAL SYNC" },
                  { icon: <Cpu className="w-3 h-3"/>, text: "CLOUD V4 INFRA" },
                  { icon: <Shield className="w-3 h-3"/>, text: "100% AUDITABLE" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.4em] text-white">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.9, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              className="w-full max-w-sm"
            >
              <div className="glass-card-elite p-10 rounded-[3rem] relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50",
                  view === 'admin-login' ? "from-secondary to-transparent" : "from-primary to-transparent"
                )} />
                
                <button 
                  onClick={() => setView("landing")}
                  className="mb-10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-3 transition-colors group"
                >
                  <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> 
                  VOLTAR AO HUB
                </button>

                <div className="text-center mb-10">
                  <div className={cn(
                    "w-20 h-20 bg-black/40 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border transition-shadow",
                    view === 'admin-login' ? "text-secondary border-secondary/20 shadow-[0_0_30px_rgba(255,0,85,0.1)]" : "text-primary border-primary/20 shadow-[0_0_30px_rgba(0,212,255,0.1)]"
                  )}>
                    {view === 'admin-login' ? <Lock className="w-10 h-10" /> : <Users className="w-10 h-10" />}
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                    {view === 'admin-login' ? 'Master Auth' : 'Member Auth'}
                  </h2>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.25em] mt-2">
                    {view === 'admin-login' ? 'ACESSO NÍVEL ADMINISTRADOR' : 'MAPA FINANCEIRO EM REAL-TIME'}
                  </p>
                </div>

                <form onSubmit={view === 'admin-login' ? handleAdminSubmit : handleMemberSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <input 
                      autoFocus
                      type="text" 
                      required 
                      value={view === 'admin-login' ? adminId : memberPhone}
                      onChange={e => { view === 'admin-login' ? setAdminId(e.target.value) : setMemberPhone(e.target.value); setError(false); }}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/10"
                      placeholder={view === 'admin-login' ? "ID DE ACESSO" : "TELEFONE OU ID"}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type={showMemberPin ? "text" : "password"} 
                        required 
                        maxLength={view === 'member-login' ? 6 : 20}
                        value={view === 'admin-login' ? password : memberPin}
                        onChange={e => { view === 'admin-login' ? setPassword(e.target.value) : setMemberPin(e.target.value); setError(false); }}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/10 tracking-[0.2em]"
                        placeholder={view === 'admin-login' ? "SENHA MASTER" : "CERT PIN (6 DÍGITOS)"}
                      />
                      {view === 'member-login' && (
                        <button 
                          type="button"
                          onClick={() => setShowMemberPin(!showMemberPin)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showMemberPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className={cn(
                      "btn-elite w-full py-5 text-sm",
                      view === 'admin-login' ? "bg-gradient-to-r from-secondary/80 to-black border-secondary/20" : ""
                    )}
                  >
                    {view === 'admin-login' ? 'Desbloquear Terminal' : 'Aceder Investimentos'}
                  </button>
                </form>
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
