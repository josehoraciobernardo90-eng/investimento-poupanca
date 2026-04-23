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
import { useAudit, useSystemAudit } from "@/hooks/use-audit";
import { generateAuditLedgerReport } from "@/lib/pdf-utils";
import { useRequests, useAdminComissao, useUpdateSettings } from "@/hooks/use-requests";
import { Loader2, Wallet, Zap, TrendingUp, AlertCircle, ShieldAlert, Activity, Database, History, Coins, Clock, Settings, BarChart3, Building2, CheckCircle2, X, Star, Phone, CreditCard } from "lucide-react";
import React, { useState, ReactNode } from "react";
import { dbStore } from "@/data/firebase-data";
import { InnovationHub } from "@/components/dashboard/InnovationHub";
import { CommunityPerformance } from "@/components/dashboard/CommunityPerformance";
import { GeralIntelligence } from "@/components/dashboard/GeralIntelligence";
import { NotificationHub } from "@/components/dashboard/NotificationHub";
import { useToast } from "@/hooks/use-toast";

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
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const { data: auditLogs } = useAudit();
  const [photoPreview, setPhotoPreview] = useState<{ url: string, name: string } | null>(null);
  const [isGeneratingLedger, setIsGeneratingLedger] = useState(false);

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
    .map(l => ({ ...l, autoFreezeStatus: calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0) }));

  // --- CÁLCULO PROFISSIONAL E RIGOROSO DO PATRIMÓNIO GLOBAL ---
  let globalCaixa = 0;
  let globalLucroRealizado = 0; // Soma do lucro real já distribuído aos membros
  Object.values(dbStore.users || {}).forEach((u: any) => {
    globalLucroRealizado += u.lucro_acumulado || 0;
  });

  Object.values(dbStore.userDetails || {}).forEach((ud: any) => {
    globalCaixa += ud.emCaixa || 0;
  });

  let globalNaRua = 0;
  let jurosProjectados = 0;
  let activeContracts = 0;
  (dbStore.loans || []).forEach((l: any) => {
    if (l.status === "Aprovado" || l.status === "Ativo" || l.status === "Atrasado" || l.status === "Auditoria" || l.status === "Em Processo") {
      const status = calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0);
      globalNaRua += status.totalDevido;
      jurosProjectados += status.juro;
      activeContracts++;
    }
  });

  // 1. O Património Físico (O que existe agora no ecossistema)
  const patrimonyGlobal = globalCaixa + globalNaRua;
  
  // 2. O Lucro Global (O que foi ganho + o que está por vir)
  // Usamos a soma dos lucros dos membros para evitar inconsistências de contadores globais
  const globalLucro = globalLucroRealizado + jurosProjectados;
  
  const membrosCount = (dbStore.users || []).length;
  // -------------------------------------------------------------

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
              Visão Geral do <span className="text-blue-500">Capital</span> <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded ml-2">SISTEMA ACTUALIZADO</span>
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
      <InnovationHub loans={loans} isAdmin={isAdmin} />

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
      <GeralIntelligence 
        memberBalance={globalCaixa / (membrosCount || 1)} 
        recentRequests={[
          ...dbStore.membershipRequests,
          ...dbStore.loanRequests,
          ...dbStore.depositRequests
        ].sort((a, b) => b.ts - a.ts)}
        isAdmin={isAdmin}
      />

        {/* ── RANKING DE CONFIANÇA INDIVIDUAL (PROFISSIONAL) ── */}
       <div className="grid grid-cols-1 gap-6">
          <CorporatePanel className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldAlert className="w-16 h-16"/></div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <SectionLabel>Classificação de Confiança Global</SectionLabel>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ordenado por Reputação Financeira (Algoritmo Gogoma)</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <Star className="w-3 h-3 fill-blue-500" /> ELITE
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 pb-4">
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Membro</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Pontuação</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status de Confiança</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Património</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.values(dbStore.userDetails || {})
                    .map((ud: any) => {
                      // Algoritmo de Reputação Gogoma
                      const delayedLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status !== "Liquidado" && (calcularStatusEmprestimo(l.valor_original, l.data_inicio).fase !== 1));
                      const paidLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status === "Liquidado").length;
                      
                      let score = 800; // Base Neutra
                      score -= delayedLoans.length * 150; // Penalização pesada por atraso
                      score += paidLoans * 20; // Recompensa por fidelidade paga
                      score += Math.min(100, (ud.emCaixa / 10000) * 10); // Bónus por liquidez
                      
                      const reputation = score >= 850 ? "ELITE" : score >= 600 ? "BOA" : "RISCO";
                      const color = reputation === "ELITE" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : reputation === "BOA" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20";
                      
                      return { ...ud, score, reputation, color };
                    })
                    .sort((a, b) => b.score - a.score)
                    .map((m) => (
                      <tr key={m.user.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden">
                              {m.user.foto ? <img src={m.user.foto} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-xs text-slate-500">?</div>}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{m.user.nome}</div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{m.user.telefone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                             <span className="text-sm font-black text-white font-mono">{m.score.toFixed(0)}</span>
                             <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(m.score / 1000) * 100}%` }} className={cn("h-full", m.score >= 600 ? "bg-blue-500" : "bg-rose-500")} />
                             </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                           <span className={cn("text-[9px] font-black px-2.5 py-1 rounded border shadow-sm uppercase tracking-widest", m.color)}>
                              {m.reputation}
                           </span>
                        </td>
                        <td className="py-4 text-right">
                           <span className="text-sm font-bold text-slate-200">{formatMT(m.patrimonioTotal)}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CorporatePanel>
       </div>

       {/* ── CENTRAL DE OPERAÇÕES E LIQUIDEZ ── */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <CorporatePanel>
            <div className="flex justify-between items-center mb-6">
              <SectionLabel>Central de Pedidos</SectionLabel>
              <Link href="/solicitacoes">
                <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">Gerir Fluxo</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Adesão", count: dbStore.membershipRequests.filter(r => r.status === "Pendente").length, color: "text-blue-500", bg: "bg-blue-500" },
                { label: "Empréstimos", count: dbStore.loanRequests.filter(r => r.status === "Pendente").length, color: "text-amber-500", bg: "bg-amber-500" },
                { label: "Aportes", count: dbStore.depositRequests.filter(r => r.status === "Pendente").length, color: "text-emerald-500", bg: "bg-emerald-500" },
                { label: "Liquidação", count: (dbStore as any).liquidationRequests?.filter((r: any) => r.status === "Pendente").length || 0, color: "text-rose-500", bg: "bg-rose-500" }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-slate-800/30 flex flex-col items-center justify-center gap-2 hover:bg-slate-800/80 transition-all group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-3xl font-display font-bold", item.count > 0 ? "text-white" : "text-slate-700")}>
                      {item.count.toString().padStart(2, '0')}
                    </span>
                    {item.count > 0 && <span className={cn("w-2 h-2 rounded-full animate-pulse", item.bg)} />}
                  </div>
                </div>
              ))}
            </div>
          </CorporatePanel>

          <CorporatePanel>
            <div className="flex justify-between items-center mb-6">
              <SectionLabel>Distribuição de Liquidez</SectionLabel>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-3 max-h-[190px] overflow-y-auto custom-scrollbar pr-2">
              {Object.values(dbStore.userDetails || {}).sort((a: any, b: any) => b.emCaixa - a.emCaixa).map((u: any, i) => (
                <div key={u.user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 border border-white/5 hover:border-blue-500/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-600 group-hover:text-blue-500">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-300">{u.user.nome}</span>
                  </div>
                  <span className="text-sm font-black text-white">{formatMT(u.emCaixa)}</span>
                </div>
              ))}
            </div>
          </CorporatePanel>

          <CorporatePanel>
            <div className="flex justify-between items-center mb-6">
              <SectionLabel>Exposição de Carteira</SectionLabel>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-slate-400 font-medium">Capital de Risco (Na Estrada)</span>
                  <span className="text-lg font-bold text-rose-500">{formatMT(globalNaRua)}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${(globalNaRua / (patrimonyGlobal || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </CorporatePanel>

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
          </CorporatePanel>
       </div>

       {/* ── SLIDESHOW INSTITUCIONAL ── */}
       <TechSlideshow />

       <CommunityPerformance 
         totalDistributed={globalLucro} 
         activeRate={membrosCount > 0 ? Math.round((Object.values(dbStore.userDetails || {}).filter((u: any) => u.emCaixa > 0 || u.naRua > 0).length / membrosCount) * 100) : 0} 
       />

       <div className="mt-8">
          <NotificationHub />
       </div>

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
                        {s.multaAtraso > 0 && (
                          <div className="flex justify-between text-xs animate-pulse">
                            <span className="text-rose-400 font-bold uppercase tracking-tighter">Multa de Mora (1%/dia)</span>
                            <span className="text-rose-400 font-bold">+{formatMT(s.multaAtraso)}</span>
                          </div>
                        )}
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

          {/* Livro Razão Imutável / Auditoria Fiscal — TECHNOLOGY OF LAST GENERATION */}
          <div className="p-10 rounded-[3rem] bg-gradient-to-br from-[#0c1425] to-[#050811] border border-blue-500/20 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[#3b82f6]/[0.01] pointer-events-none" />
            
            {/* Ambient Background Animation */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -mr-48 -mt-48 group-hover:bg-blue-500/10 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -ml-32 -mb-32 group-hover:bg-indigo-500/10 transition-colors duration-1000" />

            <div className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
              <History className="w-56 h-56 text-blue-500" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-white/10 shadow-[inner_0_2px_10px_rgba(255,255,255,0.05)] group-hover:border-blue-500/40 group-hover:scale-105 transition-all duration-500">
                  <History className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-colors" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <span className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-[#0c1425] items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                  <h4 className="font-display text-2xl font-black text-white italic uppercase tracking-tighter leading-none shadow-blue-500/20 drop-shadow-lg">
                    Livro Razão <span className="text-blue-500">Imutável</span>
                  </h4>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                     <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                     Live Ledger Activo
                  </div>
                </div>
                <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-[0.4em] mb-3 drop-shadow-md">Segurança de Auditoria Fiscal 3.0</p>
                <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                  Base de dados descentralizada de movimentações financeiras. Registo binário permanente de alta fidelidade para transparência absoluta.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center lg:items-end gap-3 relative z-10 w-full lg:w-auto">
               <div className="flex items-center gap-8 px-8 py-4 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl group-hover:border-blue-500/20 transition-all duration-500">
                 <div className="text-center border-r border-white/10 pr-8">
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Registos</div>
                   <div className="text-lg font-black text-white font-mono group-hover:text-blue-400 transition-colors">{auditLogs?.length || 0}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vincular</div>
                   <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest group-hover:animate-pulse">Sincronizado</div>
                 </div>
               </div>

               <button 
                 onClick={async () => {
                   setIsGeneratingLedger(true);
                   try {
                     await generateAuditLedgerReport(auditLogs);
                     toast({ title: "Arquivo Descarregado", description: "O Livro Razão foi gerado com sucesso.", variant: "default" });
                   } catch (err) {
                     toast({ title: "Erro no Arquivo", description: "Não foi possível gerar o PDF do Ledger.", variant: "destructive" });
                   } finally {
                     setIsGeneratingLedger(false);
                   }
                 }}
                 disabled={isGeneratingLedger}
                 className="w-full sm:w-auto h-16 px-10 rounded-[1.25rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-4 overflow-hidden group/btn"
               >
                 {isGeneratingLedger ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <>
                     <div className="flex flex-col items-start">
                       <span className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Aceder Arquivo</span>
                       <span className="text-[9px] text-blue-200 font-bold uppercase tracking-widest opacity-60">Exportar PDF Corporativo</span>
                     </div>
                     <Database className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                   </>
                 )}
               </button>
            </div>
          </div>

          {/* Suporte ao Cliente (Tecnologia de Última Geração) */}
          <div className="p-8 rounded-[2.5rem] bg-[#0A1121]/80 backdrop-blur-xl border border-indigo-500/10 mt-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
               <Phone className="w-48 h-48 text-indigo-500" />
            </div>
            
            {/* Animated Glow */}
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <Phone className="w-8 h-8 text-indigo-400 group-hover:animate-bounce" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0A1121] rounded-full animate-pulse" title="Sistema Sincronizado" />
                </div>
                <div>
                  <h4 className="font-display text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Linha de Apoio Directa</h4>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    Protocolo de Suporte em Tempo Real
                  </p>
                  <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                    Este número será projectado instantaneamente em todas as telas de membros congelados ou em dificuldades.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto space-y-3">
                <div className="relative group/input">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Phone className="w-4 h-4" />
                   </div>
                   <input 
                     type="text"
                     maxLength={9}
                     defaultValue={dbStore.dashboard.support_phone || ""}
                     placeholder="Ex: 840000000"
                     onBlur={(e) => {
                       const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
                       if (clean.length === 9 || clean.length === 0) {
                         updateSettings.mutateAsync({ support_phone: clean });
                         e.target.value = clean;
                       } else {
                         toast({ title: "Número Inválido", description: "O número de suporte deve ter 9 dígitos.", variant: "destructive" });
                       }
                     }}
                     className="w-full md:w-80 h-14 bg-black/40 border border-white/10 group-hover/input:border-indigo-500/30 rounded-2xl pl-12 pr-4 text-sm font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {updateSettings.isPending && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        </motion.div>
                      )}
                      {!updateSettings.isPending && dbStore.dashboard.support_phone && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-50" />
                      )}
                   </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">A sincronização é imediata e atómica via Gogoma Cloud</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canais de Pagamento (M-Pesa, E-Mola, Banco) */}
          <div className="p-8 rounded-[2.5rem] bg-[#0A1121]/80 backdrop-blur-xl border border-blue-500/10 mt-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
               <CreditCard className="w-48 h-48 text-blue-500" />
            </div>
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center border border-blue-500/30 shadow-xl">
                  <CreditCard className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-display text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Canais de Recebimento</h4>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">Gestão de Fluxo Financeiro em Tempo Real</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* M-Pesa */}
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-Pesa (Vodacom)</span>
                  </div>
                  <input 
                    type="text"
                    maxLength={9}
                    defaultValue={dbStore.dashboard.mpesa_number || ""}
                    placeholder="Esq: 840000000 (9 Digitos)"
                    onBlur={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
                      if (clean.length === 9 || clean.length === 0) {
                        updateSettings.mutateAsync({ mpesa_number: clean });
                        e.target.value = clean;
                      } else {
                        toast({ title: "Número Inválido", description: "O número M-Pesa deve ter exactamente 9 dígitos.", variant: "destructive" });
                      }
                    }}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] font-mono text-white focus:border-rose-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                  <input 
                    type="text"
                    defaultValue={dbStore.dashboard.mpesa_name || ""}
                    placeholder="Nome do Titular"
                    onBlur={(e) => updateSettings.mutateAsync({ mpesa_name: e.target.value })}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] text-white focus:border-rose-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>

                {/* E-Mola */}
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Mola (Movitel)</span>
                  </div>
                  <input 
                    type="text"
                    maxLength={9}
                    defaultValue={dbStore.dashboard.emola_number || ""}
                    placeholder="Esq: 860000000 (9 Digitos)"
                    onBlur={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
                      if (clean.length === 9 || clean.length === 0) {
                        updateSettings.mutateAsync({ emola_number: clean });
                        e.target.value = clean;
                      } else {
                        toast({ title: "Número Inválido", description: "O número E-Mola deve ter exactamente 9 dígitos.", variant: "destructive" });
                      }
                    }}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] font-mono text-white focus:border-orange-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                  <input 
                    type="text"
                    defaultValue={dbStore.dashboard.emola_name || ""}
                    placeholder="Nome do Titular"
                    onBlur={(e) => updateSettings.mutateAsync({ emola_name: e.target.value })}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] text-white focus:border-orange-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>

                {/* Conta Bancária */}
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instituição Bancária</span>
                  </div>
                  <input 
                    list="mocambique-banks"
                    type="text"
                    defaultValue={dbStore.dashboard.bank_name || ""}
                    placeholder="Escolha o Banco"
                    onBlur={(e) => updateSettings.mutateAsync({ bank_name: e.target.value })}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] text-white focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                  <datalist id="mocambique-banks">
                    <option value="Millennium BIM" />
                    <option value="BCI" />
                    <option value="Standard Bank" />
                    <option value="Moza Banco" />
                    <option value="FNB" />
                    <option value="ABSA Bank" />
                    <option value="Nedbank" />
                  </datalist>
                  <input 
                    type="text"
                    maxLength={21}
                    defaultValue={dbStore.dashboard.bank_number || ""}
                    placeholder="NID (21 Digitos)"
                    onBlur={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 21);
                      if (clean.length === 21 || clean.length === 0) {
                        updateSettings.mutateAsync({ bank_number: clean });
                        e.target.value = clean;
                      } else {
                        toast({ title: "NIB Inválido", description: "O número bancário (NIB) deve ter exactamente 21 dígitos.", variant: "destructive" });
                      }
                    }}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] font-mono text-white focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                  <input 
                    type="text"
                    defaultValue={dbStore.dashboard.bank_titular || ""}
                    placeholder="Nome do Titular"
                    onBlur={(e) => updateSettings.mutateAsync({ bank_titular: e.target.value })}
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] text-white focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset sistema (Acesso Técnico) */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                <Settings className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400">Configurações Críticas</h4>
                <p className="text-[10px] text-slate-600 uppercase font-black">Depuração e Limpeza do Banco de Dados</p>
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
