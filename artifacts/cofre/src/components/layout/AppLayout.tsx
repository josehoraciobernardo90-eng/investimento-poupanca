import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Coins, ArrowLeftRight, History, Vault, Lock, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { AdminAuthModal } from "@/components/layout/AdminAuthModal";

const C = 'hsl(185 100% 50%)';
const C60 = 'rgba(0,212,255,0.6)';
const C20 = 'rgba(0,212,255,0.2)';
const C08 = 'rgba(0,212,255,0.08)';

const navItems = [
  { href: "/",           label: "PAINEL",    icon: LayoutDashboard },
  { href: "/membros",    label: "MEMBROS",   icon: Users },
  { href: "/emprestimos",label: "CRÉDITO",   icon: Coins },
  { href: "/solicitacoes",label: "PEDIDOS",  icon: ArrowLeftRight },
  { href: "/auditoria",  label: "AUDITORIA", icon: History },
];

function HudCorners({ size = 12, color = 'rgba(0,212,255,0.7)' }) {
  const s = { border: `1px solid ${color}`, width: size, height: size, position: 'absolute' as const };
  return (
    <>
      <span style={{ ...s, top: 0, left: 0, borderRight: 'none', borderBottom: 'none' }} />
      <span style={{ ...s, top: 0, right: 0, borderLeft: 'none', borderBottom: 'none' }} />
      <span style={{ ...s, bottom: 0, left: 0, borderRight: 'none', borderTop: 'none' }} />
      <span style={{ ...s, bottom: 0, right: 0, borderLeft: 'none', borderTop: 'none' }} />
    </>
  );
}

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,212,255,0.5)', fontSize: 10 }}>
      {t.toTimeString().slice(0, 8)}
    </span>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAdmin, logout } = useAdmin();
  const [showAuth, setShowAuth] = useState(false);

  const isRestrictedRoute = location.startsWith("/solicitacoes") || location.startsWith("/auditoria");
  const accessDenied = isRestrictedRoute && !isAdmin;

  return (
    <div className="min-h-screen flex text-foreground overflow-hidden" style={{ background: 'hsl(220 60% 3%)' }}>

      {/* ── SIDEBAR HUD ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-60 flex-shrink-0 flex flex-col z-20 hidden md:flex h-screen relative"
        style={{ background: 'rgba(0,4,12,0.97)', borderRight: '1px solid rgba(0,212,255,0.12)' }}
      >
        {/* Linha de energia vertical */}
        <div className="absolute right-0 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.4) 30%, rgba(0,212,255,0.4) 70%, transparent)' }} />

        {/* Logo */}
        <div className="h-16 flex items-center px-5 relative" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="flex items-center gap-3 w-full">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: C08, border: `1px solid ${C60}`, boxShadow: `0 0 10px rgba(0,212,255,0.2)` }}>
                <Vault className="w-4 h-4" style={{ color: C }} />
              </div>
              <div className="absolute inset-0 rounded" style={{ border: `1px solid ${C20}`, animation: 'hud-pulse 3s infinite' }} />
            </div>
            <div className="flex-1">
              <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.15em', textShadow: `0 0 10px ${C60}` }}>
                COFRE<span style={{ color: C }}>ELITE</span>
              </h1>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.4)', letterSpacing: '0.2em' }}>
                SYS v4.0 · <LiveClock />
              </div>
            </div>
          </div>
        </div>

        {/* Status online */}
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff8c', boxShadow: '0 0 6px #00ff8c' }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,255,140,0.6)', letterSpacing: '0.15em' }}>
            SISTEMA ONLINE · CHIMOIO-MZ
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.25)', letterSpacing: '0.2em', padding: '0 8px 8px' }}>
            // MÓDULOS
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 relative cursor-pointer group transition-all duration-150"
                  style={{
                    borderRadius: 3,
                    background: isActive ? 'rgba(0,212,255,0.06)' : 'transparent',
                    border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                    boxShadow: isActive ? '0 0 15px rgba(0,212,255,0.08), inset 0 0 15px rgba(0,212,255,0.02)' : 'none',
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: C, boxShadow: `0 0 8px ${C}` }} />
                  )}
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? C : 'rgba(0,212,255,0.25)', filter: isActive ? `drop-shadow(0 0 4px ${C})` : 'none' }} />
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.12em',
                    color: isActive ? 'rgba(0,212,255,0.9)' : 'rgba(0,212,255,0.3)',
                    textShadow: isActive ? `0 0 8px ${C60}` : 'none',
                  }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Admin Panel */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="relative p-3 rounded" style={{ background: 'rgba(0,212,255,0.03)', border: isAdmin ? '1px solid rgba(0,255,140,0.25)' : '1px solid rgba(0,212,255,0.1)' }}>
            <HudCorners size={8} color={isAdmin ? 'rgba(0,255,140,0.5)' : 'rgba(0,212,255,0.3)'} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: isAdmin ? 'rgba(0,255,140,0.1)' : 'rgba(0,212,255,0.05)', border: `1px solid ${isAdmin ? 'rgba(0,255,140,0.3)' : 'rgba(0,212,255,0.15)'}` }}>
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#00ff8c', filter: 'drop-shadow(0 0 4px #00ff8c)' }} /> : <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(0,212,255,0.3)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>
                  {isAdmin ? '// ADMIN AUTENTICADO' : '// ACESSO RESTRITO'}
                </div>
                <button onClick={() => isAdmin ? logout() : setShowAuth(true)} style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: isAdmin ? '#00ff8c' : 'rgba(0,212,255,0.5)', letterSpacing: '0.1em', textShadow: isAdmin ? '0 0 6px #00ff8c' : 'none' }}>
                  {isAdmin ? 'DESCONECTAR' : 'AUTENTICAR'}
                </button>
              </div>
              {isAdmin && (
                <button onClick={logout} className="p-1 rounded" style={{ color: 'rgba(255,0,128,0.4)' }} onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,0,128,0.8)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,0,128,0.4)')}>
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen">

        {/* Mobile Header HUD */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 z-30 relative" style={{ background: 'rgba(0,4,12,0.97)', borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <Vault className="w-5 h-5" style={{ color: C, filter: `drop-shadow(0 0 5px ${C})` }} />
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.15em', textShadow: `0 0 8px ${C60}` }}>
              COFRE<span style={{ color: C }}>ELITE</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff8c', boxShadow: '0 0 5px #00ff8c' }} />
            <button
              onClick={() => isAdmin ? logout() : setShowAuth(true)}
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: '0.12em', ...(isAdmin ? { background: 'rgba(0,255,140,0.08)', color: '#00ff8c', border: '1px solid rgba(0,255,140,0.25)', textShadow: '0 0 5px #00ff8c' } : { background: C08, color: 'rgba(0,212,255,0.6)', border: `1px solid ${C20}` }) }}
            >
              {isAdmin ? 'ADMIN' : 'LOGIN'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-28 md:pb-8">
          {accessDenied ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[65vh] text-center gap-8"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded border-2 flex items-center justify-center" style={{ borderColor: 'rgba(255,0,128,0.4)', background: 'rgba(255,0,128,0.05)', boxShadow: '0 0 40px rgba(255,0,128,0.15)' }}>
                  <HudCorners size={10} color="rgba(255,0,128,0.6)" />
                  <Lock className="w-8 h-8" style={{ color: 'rgba(255,0,128,0.7)', filter: 'drop-shadow(0 0 8px rgba(255,0,128,0.8))' }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 700, color: 'rgba(255,0,128,0.8)', textShadow: '0 0 20px rgba(255,0,128,0.4)', letterSpacing: '0.15em' }}>
                  ACESSO NEGADO
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(0,212,255,0.3)', marginTop: 8, letterSpacing: '0.1em' }}>
                  // NÍVEL DE CLEARANCE INSUFICIENTE
                </div>
              </div>
              <button onClick={() => setShowAuth(true)} className="btn-primary">
                <Lock className="w-3.5 h-3.5" /> AUTENTICAR SISTEMA
              </button>
            </motion.div>
          ) : (
            <div key={location} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {children}
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav HUD */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 z-50"
          style={{ height: '56px', background: 'rgba(0,4,12,0.97)', borderTop: '1px solid rgba(0,212,255,0.12)' }}
        >
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex flex-col items-center justify-center w-14 h-10 rounded cursor-pointer transition-all"
                  style={{ background: isActive ? C08 : 'transparent', border: isActive ? `1px solid ${C20}` : '1px solid transparent' }}
                >
                  <item.icon className="w-4 h-4" style={{ color: isActive ? C : 'rgba(0,212,255,0.25)', filter: isActive ? `drop-shadow(0 0 4px ${C})` : 'none' }} />
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 6, letterSpacing: '0.08em', color: isActive ? 'rgba(0,212,255,0.7)' : 'rgba(0,212,255,0.2)', marginTop: 2 }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </main>

      <AdminAuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
