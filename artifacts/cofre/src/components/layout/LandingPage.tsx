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
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto">
      {/* Background visual elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] -z-10"></div>

      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div 
              key="landing-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl space-y-12 text-center"
            >
              {/* Header / Logo Section */}
              <div className="space-y-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/20"
                >
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tight">
                  Cofre <span className="text-primary italic">Capital</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto font-medium opacity-80 uppercase tracking-widest">
                  Investimento Seguro & Crescimento Coletivo
                </p>
              </div>

              <div className="flex justify-center gap-4">
                 <button 
                  onClick={() => setView("member-login")}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-white/5 active:scale-95"
                 >
                    <Wallet className="w-5 h-5 text-primary" /> Entrar como Membro
                 </button>
              </div>

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {/* Member Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsRegisterOpen(true)}
                  className="glass-panel p-8 rounded-[2.5rem] text-left group relative overflow-hidden transition-all border-white/5 hover:border-primary/30"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <UserPlus className="w-24 h-24" />
                  </div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Quero ser Membro</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Junte-se ao cofre, faça seus aportes e acompanhe o crescimento do seu capital em tempo real.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    Começar Cadastro <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>

                {/* Admin Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("admin-login")}
                  className="glass-panel p-8 rounded-[2.5rem] text-left group relative overflow-hidden transition-all border-white/5 hover:border-blue-500/30"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Lock className="w-24 h-24" />
                  </div>
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Administração</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Acesso restrito para gestores do cofre. Controle de fluxos, aprovações e auditoria.
                  </p>
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    Entrar no Painel <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>

              {/* Stats / Proof */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 border-t border-white/5">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">100%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Seguro</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">Chimoio</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sede Local</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">24/7</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Acompanhamento</div>
                </div>
              </div>
            </motion.div>
          ) : view === "admin-login" ? (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-primary"></div>
                
                <button 
                  onClick={() => setView("landing")}
                  className="mb-8 text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Voltar ao Início
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Login Administrativo</h2>
                  <p className="text-muted-foreground text-sm mt-1">Apenas gestores autorizados com credenciais mestras.</p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground px-1">ID do Gestor</label>
                    <input 
                      autoFocus
                      type="text" 
                      required 
                      value={adminId}
                      onChange={e => { setAdminId(e.target.value); setError(false); }}
                      className={`w-full bg-black/60 border ${error ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono`}
                      placeholder="Ex: 123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground px-1">Senha de Acesso</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(false); }}
                      className={`w-full bg-black/60 border ${error ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono`}
                      placeholder="••••••••"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                  >
                    Desbloquear Sistema
                  </button>
                </form>

                <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-[0.2em]">
                  Painel de Controle Cloud
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="member-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-success"></div>
                
                <button 
                  onClick={() => setView("landing")}
                  className="mb-8 text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Voltar ao Início
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Área do Membro</h2>
                  <p className="text-muted-foreground text-sm mt-1">Aceda ao seu mapa de capital e investimentos.</p>
                </div>

                <form onSubmit={handleMemberSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground px-1">Telefone / ID</label>
                    <input 
                      autoFocus
                      type="text" 
                      required 
                      value={memberPhone}
                      onChange={e => { setMemberPhone(e.target.value); setError(false); }}
                      className={`w-full bg-black/60 border ${error ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono`}
                      placeholder="+258..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground px-1">PIN de Segurança (6 dígitos)</label>
                    <div className="relative">
                      <input 
                        type={showMemberPin ? "text" : "password"} 
                        required 
                        maxLength={6}
                        inputMode="numeric"
                        value={memberPin}
                        onChange={e => { setMemberPin(e.target.value); setError(false); }}
                        className={`w-full bg-black/60 border ${error ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono text-center tracking-[0.5em] text-xl`}
                        placeholder="••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowMemberPin(!showMemberPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showMemberPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                  >
                    Entrar no Cofre
                  </button>
                </form>

                <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-[0.2em]">
                  Protegido por PIN Individual
                </p>
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
