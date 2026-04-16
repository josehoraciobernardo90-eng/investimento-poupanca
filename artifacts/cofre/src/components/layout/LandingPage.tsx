import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { MembershipRegistrationModal } from "@/components/members/MembershipRegistrationModal";
import { Shield, Wallet, UserPlus, Users, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";

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
      toast({ title: "Acesso Concedido", description: "Bem-vindo ao Painel Administrativo." });
    } else {
      setError(true);
      toast({ title: "Erro de Autenticação", description: "ID ou Senha incorretos.", variant: "destructive" });
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
    <div className="fixed inset-0 z-50 bg-[#020202] overflow-y-auto selection:bg-primary/30 selection:text-white">
      {/* Background 3D Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px] -z-10"></div>
      
      {/* Animated Mesh Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10" />

      <div className="min-h-screen flex flex-col items-center justify-center p-6 perspective-[2000px]">
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div 
              key="landing-view"
              initial={{ opacity: 0, rotateX: 20, y: 50 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -10, transition: { duration: 0.4 } }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full max-w-5xl space-y-16 text-center py-12"
            >
              {/* Header / Logo Section Elite */}
              <div className="space-y-6 relative">
                <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   className="w-24 h-24 bg-gradient-to-br from-primary to-primary/40 rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(212,175,55,0.3)] relative group"
                >
                  <Shield className="w-12 h-12 text-black drop-shadow-lg" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-[2.2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                
                <h1 className="text-6xl md:text-9xl font-display font-black text-white tracking-tighter leading-none hero-glow italic">
                  COFRE <span className="text-primary not-italic">CAPITAL</span>
                </h1>
                
                <p className="text-muted-foreground text-sm max-w-md mx-auto font-black italic uppercase tracking-[0.5em] opacity-60">
                  Próxima Geração em Investimentos • Chimoio 2026
                </p>
              </div>

              {/* Central Action Button High-End */}
              <div className="flex justify-center items-center gap-6">
                 <button 
                  onClick={() => setView("member-login")}
                  className="btn-elite px-12 py-6 rounded-3xl text-sm italic group"
                 >
                    <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                    Área do Investidor
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

              {/* Action Grid 3D Depth */}
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.button
                  whileHover={{ y: -10, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsRegisterOpen(true)}
                  className="glass-card-elite p-10 rounded-[3rem] text-left group relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700">
                    <UserPlus className="w-48 h-48 rotate-12" />
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-8 text-primary border border-primary/20 shadow-inner group-hover:bg-primary group-hover:text-black transition-all">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3 italic">Nova Adesão</h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
                    Junte-se ao cofre exclusivo e faça seu capital crescer com segurança e transparência total.
                  </p>
                  <div className="inline-flex items-center gap-3 text-primary font-black uppercase tracking-widest text-[10px] group-hover:gap-5 transition-all">
                    Começar Cadastro <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ y: -10, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("admin-login")}
                  className="glass-card-elite p-10 rounded-[3rem] text-left group relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700">
                    <Lock className="w-48 h-48 -rotate-12" />
                  </div>
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mb-8 text-white/40 border border-white/10 shadow-inner group-hover:bg-white group-hover:text-black transition-all">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3 italic">Gestão Central</h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
                    Acesso restrito para auditores e administradores do sistema de alto escalão.
                  </p>
                  <div className="inline-flex items-center gap-3 text-white/40 font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-all">
                    Entrar no Painel <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>

              <div className="pt-12 flex flex-wrap justify-center gap-12 opacity-40">
                {["100% SEGURO", "CHIMOIO HEADQUARTERS", "CLOUD SECURITY V4"].map(text => (
                  <span key={text} className="text-[9px] font-black uppercase tracking-[0.4em] text-white">
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : view === "admin-login" ? (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, scale: 0.9, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 30 }}
              className="w-full max-w-sm"
            >
              <div className="glass-card-elite p-10 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-50"></div>
                
                <button 
                  onClick={() => setView("landing")}
                  className="mb-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-3 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary transition-colors">
                    <ArrowRight className="w-3 h-3 rotate-180" /> 
                  </div>
                  Voltar
                </button>

                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20 shadow-2xl animate-pulse-subtle">
                    <Lock className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Autenticação Master</h2>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">Acesso Nível Administrador</p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <input 
                      autoFocus
                      type="text" 
                      required 
                      value={adminId}
                      onChange={e => { setAdminId(e.target.value); setError(false); }}
                      className="input-elite"
                      placeholder="ID DE ACESSO"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(false); }}
                      className="input-elite"
                      placeholder="PALAVRA-PASSE"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="btn-elite w-full py-5 text-sm"
                  >
                    Desbloquear Cofre
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
             <motion.div
              key="member-view"
              initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -30 }}
              className="w-full max-w-sm"
            >
              <div className="glass-card-elite p-10 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success to-transparent opacity-50"></div>
                
                <button 
                  onClick={() => setView("landing")}
                  className="mb-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-3 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary transition-colors">
                    <ArrowRight className="w-3 h-3 rotate-180" /> 
                  </div>
                  Voltar
                </button>

                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20 shadow-2xl animate-pulse-subtle">
                    <Wallet className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Portal do Membro</h2>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">Mapa Financeiro em Real-Time</p>
                </div>

                <form onSubmit={handleMemberSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <input 
                      autoFocus
                      type="text" 
                      required 
                      value={memberPhone}
                      onChange={e => { setMemberPhone(e.target.value); setError(false); }}
                      className="input-elite"
                      placeholder="TEL / IDENTIFICADOR"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type={showMemberPin ? "text" : "password"} 
                        required 
                        maxLength={6}
                        inputMode="numeric"
                        value={memberPin}
                        onChange={e => { setMemberPin(e.target.value); setError(false); }}
                        className="input-elite text-center tracking-[0.6em] text-xl pl-12"
                        placeholder="••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowMemberPin(!showMemberPin)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showMemberPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn-elite w-full py-5 text-sm"
                  >
                    Aceder Investimentos
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
