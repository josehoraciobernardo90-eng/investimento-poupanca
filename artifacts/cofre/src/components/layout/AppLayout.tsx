import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Coins, ArrowLeftRight, History, Vault, Lock, Unlock, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { AdminAuthModal } from "@/components/layout/AdminAuthModal";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membros", label: "Membros", icon: Users },
  { href: "/emprestimos", label: "Empréstimos", icon: Coins },
  { href: "/solicitacoes", label: "Solicitações", icon: ArrowLeftRight },
  { href: "/auditoria", label: "Auditoria", icon: History },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAdmin, logout } = useAdmin();
  const [showAuth, setShowAuth] = useState(false);
  
  const isRestrictedRoute = location.startsWith("/solicitacoes") || location.startsWith("/auditoria");
  const accessDenied = isRestrictedRoute && !isAdmin;

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Sidebar Elite */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex-shrink-0 flex flex-col z-20 hidden md:flex h-screen"
      >
        <div className="h-28 flex flex-col justify-center px-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 group-hover:rotate-12 transition-transform duration-500">
                <Vault className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h1 className="font-display font-black text-2xl tracking-tighter text-white leading-none">Cofre<span className="text-primary italic">Elite</span></h1>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Management v4</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 py-10 px-6 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10 font-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5 hover:translate-x-1"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabElite" 
                    className="absolute left-0 top-1/4 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" : "text-muted-foreground group-hover:text-white")} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6">
          <div className="glass-panel p-4 rounded-3xl border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
            <div className="flex items-center gap-4">
               <div className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
                 isAdmin ? "bg-primary text-black" : "bg-white/5 text-muted-foreground"
               )}>
                  {isAdmin ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
               </div>
               <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest pl-1">Acesso Mestre</p>
                  <button 
                    onClick={() => isAdmin ? logout() : setShowAuth(true)}
                    className="text-sm font-bold text-white hover:text-primary transition-colors pl-1"
                  >
                    {isAdmin ? "Desconectar" : "Fazer Login"}
                  </button>
               </div>
               {isAdmin && (
                  <button onClick={logout} className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive transition-all">
                     <LogOut className="w-4 h-4" />
                  </button>
               )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen bg-black/20">
        {/* Mobile Header Elite */}
        <header className="md:hidden h-20 border-b border-white/5 flex items-center justify-between px-6 bg-black/60 backdrop-blur-3xl z-30">
          <div className="flex items-center gap-3">
             <Vault className="w-8 h-8 text-primary group-active:rotate-12 transition-transform" />
             <h1 className="font-display font-black text-xl text-white tracking-tighter">Cofre<span className="text-primary">Elite</span></h1>
          </div>
        </header>

        {/* Dynamic Page Background */}
        <div className="absolute inset-0 -z-10 bg-grid-white/[0.02] pointer-events-none" />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-14 scroll-smooth pb-32 md:pb-14">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {accessDenied ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[70vh] text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-destructive/20 blur-3xl animate-pulse rounded-full" />
                    <ShieldAlert className="w-24 h-24 text-destructive relative z-10 drop-shadow-2xl" />
                  </div>
                  <h2 className="text-4xl font-display font-black text-white mb-4 tracking-tighter uppercase italic">Acesso Restrito</h2>
                  <p className="text-muted-foreground max-w-sm mb-10 font-medium leading-relaxed">Este corredor de dados exige credenciais de nível 1. Identifique-se para prosseguir.</p>
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="btn-elite"
                  >
                    <Lock className="w-5 h-5 mr-2"/> Autenticar Gestor
                  </button>
                </motion.div>
              ) : (
                <motion.div key={location} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Mobile Nav Elite */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 z-50 shadow-2xl shadow-black">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-16 rounded-3xl transition-all duration-300",
                  isActive ? "bg-primary/10 text-primary scale-110 shadow-inner" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </main>
      
      <AdminAuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}
