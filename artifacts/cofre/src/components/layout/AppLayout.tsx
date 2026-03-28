import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Coins, ArrowLeftRight, History, Vault, Lock, Unlock, ShieldAlert } from "lucide-react";
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
  
  // Rotas restritas que exigem auth admin
  const isRestrictedRoute = location.startsWith("/solicitacoes") || location.startsWith("/auditoria");
  const accessDenied = isRestrictedRoute && !isAdmin;

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 border-r border-white/5 bg-card/40 backdrop-blur-xl flex-shrink-0 flex flex-col z-20 hidden md:flex"
      >
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Vault className="w-8 h-8 text-primary mr-3" />
          <h1 className="font-display font-bold text-xl tracking-tight text-white">Cofre<span className="text-primary">Capital</span></h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10 font-medium" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute left-0 top-0 w-1 h-full bg-primary rounded-r-full"
                  />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => isAdmin ? logout() : setShowAuth(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${isAdmin ? 'bg-gradient-to-tr from-success to-success/50 text-success-foreground' : 'bg-gradient-to-tr from-muted to-muted-foreground/50 text-white'}`}>
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Administrador</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Desbloqueado" : "Bloqueado"}</p>
            </div>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Vault className="w-6 h-6 text-primary" />
            <h1 className="font-display font-bold text-lg text-white">Cofre<span className="text-primary">Capital</span></h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {accessDenied ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[60vh] text-center"
                >
                  <ShieldAlert className="w-20 h-20 text-destructive/50 mb-6" />
                  <h2 className="text-3xl font-bold text-white mb-2">Acesso Restrito</h2>
                  <p className="text-muted-foreground max-w-md mb-8">Esta área é reservada apenas para a administração do Cofre Capital.</p>
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90"
                  >
                    <Lock className="w-5 h-5"/> Desbloquear Acesso
                  </button>
                </motion.div>
              ) : (
                <motion.div key={location} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-xl",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={() => isAdmin ? logout() : setShowAuth(true)}
            className={cn("flex flex-col items-center justify-center w-14 h-14 rounded-xl", isAdmin ? "text-success" : "text-muted-foreground")}
          >
            {isAdmin ? <Unlock className="w-5 h-5 mb-1" /> : <Lock className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-medium">Admin</span>
          </button>
        </div>
      </main>
      
      <AdminAuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
