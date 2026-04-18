import { useMember } from "@/hooks/use-member";
import { formatMT, formatDateTime, cn } from "@/lib/utils";
import { 
  Wallet, LogOut, 
  ArrowUpRight, ArrowDownRight, Shield, 
  User as UserIcon, Phone, MapPin, 
  Lock, CreditCard, FileText, 
  X,
  Loader2,
  CheckCircle2,
  Activity,
  Settings,
  Database,
  Building2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useRequests, useCreateProfileEditRequest, useCreateLiquidationRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";
import { createPortal } from "react-dom";
import { HudBell } from "@/components/ui/HudBell";

function CorporatePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass-panel p-6", className)}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-sm font-semibold text-slate-400 mb-4 tracking-wide uppercase">
      {children}
    </h3>
  );
}

export default function MemberDashboard() {
  const { logout, memberUser, memberDetails } = useMember();
  const { notifications } = useNotifications();
  const { data: globalStats } = useDashboard();
  
  const [activeTab, setActiveTab] = useState<"summary" | "assets" | "loans" | "profile">("summary");

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const createLoanMut = useCreateLoanRequest();
  const createDepositMut = useCreateDepositRequest();
  const createProfileEditMut = useCreateProfileEditRequest();
  const createLiqMet = useCreateLiquidationRequest();

  const [profileForm, setProfileForm] = useState({
    telefone: memberUser?.telefone || "",
    email: memberUser?.email || "",
    bairro: memberUser?.bairro || "",
    zona: memberUser?.zona || "",
    conjuge_nome: memberUser?.conjuge_nome || "",
    conjuge_numero: memberUser?.conjuge_numero || "",
    irmao_nome: memberUser?.irmao_nome || "",
    irmao_numero: memberUser?.irmao_numero || "",
    parente_nome: memberUser?.parente_nome || "",
    parente_numero: memberUser?.parente_numero || "",
  });

  const { deletionRequests } = useRequests();

  if (!memberUser || !memberDetails) return null;

  const calculateLoanStatus = (loan: any) => {
    const tsNow = Math.floor(Date.now() / 1000);
    const diffSecs = tsNow - (loan.data_inicio || tsNow);
    const diffDays = Math.floor(diffSecs / (24 * 3600));
    
    let mes = 1;
    let taxa = 10;
    if (diffDays >= 60) { mes = 3; taxa = 50; }
    else if (diffDays >= 30) { mes = 2; taxa = 20; }

    const juroReal = (loan.valor_original || 0) * (taxa / 100);
    return {
      mes, taxa, juroReal, totalADevolver: (loan.valor_original || 0) + juroReal, 
      diasRestantes: Math.max(0, (30 * mes) - diffDays), base: loan.valor_original || 0
    };
  };

  const myActiveLoans = (dbStore.loans || [])
    .filter(l => l.user_id === memberUser.id && l.status === "Ativo")
    .map(l => ({ ...l, statusCalc: calculateLoanStatus(l) }));

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(loanAmount.replace(/[^\d.]/g, '')) * 100;
    if (isNaN(val) || val <= 0) return;
    try {
      await createLoanMut.mutateAsync({ data: { user_id: memberUser.id, valor: val, motivo: loanReason } });
      setLoanAmount(""); setLoanReason("");
      setTimeout(() => setIsLoanOpen(false), 100);
    } catch {}
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount.replace(/[^\d.]/g, '')) * 100;
    if (isNaN(val) || val <= 0) return;
    try {
      await createDepositMut.mutateAsync({ data: { user_id: memberUser.id, valor: val } });
      setDepositAmount("");
      setTimeout(() => setIsDepositOpen(false), 100);
    } catch {}
  };

  const handleLiquidationRequest = async (loanId: string, amount: number) => {
    if (!confirm(`Confirma submissão de liquidação total de ${formatMT(amount)}?\n\nO contrato financeiro passará por fechamento instantâneo. Participantes (80/20) serão compensados imediatamente.`)) return;
    try {
      const operacaoBancariaBemSucedida = await createLiqMet.mutateAsync({
        data: { user_id: memberUser.id, loan_id: loanId, valor: amount }
      });
      if (operacaoBancariaBemSucedida === true) {
        setSelectedLoan(null);
      }
    } catch {}
  };

  const loanLimit = memberDetails.emCaixa * 1.50;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dadosNaoVazios: any = {};
    Object.entries(profileForm).forEach(([k, v]) => { if (v && v.trim() !== "") dadosNaoVazios[k] = v.trim(); });
    if (Object.keys(dadosNaoVazios).length === 0) return;
    try {
      await createProfileEditMut.mutateAsync({
        data: { user_id: memberUser.id, user_nome: memberUser.nome, user_foto: memberUser.foto || '', ...dadosNaoVazios }
      });
      setTimeout(() => setIsProfileEditOpen(false), 100);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-32 relative z-10">
        
        {/* ── TOP NAV BAR CORPORATIVO ── */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="font-display text-lg font-semibold tracking-tight text-white mb-0.5">Portal Fiduciário</h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Conta #{memberUser.id.slice(0, 8)}</p>
             </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-xl border border-white/5">
             <div className="hidden sm:flex flex-col items-end px-2">
                <span className="text-[10px] font-bold tracking-wider text-emerald-400">ESTADO SÍNCRONO</span>
                <span className="text-xs text-slate-400 font-medium">Conectado</span>
             </div>
             <div className="h-6 w-px bg-white/10 hidden sm:block" />
             <HudBell count={unreadCount} onClick={() => setIsNotifOpen(true)} color="#3B82F6" />
             <button onClick={logout} className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-400 rounded-lg transition-colors group">
                <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>
        </header>

        <MemberTechSlides userData={memberUser} loans={myActiveLoans || []} />

        {/* ── MAIN PORTFOLIO STATS ── */}
        <div className="glass-card-elite p-8 sm:p-10 relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Wallet className="w-64 h-64" /></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Património Consolidado</p>
              <h2 className="font-display text-4xl sm:text-6xl font-medium text-white tracking-tight">
                {formatMT(memberDetails.patrimonioTotal)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setIsDepositOpen(true)} className="btn-primary py-3 px-6 text-sm">Aportar Fundos</button>
              <button onClick={() => setIsLoanOpen(true)} className="btn-ghost py-3 px-6 text-sm bg-slate-800 border-slate-700 hover:border-slate-500">Solicitar Crédito</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 border-t border-white/10 pt-8">
            <div className="p-5 bg-slate-800/40 border border-white/5 rounded-2xl flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-3"><ArrowDownRight className="w-4 h-4 text-emerald-400" /><span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Disponível em Caixa</span></div>
               <div className="font-display text-2xl font-medium text-white leading-none">{formatMT(memberDetails.emCaixa)}</div>
            </div>
            <div className="p-5 bg-slate-800/40 border border-white/5 rounded-2xl flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-3"><ArrowUpRight className="w-4 h-4 text-blue-400" /><span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Capital Rendendo</span></div>
               <div className="font-display text-2xl font-medium text-white leading-none">{formatMT(memberDetails.totalEmCirculacao)}</div>
            </div>
          </div>
        </div>

        {/* ── TAB NAVIGATION ── */}
        <div className="flex overflow-x-auto gap-2 p-1.5 border border-white/5 bg-slate-800/50 rounded-2xl">
           {([["summary", "Painel de Resumo", Activity], ["assets", "Carteira de Ativos", TrendingUp], ["loans", "Financiamentos", CreditCard], ["profile", "Dados Cadastrais", Settings]] as const).map(([id, label, Icon]) => (
             <button
               key={id}
               onClick={() => setActiveTab(id)}
               className={cn(
                 "flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all",
                 activeTab === id ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
               )}
             >
               <Icon className="w-4 h-4" /> {label}
             </button>
           ))}
        </div>

        {/* ── CONTENT PANELS ── */}
        <AnimatePresence mode="wait">
          {activeTab === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Liquidez do Cofre Global */}
              <CorporatePanel>
                 <div className="flex items-center justify-between mb-6">
                    <SectionLabel>Ecossistema Global do Fundo</SectionLabel>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Ao vivo</span></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: "Custódia Total", v: formatMT(globalStats?.caixa || 0) },
                      { l: "Exposição Risco", v: formatMT(globalStats?.naRua || 0) },
                      { l: "Capital Gerido", v: formatMT(globalStats?.total || 0) },
                      { l: "Rentabilidade", v: formatMT(globalStats?.lucros || 0) }
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                        <span className="text-xs text-slate-400 font-medium tracking-wide block mb-1">{s.l}</span>
                        <span className="font-display text-lg font-medium text-slate-200">{s.v}</span>
                      </div>
                    ))}
                 </div>
              </CorporatePanel>
              
              {/* Registos */}
              <CorporatePanel className="flex flex-col">
                 <div className="flex items-center justify-between mb-6"><SectionLabel>Extrato de Operações</SectionLabel></div>
                 <div className="space-y-3 flex-1">
                    {dbStore.audit.filter(a => a.user === memberUser.nome || a.desc.includes(memberUser.nome)).slice(0, 4).map((a, i) => (
                      <div key={i} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/50 border border-white/5 transition-all hover:bg-slate-800">
                         <div>
                            <div className="text-sm text-slate-200 font-medium mb-1">{a.desc}</div>
                            <div className="text-[10px] text-slate-500 font-semibold tracking-wider">{formatDateTime(a.ts)}</div>
                         </div>
                         <div className="text-xs font-semibold uppercase px-2 py-1 rounded bg-slate-900 border border-white/5" style={{ color: a.tipo === "LIQUIDACAO" ? '#10B981' : '#3B82F6' }}>{a.tipo}</div>
                      </div>
                    ))}
                    {dbStore.audit.filter(a => a.user === memberUser.nome || a.desc.includes(memberUser.nome)).length === 0 && (
                      <div className="h-full flex items-center justify-center text-sm text-slate-500 italic">Sem histórico de operações.</div>
                    )}
                 </div>
              </CorporatePanel>
            </motion.div>
          )}

          {activeTab === "assets" && (
            <motion.div key="assets" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <CorporatePanel>
                 <div className="flex items-center justify-between mb-6">
                    <SectionLabel>Rastreamento de Ativos e Metricas Fiduciárias</SectionLabel>
                    <div className="flex items-center gap-2 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">Sincronização Ativa</span></div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="p-5 bg-slate-800/20 hover:bg-slate-800/60 transition-colors border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><Database className="w-20 h-20 text-emerald-500" /></div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><ArrowDownRight className="w-3 h-3" /> Liquidez Imediata (Em Caixa)</span>
                      <div className="font-display text-4xl font-medium text-white">{formatMT(memberDetails.emCaixa)}</div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">Disponível para saque instantâneo ou novo plano de aporte.</p>
                   </div>
                   
                   <div className="p-5 bg-slate-800/20 hover:bg-slate-800/60 transition-colors border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><Activity className="w-20 h-20 text-blue-500" /></div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Capital de Risco (Na Rua)</span>
                      <div className="font-display text-4xl font-medium text-white">{formatMT(memberDetails.totalEmCirculacao)}</div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">Fatia representativa do seu investimento aplicado no mercado atual.</p>
                   </div>

                   <div className="p-5 bg-slate-800/20 hover:bg-slate-800/60 transition-colors border border-amber-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-20 h-20 text-amber-500" /></div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Lucros Provisionados</span>
                      <div className="font-display text-4xl font-medium text-white">+{formatMT(memberDetails.totalJuroEsperado)}</div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">Projeção estimada baseada no atual ciclo de crédito ativo.</p>
                   </div>
                 </div>
              </CorporatePanel>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CorporatePanel className="flex flex-col h-full bg-gradient-to-b from-slate-800/20 to-slate-800/5">
                  <div className="flex items-center gap-3 mb-6"><History className="w-5 h-5 text-emerald-400" /><SectionLabel>Monitoria de Aportes</SectionLabel></div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
                     {dbStore.depositRequests.filter(r => r.user_id === memberUser.id).slice(0, 10).map(r => (
                       <div key={r.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/10 transition-colors">
                         <div>
                            <div className="font-display text-lg font-medium text-white mb-1">{formatMT(r.valor)}</div>
                            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{formatDateTime(r.ts)}</div>
                         </div>
                         <div className={cn("text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border", r.status === "Aprovado" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : r.status === "Rejeitado" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20")}>
                           {r.status}
                         </div>
                       </div>
                     ))}
                     {dbStore.depositRequests.filter(r => r.user_id === memberUser.id).length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-12 flex items-center justify-center border border-dashed border-white/5 rounded-xl">Sem histórico de aportes registrado.</div>
                     )}
                  </div>
                </CorporatePanel>

                <CorporatePanel className="flex flex-col h-full bg-gradient-to-b from-rose-500/5 to-slate-800/5">
                  <div className="flex items-center gap-3 mb-6"><AlertTriangle className="w-5 h-5 text-rose-400" /><SectionLabel>Controlo de Dívidas e Atrasos</SectionLabel></div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
                     {myActiveLoans.length === 0 ? (
                       <div className="text-center text-slate-500 text-sm py-12 flex items-center justify-center border border-dashed border-white/5 rounded-xl">O seu cadastro não regista passivos ou dívidas pendentes.</div>
                     ) : myActiveLoans.map(l => (
                       <div key={l.id} className={cn("flex flex-col p-4 rounded-xl border transition-colors", l.statusCalc.mes > 1 ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-800/40 border-white/5 hover:border-white/10")}>
                         <div className="flex justify-between items-center border-b border-white/5 pb-3">
                           <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Contrato #{l.id.slice(0,6)}</span>
                           {l.statusCalc.mes > 1 ? (
                             <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Atraso (Agravamento de {l.statusCalc.taxa}%)</span>
                           ) : (
                             <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Prazos Regulares</span>
                           )}
                         </div>
                         <div className="flex justify-between items-end mt-4">
                            <div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Dívida Total Cumulativa</div>
                               <div className={cn("font-display text-2xl font-medium", l.statusCalc.mes > 1 ? "text-rose-400" : "text-white")}>{formatMT(l.statusCalc.totalADevolver)}</div>
                            </div>
                            <div className="text-right">
                               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Juros & Multas</div>
                               <div className="text-lg font-semibold text-amber-500">{formatMT(l.statusCalc.juroReal)}</div>
                            </div>
                         </div>
                       </div>
                     ))}
                  </div>
                </CorporatePanel>
              </div>
            </motion.div>
          )}

          {activeTab === "loans" && (

            <motion.div key="loans" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
               {myActiveLoans.length === 0 ? (
                 <CorporatePanel className="p-20 text-center border-dashed border-white/10 flex flex-col items-center justify-center">
                    <Database className="w-10 h-10 text-slate-600 mb-4" />
                    <h3 className="font-display text-lg font-medium text-slate-300">Sem créditos ativos</h3>
                    <p className="text-slate-500 text-sm mt-2">Você não possui obrigações nem financiamentos a liquidar neste momento.</p>
                 </CorporatePanel>
               ) : (
                 myActiveLoans.map(l => (
                   <button 
                     key={l.id} 
                     onClick={() => setSelectedLoan(l)}
                     className={cn("w-full text-left flex flex-col p-5 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer shadow-lg", l.statusCalc.mes > 1 ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-400/50" : "bg-slate-800/60 border-white/10 hover:border-blue-500/30")}
                   >
                     <div className="flex justify-between items-center mb-4">
                       <span className="text-sm text-slate-300 font-semibold tracking-wide uppercase flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-400" /> Contrato #{l.id.slice(0,6)}</span>
                       {l.statusCalc.mes > 1 ? (
                         <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Atrasado (Fase 0{l.statusCalc.mes})</span>
                       ) : (
                         <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Registo Regularizado</span>
                       )}
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="flex gap-8">
                           <div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Capital Pendente</div>
                              <div className="font-display text-2xl font-medium text-white">{formatMT(l.statusCalc.totalADevolver)}</div>
                           </div>
                           <div className="hidden sm:block">
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Juros & Multas</div>
                              <div className="font-display text-lg font-medium text-amber-500">{formatMT(l.statusCalc.juroReal)}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 shadow-inner group-hover:bg-blue-500/20 transition-colors hidden sm:inline-block">Abrir Dossier Institucional →</span>
                           <span className="text-xs font-semibold text-blue-400 sm:hidden">Dossier →</span>
                        </div>
                     </div>
                   </button>
                 ))
               )}
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <CorporatePanel>
                  <SectionLabel>Dossier Pessoal</SectionLabel>
                  <div className="mt-4 space-y-4">
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><UserIcon className="w-5 h-5" /></div>
                        <div><span className="text-xs text-slate-400 font-medium block">Associado Sénior</span><span className="text-sm font-semibold text-white">{memberUser.nome}</span></div>
                     </div>
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Phone className="w-5 h-5" /></div>
                        <div><span className="text-xs text-slate-400 font-medium block">Contacto Principal</span><span className="text-sm font-semibold text-white">{memberUser.telefone}</span></div>
                     </div>
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><MapPin className="w-5 h-5" /></div>
                        <div><span className="text-xs text-slate-400 font-medium block">Endereço Fiscal</span><span className="text-sm font-semibold text-white">{memberUser.bairro}, Chimoio</span></div>
                     </div>
                  </div>
               </CorporatePanel>

               <CorporatePanel className="flex flex-col justify-between">
                  <SectionLabel>Administração de Conta</SectionLabel>
                  <div className="mt-4 space-y-4">
                     <button onClick={() => setIsProfileEditOpen(true)} className="w-full flex justify-between items-center p-5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-all text-left group">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
                          <span className="text-sm font-semibold text-slate-200">Requerer Atualização Cadastral</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                     </button>
                     <button onClick={() => generateMemberReport(memberUser, memberDetails)} className="w-full flex justify-between items-center p-5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-all text-left group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-semibold text-slate-200">Extrair Relatório Financeiro PDF</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                     </button>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center mt-10">Conformidade Regulatória ISO/IEC 27001</p>
               </CorporatePanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MODAIS CORPORATIVOS ── */}
      <AnimatePresence>
        {isLoanOpen && (
            <motion.div key="loan-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-md p-8 glass-card-elite">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <SectionLabel>Solicitação de Crédito</SectionLabel>
                  <button onClick={() => setIsLoanOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleLoanSubmit} className="space-y-6">
                   <div className="bg-slate-800/80 p-5 rounded-xl border border-white/5 mb-6">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Plafond Pré-Aprovado</p>
                      <p className="font-display text-3xl font-medium text-white">{formatMT(loanLimit)}</p>
                   </div>
                   <div className="space-y-5">
                      <div>
                         <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Montante (MZN)</label>
                         <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="input-elite w-full font-display text-2xl text-center shadow-inner" placeholder="0.00" />
                      </div>
                      <div>
                         <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Finalidade de Investimento</label>
                         <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} className="input-elite w-full min-h-[120px] resize-none text-sm font-medium" placeholder="Ex: Investimento imobiliário comercial..." />
                      </div>
                   </div>
                   <button disabled={createLoanMut.isPending} className="w-full btn-primary py-4 mt-4 text-sm font-semibold flex justify-center items-center gap-2">
                      {createLoanMut.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Em Processamento...</> : "Submeter Proposta de Crédito"}
                   </button>
                </form>
              </div>
            </motion.div>
          )}

          {isDepositOpen && (
            <motion.div key="deposit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-md p-8 glass-card-elite">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <SectionLabel>Aporte de Capital</SectionLabel>
                  <button onClick={() => setIsDepositOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleDepositSubmit} className="space-y-6">
                   <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Montante a Investir (MZN)</label>
                      <input required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="input-elite w-full font-display text-2xl text-center shadow-inner" placeholder="0.00" />
                   </div>
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                      <Activity className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-emerald-100/70 font-medium leading-relaxed">
                        Aviso Institucional: A administração aplica uma taxa fiduciária e operacional no valor exato de 30 MZN por reforço.
                      </p>
                   </div>
                   <button disabled={createDepositMut.isPending} className="w-full btn-primary py-4 mt-2 text-sm font-semibold !bg-gradient-to-r !from-emerald-600 !to-emerald-500 shadow-emerald-500/20 hover:!from-emerald-500 hover:!to-emerald-400">
                      {createDepositMut.isPending ? "Validando Transação..." : "Confirmar Aporte e Transferir"}
                   </button>
                </form>
              </div>
            </motion.div>
          )}

          {isNotifOpen && (
            <motion.div key="notif-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col md:items-end justify-start p-4 bg-slate-900/40 backdrop-blur-sm md:pt-20 md:pr-10">
              <div className="w-full max-w-md p-6 glass-card-elite max-h-[80vh] flex flex-col shadow-2xl border border-white/10 mt-14 md:mt-0">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <SectionLabel>Central de Avisos</SectionLabel>
                  <button onClick={() => setIsNotifOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto pr-2 space-y-4 flex-1">
                  {notifications.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 text-sm">Sem notificações ativas.</div>
                  ) : notifications.map(notif => (
                    <div key={notif.id} className={cn("p-4 rounded-xl border transition-colors", notif.read ? "bg-slate-800/30 border-white/5" : "bg-slate-800/80 border-blue-500/30")}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0", notif.read ? "bg-slate-600" : notif.type === 'error' ? "bg-rose-500" : notif.type === 'success' ? "bg-emerald-500" : notif.type === 'warning' ? "bg-amber-500" : "bg-blue-500")} />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1.5">{notif.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mb-3">{notif.message}</p>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatDateTime(notif.ts)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedLoan && (
            <motion.div key="selected-loan-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-2xl p-8 glass-card-elite my-auto border border-blue-500/20 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><ShieldCheck className="w-64 h-64 text-blue-500" /></div>
                
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5 relative z-10">
                   <div>
                     <SectionLabel>Dossier de Inteligência Fiduciária</SectionLabel>
                     <h3 className="text-xl font-display font-semibold text-white tracking-tight flex items-center gap-2">Contrato #{selectedLoan.id.slice(0,8)}</h3>
                   </div>
                   <button onClick={() => setSelectedLoan(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-8">
                   <div className="p-5 bg-slate-800/60 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Capital Mutuado Inicial</div>
                      <div className="font-display text-2xl font-medium text-white">{formatMT(selectedLoan.statusCalc.base)}</div>
                   </div>
                   <div className="p-5 bg-slate-800/60 rounded-xl border border-amber-500/20">
                      <div className="text-[10px] text-amber-400/80 uppercase tracking-widest font-semibold mb-1">Juros Operacionais (Fase 0{selectedLoan.statusCalc.mes})</div>
                      <div className="font-display text-2xl font-medium text-amber-400">+{formatMT(selectedLoan.statusCalc.juroReal)}</div>
                   </div>
                   <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 md:col-span-2">
                      <div className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold mb-1">Valor Exato para Liquidação Total</div>
                      <div className="font-display text-4xl font-medium text-emerald-400">{formatMT(selectedLoan.statusCalc.totalADevolver)}</div>
                   </div>
                </div>

                <div className="mb-10 relative z-10">
                   <h4 className="text-sm font-semibold text-white mb-4 border-b border-white/5 pb-2">Destinação do Lucro (Contrato Inteligente)</h4>
                   <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 p-4 bg-slate-800/40 rounded-xl border border-white/5 border-l-4 border-l-blue-500 shadow-inner">
                         <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Cota para Investidores (80%)</div>
                         <div className="text-xl font-medium text-blue-400 mb-2">{formatMT(selectedLoan.statusCalc.juroReal * 0.8)}</div>
                         <div className="text-[10px] text-slate-500 leading-relaxed">Este valor será distribuído proporcionalmente pelas carteiras de todos os investidores do fundo após liquidação.</div>
                      </div>
                      <div className="flex-1 p-4 bg-slate-800/40 rounded-xl border border-white/5 border-l-4 border-l-amber-500 shadow-inner">
                         <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Receita do Produtor (20%)</div>
                         <div className="text-xl font-medium text-amber-500 mb-2">{formatMT(selectedLoan.statusCalc.juroReal * 0.2)}</div>
                         <div className="text-[10px] text-slate-500 leading-relaxed">Taxa de segurança administrativa e honorários do produtor baseados na eficácia da alocação de fundos.</div>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => handleLiquidationRequest(selectedLoan.id, selectedLoan.statusCalc.totalADevolver)}
                  className="w-full btn-primary py-5 text-sm font-semibold tracking-wide flex items-center justify-center gap-3 relative z-10 group"
                  disabled={createLiqMet.isPending}
                >
                  {createLiqMet.isPending ? <><Loader2 className="w-5 h-5 animate-spin"/> Conectando ao Gestor...</> : <><ShieldCheck className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" /> Submeter Pagamento e Notificar Participantes</>}
                </button>
              </div>
            </motion.div>
          )}

          {isProfileEditOpen && (
            <motion.div key="profile-edit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-xl p-8 glass-card-elite my-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                   <SectionLabel>Atualização de Dados Cadastrais</SectionLabel>
                   <button onClick={() => setIsProfileEditOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-200/80 font-medium leading-relaxed flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    Medida de Segurança KYC: Todas as modificações no perfil exigem validação e aprovação do Gestor Executivo antes de produzir efeitos operacionais.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                   <div className="space-y-4">
                     <h4 className="text-sm font-semibold text-white">1. Contactos Principais</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Telefone Primário</label>
                         <input value={profileForm.telefone} onChange={e => setProfileForm({...profileForm, telefone: e.target.value})} className="input-elite" placeholder={memberUser.telefone || "ex: 84xxxxxxx"} />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-slate-400 mb-1.5 block">E-mail Profissional</label>
                         <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="input-elite" placeholder={memberUser.email || "ex: nome@empresa.com"} />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-sm font-semibold text-white">2. Residência Fiscal</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Bairro / Freguesia</label>
                           <input value={profileForm.bairro} onChange={e => setProfileForm({...profileForm, bairro: e.target.value})} className="input-elite" placeholder={memberUser.bairro || ""} />
                         </div>
                         <div>
                           <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Rua / Zona</label>
                           <input value={profileForm.zona} onChange={e => setProfileForm({...profileForm, zona: e.target.value})} className="input-elite" placeholder={memberUser.zona || ""} />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                     <h4 className="text-sm font-semibold text-white mb-2">3. Agentes de Ligação / Herdeiros</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                         <span className="text-xs text-slate-400 font-semibold mb-2 block border-b border-white/5 pb-2">Cônjuge / Parceiro</span>
                         <div><label className="text-xs text-slate-500 mb-1 block">Nome Completo</label><input value={profileForm.conjuge_nome} onChange={e => setProfileForm({...profileForm, conjuge_nome: e.target.value})} className="input-elite text-sm py-2 px-3" /></div>
                         <div><label className="text-xs text-slate-500 mb-1 block">Contacto Móvel</label><input value={profileForm.conjuge_numero} onChange={e => setProfileForm({...profileForm, conjuge_numero: e.target.value})} className="input-elite text-sm py-2 px-3" /></div>
                       </div>
                       <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                         <span className="text-xs text-slate-400 font-semibold mb-2 block border-b border-white/5 pb-2">Representante Familiar</span>
                         <div><label className="text-xs text-slate-500 mb-1 block">Nome Completo</label><input value={profileForm.irmao_nome} onChange={e => setProfileForm({...profileForm, irmao_nome: e.target.value})} className="input-elite text-sm py-2 px-3" /></div>
                         <div><label className="text-xs text-slate-500 mb-1 block">Contacto Móvel</label><input value={profileForm.irmao_numero} onChange={e => setProfileForm({...profileForm, irmao_numero: e.target.value})} className="input-elite text-sm py-2 px-3" /></div>
                       </div>
                     </div>
                   </div>

                   <button disabled={createProfileEditMut.isPending} className="w-full btn-primary py-4 mt-6 text-sm flex justify-center gap-2">
                      {createProfileEditMut.isPending
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Formulário em Transmissão...</>
                        : <><Lock className="w-5 h-5 opacity-80" /> Submeter Atualização Fiduciária</>}
                   </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
