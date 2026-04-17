import { useDashboard } from "@/hooks/use-dashboard";
import { useLoans } from "@/hooks/use-loans";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { ResetAppModal } from "@/components/admin/ResetAppModal";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";
import { TechSlideshow } from "@/components/dashboard/TechSlideshow";
import { BankingCharts } from "@/components/dashboard/BankingCharts";
import { useSystemAudit } from "@/hooks/use-audit";
import { useRequests, useAdminComissao } from "@/hooks/use-requests";
import { Loader2, Wallet, Zap, TrendingUp, AlertCircle, ShieldAlert, Activity, Database, History, Coins, Clock, Settings, BarChart3, Cpu } from "lucide-react";
import { ReactNode } from "react";
import { dbStore } from "@/data/firebase-data";

const C = 'rgba(0,212,255,1)';
const C6 = 'rgba(0,212,255,0.6)';
const C2 = 'rgba(0,212,255,0.2)';
const C08 = 'rgba(0,212,255,0.08)';
const G = 'rgba(19, 223, 131, 1)';
const G6 = 'rgba(0,255,140,0.6)';
const M = 'rgba(255,0,128,1)';
const M2 = 'rgba(255,0,128,0.2)';

function HudCorners({ size = 10, color = C6 }: { size?: number; color?: string }) {
  const s = { position: 'absolute' as const, width: size, height: size };
  return (
    <>
      <span style={{ ...s, top: 0, left: 0, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span style={{ ...s, top: 0, right: 0, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, left: 0, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, right: 0, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}

function HudPanel({ children, className, color = C6, style = {} }: { children: ReactNode; className?: string; color?: string; style?: any }) {
  return (
    <div className={cn("relative", className)} style={{ background: 'rgba(0,8,20,0.85)', border: `1px solid ${color.replace('1)', '0.2)')}`, borderRadius: 4, ...style }}>
      <HudCorners color={color} />
      {children}
    </div>
  );
}

function HudLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function HudValue({ children, color = 'white', className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, color, textShadow: color !== 'white' ? `0 0 12px ${color}` : 'none' }}>
      {children}
    </span>
  );
}

// ── Living Icons HUD ──
function LivingIcon({ children, color = C, pulse = false }: { children: ReactNode; color?: string; pulse?: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {pulse && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
      )}
      <motion.div
        animate={pulse ? { filter: [`drop-shadow(0 0 2px ${color})`, `drop-shadow(0 0 8px ${color})`, `drop-shadow(0 0 2px ${color})`] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}

const Icons = {
  Caixa: () => (
    <LivingIcon color={C} pulse>
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 border border-dashed rounded-full opacity-20" style={{ borderColor: C }}
        />
        <Wallet className="w-4 h-4" style={{ color: C }} />
      </div>
    </LivingIcon>
  ),
  Investido: () => (
    <LivingIcon color={C6}>
      <div className="relative">
        <motion.div
          animate={{ y: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}
          className="relative z-10"
        >
          <Zap className="w-4 h-4" style={{ color: C, filter: `drop-shadow(0 0 5px ${C})` }} />
        </motion.div>
        <motion.div
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"
        />
      </div>
    </LivingIcon>
  ),
  Lucro: () => (
    <LivingIcon color={G} pulse>
      <div className="relative">
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: G, filter: `drop-shadow(0 0 5px ${G})` }} />
        </motion.div>
        <motion.div
          animate={{ x: [-10, 10, -10], opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-px bg-emerald-400/50"
        />
      </div>
    </LivingIcon>
  ),
  Alerta: ({ active }: { active: boolean }) => (
    <LivingIcon color={active ? M : 'rgba(0,212,255,0.3)'} pulse={active}>
      <div className="relative">
        {active && (
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-2 rounded-full"
            style={{ borderColor: M }}
          />
        )}
        <AlertCircle className="w-4 h-4" style={{ color: active ? M : 'rgba(0,212,255,0.3)' }} />
      </div>
    </LivingIcon>
  )
};

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: loans } = useLoans();
  const { isAdmin } = useAdmin();
  const { runAudit, isAuditing } = useSystemAudit();
  const comissao = useAdminComissao();

  if (isLoading) return <PageLoader />;
  if (isError || !data) return (
    <HudPanel style={{ padding: '1rem' }}>
      <div className="flex items-center gap-3" style={{ color: M, fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>
        <AlertCircle className="w-4 h-4" /> // ERRO: Falha na leitura dos dados do sistema
      </div>
    </HudPanel>
  );

  const emprestimosStatus = (loans || [])
    .filter(l => l.status !== "Liquidado")
    .map(l => ({ ...l, autoFreezeStatus: calcularStatusEmprestimo(l.valor_original, l.data_inicio) }));

  return (
    <div className="space-y-6 pb-16 max-w-6xl">

      {/* ── HEADER HUD ── */}
      <header className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: G, boxShadow: `0 0 6px ${G}` }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: G6, letterSpacing: '0.2em' }}>
                SISTEMA ONLINE · CHIMOIO-MZ · SECURE NODE
              </span>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: G, boxShadow: `0 0 6px ${G}`, animationDelay: '0.5s' }} />
            </div>
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '0.12em', lineHeight: 1.1, textShadow: `0 0 30px ${C2}` }}>
              COFRE<span style={{ color: C, textShadow: `0 0 20px ${C6}` }}>ELITE</span>
              <span style={{ fontSize: 14, color: 'rgba(0,212,255,0.3)', marginLeft: 12, fontWeight: 400 }}>v4.0</span>
            </h1>
            <div className="mt-1" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em' }}>
              // PAINEL DE CONTROLO FIDUCIÁRIO · DADOS EM TEMPO REAL
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HudPanel style={{ padding: '8px 14px' }}>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" style={{ color: C }} />
                <div>
                  <HudLabel>GESTOR</HudLabel><br />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'white' }}>ADMIN · JH_026</span>
                </div>
              </div>
            </HudPanel>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(0,255,140,0.06)', border: '1px solid rgba(0,255,140,0.15)' }}>
                <div className="w-1 h-1 rounded-full" style={{ background: G, boxShadow: `0 0 5px ${G}` }} />
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: G6, letterSpacing: '0.1em' }}>ONLINE: 100%</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: C08, border: `1px solid ${C2}` }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.6)', letterSpacing: '0.1em' }}>PING: 14MS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── STAT GRID HUD ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Caixa Disponível" value={formatMT(data.caixa)} description="Pronto para mobilizar" icon={<Icons.Caixa />} delay={0.05} />
        <StatCard title="Capital Investido" value={formatMT(data.naRua)} description="Em circulação" icon={<Icons.Investido />} delay={0.1} />
        <StatCard title="Lucro Acumulado" value={formatMT(data.lucros)} description="Rendimento total" icon={<Icons.Lucro />} delay={0.15} trend={{ value: 14.2, isPositive: true }} />
        <StatCard
          title="Alertas"
          value={data.solicitacoes_pendentes.toString()}
          description={data.solicitacoes_pendentes > 0 ? "Requerem atenção" : "Sistema limpo"}
          icon={<Icons.Alerta active={data.solicitacoes_pendentes > 0} />}
          delay={0.2}
        />
      </div>

      {/* ── TACTICAL BREAKDOWN PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Detalhes de Liquidez (Caixa) */}
        <HudPanel className="p-5" color={C6}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-[10px] font-bold text-white tracking-widest uppercase">Distribuição de Liquidez</span>
            </div>
            <span className="font-mono text-[9px] text-cyan-500/40">NODE_STATUS: STABLE</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {Object.values(dbStore.userDetails || {}).sort((a: any, b: any) => b.emCaixa - a.emCaixa).slice(0, 6).map((u: any, i) => (
              <div key={u.user.id} className="flex items-center justify-between p-2 rounded bg-cyan-500/5 border border-cyan-500/10 group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center font-mono text-[10px] text-cyan-400 border border-cyan-500/20">
                    {i + 1}
                  </div>
                  <span className="font-mono text-[11px] text-white/80">{u.user.nome}</span>
                </div>
                <span className="font-mono text-[11px] text-cyan-400 font-bold">{formatMT(u.emCaixa)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-cyan-500/10 flex justify-between items-center">
            <HudLabel>Total em Custódia</HudLabel>
            <span className="font-mono text-xs text-white font-bold">{formatMT(data.caixa)}</span>
          </div>
        </HudPanel>

        {/* Detalhes de Alertas (Command Center) */}
        <HudPanel className="p-5" color={M2}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <span className="font-display text-[10px] font-bold text-white tracking-widest uppercase">Centro de Comando de Pedidos</span>
            </div>
            <Link href="/solicitacoes">
              <span className="font-mono text-[9px] text-rose-500 hover:text-rose-400 cursor-pointer underline decoration-rose-500/30">VER TODOS OS MÓDULOS</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Adesão", count: dbStore.membershipRequests.filter(r => r.status === "Pendente").length, color: C },
              { label: "Empréstimos", count: dbStore.loanRequests.filter(r => r.status === "Pendente").length, color: 'rgba(251,191,36,1)' },
              { label: "Aportes", count: dbStore.depositRequests.filter(r => r.status === "Pendente").length, color: G },
              { label: "Liquidação", count: (dbStore as any).liquidationRequests?.filter((r: any) => r.status === "Pendente").length || 0, color: M }
            ].map((item, i) => (
              <div key={i} className="p-3 rounded bg-white/5 border border-white/10 flex flex-col gap-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                  <History className="w-full h-full" style={{ color: item.color }} />
                </div>
                <span className="font-mono text-[9px] text-white/40 uppercase font-black">{item.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-black" style={{ color: item.count > 0 ? item.color : 'rgba(255,255,255,0.1)', textShadow: item.count > 0 ? `0 0 10px ${item.color}40` : 'none' }}>
                    {item.count.toString().padStart(2, '0')}
                  </span>
                  {item.count > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.color }} />}
                </div>
              </div>
            ))}
          </div>
        </HudPanel>

        {/* Exposição de Risco (Capital em Rua) */}
        <HudPanel className="p-5" color={C6}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-[10px] font-bold text-white tracking-widest uppercase">Exposição de Risco Ativa</span>
            </div>
            <span className="font-mono text-[9px] text-cyan-500/40">TOTAL_OUT: {formatMT(data.naRua)}</span>
          </div>
          <div className="space-y-4">
            {emprestimosStatus.slice(0, 3).map((emp: any) => {
              const pct = (emp.valor_original / (data.naRua || 1)) * 100;
              return (
                <div key={emp.id}>
                  <div className="flex justify-between text-[10px] mb-1 font-mono">
                    <span className="text-white/60 uppercase">{emp.tomador_nome}</span>
                    <span className="text-cyan-400">{pct.toFixed(1)}% DO CAP.</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(0,212,255,0.5)]"
                    />
                  </div>
                </div>
              );
            })}
            {emprestimosStatus.length === 0 && (
              <div className="py-8 text-center border border-dashed border-white/5 rounded" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,212,255,0.2)' }}>
                // NENHUMA EXPOSIÇÃO DETECTADA NA REDE
              </div>
            )}
          </div>
        </HudPanel>

        {/* Módulo de Rendimento (Lucros) */}
        <HudPanel className="p-5" color={G6}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-display text-[10px] font-bold text-white tracking-widest uppercase">Projeção e Crescimento</span>
            </div>
            <span className="font-mono text-[9px] text-emerald-500/40">ROI_EST: 14.2%</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 rounded bg-emerald-500/5 border border-emerald-500/10">
              <HudLabel>LUCRO REALIZADO</HudLabel>
              <span className="text-lg font-display font-black text-emerald-400" style={{ textShadow: '0 0 10px rgba(0,255,140,0.3)' }}>{formatMT(data.lucros)}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded bg-white/5 border border-white/10 opacity-50">
              <HudLabel>JURO PROJETADO</HudLabel>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-display font-black text-white/40">{formatMT(data.naRua * 0.1)}</span>
                <span className="text-[7px] text-white/20">EST.</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded bg-black/40 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[8px] font-black text-white/40 uppercase mb-1">
                <span>Eficiência do Cofre</span>
                <span>92%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-emerald-500" />
              </div>
            </div>
          </div>
        </HudPanel>
      </div>

      {/* ── SLIDESHOW ── */}

      {/* ── SLIDESHOW ── */}
      <TechSlideshow />

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gráfico */}
        <HudPanel className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" style={{ color: C, filter: `drop-shadow(0 0 4px ${C})` }} />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '0.1em' }}>
                CRESCIMENTO DO COFRE
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(0,255,140,0.06)', border: '1px solid rgba(0,255,140,0.15)' }}>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: G }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: G6, letterSpacing: '0.12em' }}>DATA STREAM LIVE</span>
            </div>
          </div>
          <BankingCharts />
        </HudPanel>

        {/* Sistema */}
        <div className="space-y-3">
          <HudPanel className="p-5">
            <div className="mb-4">
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, color: 'rgba(0,212,255,0.6)', letterSpacing: '0.15em' }}>
                ESTADO DO SISTEMA
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
                <div>
                  <HudLabel>Integridade</HudLabel><br />
                  <HudValue color={C} className="text-3xl">98.4<span style={{ fontSize: 14 }}>%</span></HudValue>
                </div>
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full" style={{ border: `2px solid rgba(0,212,255,0.1)`, borderTopColor: C, animation: 'rotate-ring 2s linear infinite' }} />
                  <div className="absolute inset-1 rounded-full" style={{ border: `1px solid rgba(0,212,255,0.05)`, borderBottomColor: 'rgba(0,255,140,0.5)', animation: 'rotate-ring 3s linear infinite reverse' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <HudLabel>Carga da Rede</HudLabel>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: G6 }}>NORMAL · 62%</span>
                </div>
                <div className="h-1 rounded relative overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: '62%' }} transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full rounded"
                    style={{ background: `linear-gradient(90deg, ${C}, ${G})`, boxShadow: `0 0 8px ${C6}` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <HudLabel>Segurança</HudLabel>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: G6 }}>MÁXIMA · 99%</span>
                </div>
                <div className="h-1 rounded overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: '99%' }} transition={{ duration: 1, delay: 0.3 }} className="h-full rounded" style={{ background: G, boxShadow: `0 0 8px ${G}` }} />
                </div>
              </div>
            </div>
            <button
              onClick={runAudit} disabled={isAuditing}
              className="btn-primary w-full mt-4 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {isAuditing ? 'A AUDITAR...' : 'INICIAR AUDITORIA'}
            </button>
          </HudPanel>

          {/* Localização */}
          <HudPanel className="p-4 flex items-center gap-3" color={M2}>
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.2)' }}>
              <Database className="w-4 h-4" style={{ color: 'rgba(255,0,128,0.6)' }} />
            </div>
            <div>
              <HudLabel>Base de Operação</HudLabel><br />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'white' }}>CHIMOIO · MOÇAMBIQUE</span>
            </div>
          </HudPanel>
        </div>
      </div>

      {/* ── MONITOR DE RISCO ── */}
      {emprestimosStatus.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.06)', paddingBottom: 12 }}>
            <div className="h-px flex-1 opacity-30" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5))' }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, color: 'rgba(255,0,128,0.7)', letterSpacing: '0.15em', textShadow: '0 0 10px rgba(255,0,128,0.4)' }}>
              MONITOR DE RISCO ACTIVO
            </span>
            <div className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.2)', fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,0,128,0.6)' }}>
              {emprestimosStatus.length} REGISTOS
            </div>
            <div className="h-px flex-1 opacity-30" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.5), transparent)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emprestimosStatus.map((emp, i) => {
              const s = emp.autoFreezeStatus;
              const isCritical = s.fase === 3 || s.fase === "VENCIDO";
              const accentColor = isCritical ? M : C;
              const accentColor6 = isCritical ? 'rgba(255,0,128,0.6)' : C6;
              return (
                <Link key={emp.id} href={`/emprestimos/${emp.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                    className="relative cursor-pointer group transition-all duration-200 p-4"
                    style={{
                      background: 'rgba(0,8,20,0.9)', borderRadius: 4,
                      border: `1px solid ${isCritical ? 'rgba(255,0,128,0.2)' : 'rgba(0,212,255,0.15)'}`,
                      borderLeft: `2px solid ${accentColor6}`,
                      boxShadow: isCritical ? '0 0 20px rgba(255,0,128,0.05)' : '0 0 20px rgba(0,212,255,0.03)',
                    }}
                  >
                    <HudCorners size={8} color={accentColor6} />

                    {/* ID + Nome */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded text-xs font-bold flex items-center justify-center" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor6}`, color: accentColor, fontFamily: "'Share Tech Mono', monospace", textShadow: `0 0 5px ${accentColor}` }}>
                          {emp.tomador_foto || emp.tomador_nome[0]}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'white', fontWeight: 600 }}>{emp.tomador_nome}</div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.3)' }}>#{emp.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="px-1.5 py-0.5 rounded text-center" style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}30`, fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: accentColor, textShadow: `0 0 5px ${accentColor}` }}>
                        {emp.status.toUpperCase()}
                      </div>
                    </div>

                    {/* Dados financeiros */}
                    <div className="p-3 rounded space-y-1.5 mb-3" style={{ background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.06)', fontFamily: "'Share Tech Mono', monospace" }}>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(0,212,255,0.3)' }}>CAPITAL</span>
                        <span style={{ color: 'white' }}>{formatMT(emp.valor_original)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(0,212,255,0.3)' }}>JUROS</span>
                        <span style={{ color: 'rgba(251,191,36,0.8)' }}>{formatMT(s.juro)}</span>
                      </div>
                      <div className="h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
                      <div className="flex justify-between">
                        <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase' }}>TOTAL DEVIDO</span>
                        <span style={{ fontSize: 13, color: accentColor, fontWeight: 700, textShadow: `0 0 8px ${accentColor}` }}>{formatMT(s.totalDevido)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.3)' }}>
                        <Clock className="w-3 h-3" /> {s.diasRestantes}D RESTANTES
                      </div>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: accentColor6, letterSpacing: '0.1em' }} className="group-hover:opacity-100 opacity-50 transition-opacity">
                        VER →
                      </span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ZONA ADMIN ── */}
      {isAdmin && (
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.3)', letterSpacing: '0.2em' }}>
            // ACESSO NÍVEL 5 · ADMINISTRADOR · DADOS PRIVADOS
          </div>

          {/* Comissões - Secret Vault HUD */}
          <HudPanel color="rgba(251,191,36,0.6)" className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                <Database className="w-64 h-64" />
              </motion.div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border border-dashed border-amber-500/30 rounded-full"
                  />
                  <div className="w-14 h-14 rounded flex items-center justify-center relative bg-amber-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                    <Coins className="w-7 h-7 text-amber-500" />
                  </div>
                </div>
                <div>
                  <HudLabel>// SECURE TERMINAL · PRIVATE ASSETS</HudLabel>
                  <motion.div
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontFamily: "'Orbitron', monospace", fontSize: 42, fontWeight: 900, color: 'rgba(251,191,36,1)', marginTop: 4, textShadow: '0 0 30px rgba(251,191,36,0.5)', lineHeight: 1 }}
                  >
                    {formatMT(comissao.total)}
                  </motion.div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.1em' }}>{comissao.registros.length} NODES DETECTED</span>
                    </div>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(251,191,36,0.3)' }}>FIXED RATE: 30 MZN/TX</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-80">
                <div className="flex items-center justify-between mb-3">
                  <HudLabel>DATA FEED</HudLabel>
                  <span className="text-[7px] text-amber-500/30 font-black animate-pulse">ENCRYPTED STREAM</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {comissao.registros.length === 0 ? (
                    <div className="p-4 rounded border border-dashed border-amber-500/10 text-center" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(251,191,36,0.2)' }}>
                      // NO DATA AVAILABLE IN THIS NODE
                    </div>
                  ) : comissao.registros.map((r: any) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center p-2.5 rounded group hover:bg-amber-500/5 transition-all"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.1)', fontFamily: "'Share Tech Mono', monospace" }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }} className="group-hover:text-amber-400 transition-colors">{r.origem}</div>
                        <div style={{ fontSize: 8, color: 'rgba(251,191,36,0.4)' }}>{new Date(r.ts * 1000).toLocaleTimeString()} · SECURE_TX</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(251,191,36,1)', textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>+30</div>
                        <div style={{ fontSize: 6, color: 'rgba(251,191,36,0.3)' }}>MZN</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </HudPanel>

          {/* Reset sistema */}
          <HudPanel color="rgba(255,0,128,0.5)" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.25)' }}>
                <Settings className="w-4 h-4" style={{ color: 'rgba(255,0,128,0.7)', animation: 'rotate-ring 8s linear infinite' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.1em' }}>
                  CONFIGURAÇÕES CRÍTICAS
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(255,0,128,0.4)', letterSpacing: '0.15em', marginTop: 2 }}>
                  // ACESSO RESTRITO · OPERAÇÕES IRREVERSÍVEIS
                </div>
              </div>
            </div>
            <ResetAppModal />
          </HudPanel>
        </div>
      )}
    </div>
  );
}
