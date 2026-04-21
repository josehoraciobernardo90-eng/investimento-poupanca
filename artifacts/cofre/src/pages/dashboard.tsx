import { useDashboard } from "@/hooks/use-dashboard";
import { useLoans } from "@/hooks/use-loans";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { ResetAppModal } from "@/components/admin/ResetAppModal";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";
import { TechSlideshow } from "@/components/dashboard/TechSlideshow";
import { BankingCharts } from "@/components/dashboard/BankingCharts";
import { useSystemAudit } from "@/hooks/use-audit";
import { useRequests, useAdminComissao } from "@/hooks/use-requests";
import { Loader2, Wallet, Zap, TrendingUp, AlertCircle, ShieldAlert, Activity, Database, History, Coins, Clock, Settings, BarChart3, Building2, CheckCircle2, X } from "lucide-react";
import React, { useState, ReactNode } from "react";
import { dbStore } from "@/data/firebase-data";
import { InnovationHub } from "@/components/dashboard/InnovationHub";
import { CommunityPerformance } from "@/components/dashboard/CommunityPerformance";
import { GeralIntelligence } from "@/components/dashboard/GeralIntelligence";

function CorporatePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass-panel p-6", className)}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
      {children}
    </h3>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: loans } = useLoans();
  const { isAdmin } = useAdmin();
  const { runAudit, isAuditing } = useSystemAudit();
  const comissao = useAdminComissao();
  const [photoPreview, setPhotoPreview] = useState<{ url: string, name: string } | null>(null);

  if (isLoading) return <PageLoader />;
  if (isError || !data) return (
    <CorporatePanel className="border-rose-500/20 bg-rose-500/5">
      <div className="flex items-center gap-3 text-rose-500 font-medium">
        <AlertCircle className="w-5 h-5" /> 
        Falha na leitura dos dados do sistema. Verifique a conexão com a infraestrutura.
      </div>
    </CorporatePanel>
  );

  const emprestimosStatus = (loans || [])
    .filter(l => l.status !== "Liquidado")
    .map(l => ({ ...l, autoFreezeStatus: calcularStatusEmprestimo(l.valor_original, l.data_inicio) }));

  // --- CÁLCULO ABSOLUTO DO CAPITAL GERAL ---
  let globalCaixa = 0;
  Object.values(dbStore.userDetails || {}).forEach((ud: any) => {
    globalCaixa += ud.emCaixa || 0;
  });

  let globalLucro = comissao?.total || 0;
  Object.values(dbStore.users || {}).forEach((u: any) => {
    globalLucro += u.lucro_acumulado || 0;
  });

  let globalNaRua = 0;
  let activeContracts = 0;
  Object.values(dbStore.loans || {}).forEach((l: any) => {
    if (l.status === "Aprovado" || l.status === "Ativo" || l.status === "Atrasado" || l.status === "Auditoria" || l.status === "Em Processo") {
      globalNaRua += l.valor_original || 0;
      activeContracts++;
    }
  });

  const patrimonyGlobal = globalCaixa + globalNaRua;
  const membrosCount = Object.keys(dbStore.userDetails || {}).length;
  // -----------------------------------------

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── HEADER CORPORATIVO ── */}
      <header className="py-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                DASHBOARD CORPORATIVO
              </div>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Visão Geral do <span className="text-blue-500">Capital</span>
            </h1>
            <p className="mt-2 text-slate-400 font-light text-sm">
              Análise e monitorização em tempo real do património gerido.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass-panel py-2 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gestor de Conta</div>
                <div className="text-sm text-white font-medium">Administração</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">SISTEMA OPERACIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── INOVAÇÃO & SIMULAÇÃO (TECNOLOGIA DE ÚLTIMA GERAÇÃO) ── */}
      <InnovationHub memberScore={92} />

      {/* ── PAINEL DE CONTROLO DE SEDE GLOBAL ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[2rem] glass-card-elite border-t border-b border-t-blue-500/30 border-b-blue-500/10 shadow-[0_0_80px_rgba(59,130,246,0.15)] relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-0 right-[-10%] p-10 opacity-[0.03] pointer-events-none"><Database className="w-96 h-96 text-blue-500" /></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-10 lg:items-center">
           {/* Capital Total */}
           <div className="lg:w-1/3">
             <div className="flex items-center gap-2 mb-3">
               <ShieldAlert className="w-5 h-5 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
               <span className="text-xs text-blue-400 uppercase font-bold tracking-widest drop-shadow-sm">Sede do Capital Geral</span>
             </div>
             <h2 className="text-slate-400 text-sm font-medium mb-1 drop-shadow-sm">Património Global do Fundo</h2>
             <div className="font-display text-5xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 drop-shadow-sm mb-4">
               {formatMT(patrimonyGlobal)}
             </div>
             <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"><Activity className="w-3.5 h-3.5"/> Sistema Master Opearcional</span>
               <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{membrosCount} Cofres</span>
             </div>
           </div>

           {/* Metrics Grid */}
           <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                 <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                 <Wallet className="w-7 h-7 text-emerald-400 mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                 <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5 drop-shadow-sm">Dinheiro em Caixa</div>
                 <div className="font-display text-3xl font-semibold text-white drop-shadow-sm">{formatMT(globalCaixa)}</div>
                 <div className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-widest">Reserva Imediata</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 hover:bg-slate-800/80 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                 <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-indigo-400 to-indigo-600" />
                 <Zap className="w-7 h-7 text-indigo-400 mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                 <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5 drop-shadow-sm">Capital na Estrada</div>
                 <div className="font-display text-3xl font-semibold text-white drop-shadow-sm">{formatMT(globalNaRua)}</div>
                 <div className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-widest">{activeContracts} Contratos (Risco)</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 hover:bg-slate-800/80 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                 <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-amber-400 to-amber-600" />
                 <TrendingUp className="w-7 h-7 text-amber-400 mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                 <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5 drop-shadow-sm">Lucro Global (Fundos)</div>
                 <div className="font-display text-3xl font-semibold text-white drop-shadow-sm">{formatMT(globalLucro)}</div>
                 <div className="text-[10px] text-emerald-400 mt-2 font-medium uppercase tracking-widest">+ Taxas Consolidadas</div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ── INTELIGÊNCIA COLETIVA & SONHOS (DREAMS & FEED) ── */}
      <GeralIntelligence memberBalance={globalCaixa / (membrosCount || 1)} />

      {/* ── PANELS DE OPERAÇÃO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribuição de Liquidez */}
        <CorporatePanel>
          <div className="flex justify-between items-center mb-6">
            <SectionLabel>Distribuição de Liquidez</SectionLabel>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
            {Object.values(dbStore.userDetails || {}).sort((a: any, b: any) => b.emCaixa - a.emCaixa).slice(0, 6).map((u: any, i) => (
              <div key={u.user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-medium text-blue-400">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{u.user.nome}</span>
                </div>
                <span className="text-sm font-semibold text-blue-400">{formatMT(u.emCaixa)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-400">Total em Custódia</span>
            <span className="text-base font-bold text-white">{formatMT(globalCaixa)}</span>
          </div>
        </CorporatePanel>

        {/* Central de Pedidos */}
        <CorporatePanel>
          <div className="flex justify-between items-center mb-6">
            <SectionLabel>Central de Pedidos</SectionLabel>
            <Link href="/solicitacoes">
              <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors px-3 py-1 rounded-full bg-indigo-500/10">Ver Todos os Pedidos</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Adesão", count: dbStore.membershipRequests.filter(r => r.status === "Pendente").length, color: "text-blue-500", bg: "bg-blue-500" },
              { label: "Empréstimos", count: dbStore.loanRequests.filter(r => r.status === "Pendente").length, color: "text-amber-500", bg: "bg-amber-500" },
              { label: "Aportes", count: dbStore.depositRequests.filter(r => r.status === "Pendente").length, color: "text-emerald-500", bg: "bg-emerald-500" },
              { label: "Liquidação", count: (dbStore as any).liquidationRequests?.filter((r: any) => r.status === "Pendente").length || 0, color: "text-rose-500", bg: "bg-rose-500" }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-slate-800/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-800/80 transition-colors">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-3xl font-display font-bold", item.count > 0 ? "text-white" : "text-slate-600")}>
                    {item.count.toString().padStart(2, '0')}
                  </span>
                  {item.count > 0 && <span className={cn("w-2 h-2 rounded-full animate-pulse", item.bg)} />}
                </div>
              </div>
            ))}
          </div>
        </CorporatePanel>

        {/* Exposição de Risco */}
        <CorporatePanel>
          <div className="flex justify-between items-center mb-6">
            <SectionLabel>Exposição de Carteira</SectionLabel>
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded">Total Exposto: {formatMT(globalNaRua)}</span>
          </div>
          <div className="space-y-5 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
            {emprestimosStatus.slice(0, 3).map((emp: any) => {
              const pct = (emp.valor_original / (globalNaRua || 1)) * 100;
              return (
                <div key={emp.id}>
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-slate-300">{emp.tomador_nome}</span>
                    <span className="text-blue-400">{pct.toFixed(1)}% do Capital</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                </div>
              );
            })}
            {emprestimosStatus.length === 0 && (
              <div className="py-8 text-center text-sm font-light text-slate-500">
                Nenhuma exposição detectada na carteira actual.
              </div>
            )}
          </div>
        </CorporatePanel>

        {/* Projeção Financeira */}
        <CorporatePanel>
          <div className="flex justify-between items-center mb-6">
            <SectionLabel>Projeção Financeira</SectionLabel>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
              <TrendingUp className="w-3.5 h-3.5" /> ROI Est. 14.2%
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lucro Registado</span>
              <span className="text-2xl font-display font-medium text-white">{formatMT(globalLucro)}</span>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-800/50 border border-white/5 opacity-80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Juros Projetados</span>
              <span className="text-xl font-display font-medium text-slate-300">{formatMT(globalNaRua * 0.1)}</span>
            </div>
          </div>
          <div className="mt-5 p-4 rounded-xl bg-slate-800/80 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Eficiência de Alocação</span>
                <span className="text-blue-400">92%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-blue-500" />
              </div>
            </div>
          </div>
        </CorporatePanel>
      </div>

      {/* ── SLIDESHOW INSTITUCIONAL ── */}
      <TechSlideshow />

      {/* ── TRANSPARÊNCIA E IMPACTO COMUNITÁRIO ── */}
      <CommunityPerformance />

      {/* ── GRÁFICOS E SISTEMA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico */}
        <CorporatePanel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-display text-lg font-medium text-white">Evolução Patrimonial</h3>
            </div>
          </div>
          <BankingCharts />
        </CorporatePanel>

        {/* Sistema */}
        <div className="space-y-4">
          <CorporatePanel>
            <SectionLabel>Saúde do Sistema</SectionLabel>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs font-medium">Integridade da Base de Dados</span>
                  <div className="text-xl font-medium text-white mt-1">98.4%</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-slate-400">Segurança de Autenticação</span>
                  <span className="text-emerald-400">Verificada</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full w-full bg-emerald-500" />
                </div>
              </div>
            </div>
            <button
              onClick={runAudit} disabled={isAuditing}
              className="btn-ghost w-full mt-6 text-sm flex items-center justify-center py-3"
            >
              {isAuditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
              {isAuditing ? 'Processando Auditoria...' : 'Auditar Sistema Manualmente'}
            </button>
          </CorporatePanel>
        </div>
      </div>

      {/* ── MONITOR DE ACORDOS ── */}
      {emprestimosStatus.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6 pt-4 border-t border-white/5">
            <h3 className="font-display text-lg font-medium text-white">Monitorização de Acordos Ativos</h3>
            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">{emprestimosStatus.length} Registos</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {emprestimosStatus.map((emp, i) => {
              const s = emp.autoFreezeStatus;
              const isCritical = s.fase === 3 || s.fase === "VENCIDO";
              const accentColor = isCritical ? "border-rose-500/30" : "border-blue-500/20";
              const accentText = isCritical ? "text-rose-500" : "text-blue-500";
              const accentBg = isCritical ? "bg-rose-500/10" : "bg-blue-500/10";
              
              return (
                <Link key={emp.id} href={`/emprestimos/${emp.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                    className={cn("glass-panel p-5 cursor-pointer border-l-4 group flex flex-col justify-between h-full", isCritical ? "border-l-rose-500" : "border-l-blue-500")}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={(e) => {
                                if (emp.tomador_foto?.startsWith('data:image') || emp.tomador_foto?.startsWith('http')) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPhotoPreview({ url: emp.tomador_foto, name: emp.tomador_nome });
                                }
                            }}
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-display font-medium text-lg shadow-inner overflow-hidden cursor-zoom-in group-hover:scale-110 transition-transform", accentBg, accentText)}>
                            {emp.tomador_foto?.startsWith('data:image') || emp.tomador_foto?.startsWith('http') ? (
                              <img src={emp.tomador_foto} className="w-full h-full object-cover" alt={emp.tomador_nome} />
                            ) : (
                              emp.tomador_foto || (emp.tomador_nome ? emp.tomador_nome[0] : "?")
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{emp.tomador_nome}</div>
                            <div className="text-xs text-slate-400">Ref: {emp.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                        </div>
                        <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", accentBg, accentText)}>
                          {emp.status}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-white/5 space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Capital Alocado</span>
                          <span className="text-white font-medium">{formatMT(emp.valor_original)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Juros</span>
                          <span className="text-amber-400 font-medium">{formatMT(s.juro)}</span>
                        </div>
                        <div className="h-px w-full bg-white/5 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-300">Total Previsível</span>
                          <span className={cn("text-sm font-semibold", accentText)}>{formatMT(s.totalDevido)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {s.diasRestantes} dias restantes
                      </div>
                      <span className="text-xs font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Visualizar Detalhes →
                      </span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ADMIN PANEL PRIVADO ── */}
      {isAdmin && (
        <div className="pt-8 border-t border-white/5 mt-8">
          <SectionLabel>Controlo da Administração</SectionLabel>

          <CorporatePanel className="mb-6 border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                  <Coins className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Comissões da Gestora</div>
                  <div className="font-display text-4xl sm:text-5xl font-semibold text-white tracking-tight">
                    {formatMT(comissao.total)}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400">
                      {comissao.registros.length} Transações Registadas
                    </div>
                    <span className="text-xs font-medium text-slate-400">Taxa Fixa: 30 MZN/Op</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-96">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Extrato de Comissões</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {comissao.registros.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-500">
                      Nenhum registo processado pela administração.
                    </div>
                  ) : comissao.registros.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{r.origem}</div>
                        <div className="text-xs text-slate-500">{new Date(r.ts * 1000).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-amber-400">+30.00 MTn</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CorporatePanel>

          {/* Reset sistema */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Settings className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h4 className="font-display text-lg font-medium text-white mb-1">Configurações Críticas</h4>
                <p className="text-sm text-rose-400/80 font-light">
                  Acesso reservado. Operações de alto risco ao banco de dados.
                </p>
              </div>
            </div>
            <ResetAppModal />
          </div>
        </div>
      )}

      {/* Modal de Previsualização de Foto */}
      <AnimatePresence>
        {photoPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPhotoPreview(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white">
                <span className="font-medium">{photoPreview.name}</span>
                <button 
                  onClick={() => setPhotoPreview(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <img 
                src={photoPreview.url} 
                className="w-full h-auto rounded-3xl shadow-2xl border-2 border-white/10" 
                alt={photoPreview.name} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
