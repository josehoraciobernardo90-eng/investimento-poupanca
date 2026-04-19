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
  History,
  Home,
  UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useRequests, useCreateProfileEditRequest, useCreateLiquidationRequest, useApproveDeletionRequest, useRejectDeletionRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";
import { HudBell } from "@/components/ui/HudBell";

function NavButton({ 
  id, label, icon: Icon, active, set 
}: { 
  id: any, label: string, icon: any, active: any, set: any 
}) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={cn(
        "flex flex-col items-center justify-center w-full py-2 gap-1 transition-all",
        isActive ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
      )}
    >
      <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-blue-500/10" : "")}>
        <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
      </div>
      <span className={cn("text-[10px] font-medium tracking-wide", isActive ? "font-bold" : "")}>{label}</span>
    </button>
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
  const approveDelMut = useApproveDeletionRequest();
  const rejectDelMut = useRejectDeletionRequest();
  
  const { deletionRequests } = useRequests();
  const myDeletionRequests = (deletionRequests || []).filter(r => r.user_id === memberUser?.id && r.status === "Pendente");

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
    profissao: memberUser?.profissao || "",
    bi: memberUser?.bi || "",
    nuit: memberUser?.nuit || "",
  });

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
    if (!confirm(`Confirma liquidação total de ${formatMT(amount)}?`)) return;
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
    <div className="min-h-screen bg-[#000000] text-slate-200 font-sans selection:bg-blue-500/30 flex justify-center pb-24">
      {/* Mobile-first Container */}
      <div className="w-full max-w-md bg-[#090D14] min-h-screen relative shadow-2xl flex flex-col overflow-x-hidden">
        
        {/* ── TOP APP BAR ── */}
        <header className="sticky top-0 z-40 bg-[#090D14]/90 backdrop-blur-lg px-5 pt-6 pb-4 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden">
                  {memberUser.foto ? <img src={memberUser.foto} className="w-full h-full object-cover"/> : <UserIcon className="w-6 h-6"/>}
               </div>
               <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Bem-vindo(a)</p>
                  <h1 className="font-display font-semibold text-white text-lg leading-tight">{memberUser.nome.split(' ')[0]}</h1>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <HudBell count={unreadCount} onClick={() => setIsNotifOpen(true)} color="#3B82F6" />
               <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>
        </header>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 p-5 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* ── HOME / SUMMARY ── */}
            {activeTab === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                
                {/* ALERTA DE AUDITORIA: EXCLUSÃO DE HISTÓRICO */}
                {myDeletionRequests.length > 0 && (
                   <div className="space-y-3">
                     {myDeletionRequests.map((req: any) => (
                        <div key={req.id} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-3">
                           <div className="flex gap-3">
                              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0"/>
                              <div>
                                 <h4 className="text-sm font-semibold text-rose-400">Auditoria: Apagar Histórico</h4>
                                 <p className="text-[11px] text-rose-400/80 mt-1">O seu administrador solicitou apagar do sistema um histórico seu ({req.target_type === 'loan' ? 'Empréstimo' : req.target_type === 'deposit' ? 'Aporte' : 'Membro'}) no valor de {formatMT(req.details?.valor || 0)}. Você permite essa exclusão?</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => rejectDelMut.mutateAsync({ requestId: req.id })} disabled={rejectDelMut.isPending || approveDelMut.isPending} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition-all">Manter Histórico</button>
                              <button onClick={() => approveDelMut.mutateAsync({ requestId: req.id })} disabled={approveDelMut.isPending || rejectDelMut.isPending} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold active:scale-95 transition-all">Sim, Apagar</button>
                           </div>
                        </div>
                     ))}
                   </div>
                )}
                
                {/* Hero Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2rem] p-6 shadow-2xl shadow-blue-900/40 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4"><ShieldCheck className="w-40 h-40"/></div>
                   <p className="text-sm text-blue-100/80 font-medium mb-1">Património Total</p>
                   <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-8">
                     {formatMT(memberDetails.patrimonioTotal)}
                   </h2>
                   
                   <div className="flex gap-4 relative z-10">
                      <button onClick={() => setIsDepositOpen(true)} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl py-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 border border-white/10">
                          <div className="bg-white/20 p-2 rounded-full"><ArrowDownRight className="w-5 h-5" /></div>
                          <span className="text-xs font-semibold tracking-wide">Aportar</span>
                      </button>
                      <button onClick={() => setIsLoanOpen(true)} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl py-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 border border-white/10">
                          <div className="bg-white/20 p-2 rounded-full"><ArrowUpRight className="w-5 h-5" /></div>
                          <span className="text-xs font-semibold tracking-wide">Crédito</span>
                      </button>
                   </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-800/40 rounded-3xl p-5 border border-white/5 flex flex-col justify-center">
                     <span className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-emerald-400"/> Em Caixa</span>
                     <span className="font-display text-xl font-semibold text-white">{formatMT(memberDetails.emCaixa)}</span>
                   </div>
                   <div className="bg-slate-800/40 rounded-3xl p-5 border border-white/5 flex flex-col justify-center">
                     <span className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-400"/> A Render</span>
                     <span className="font-display text-xl font-semibold text-white">{formatMT(memberDetails.totalEmCirculacao)}</span>
                   </div>
                </div>

                {/* Ecossistema Global (Minimalista) */}
                <div className="space-y-4 mt-8">
                   <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-semibold text-white">Resumo Global do Fundo</h3>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Ao vivo</div>
                   </div>
                    <div className="bg-slate-800/20 rounded-3xl p-5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                         <span className="text-sm text-slate-400 font-medium">Custódia Total</span>
                         <span className="font-semibold text-white">{formatMT(globalStats?.caixa || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-slate-400 font-medium">Cap. Gerido</span>
                         <span className="font-semibold text-white">{formatMT(globalStats?.total || 0)}</span>
                      </div>
                    </div>
                </div>
              </motion.div>
            )}

            {/* ── CARTEIRA (ASSETS) ── */}
            {activeTab === "assets" && (
              <motion.div key="assets" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <h2 className="text-2xl font-display font-semibold text-white px-2">Sua Carteira</h2>
                
                {/* Ativos Rendendo */}
                <div className="bg-slate-800/30 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-24 h-24 text-blue-500" /></div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><Activity className="w-5 h-5 text-blue-400"/></div>
                      <div><p className="text-sm font-semibold text-white">Capital Ativo</p><p className="text-[10px] text-slate-400 uppercase">Investido no mercado</p></div>
                   </div>
                   <div className="text-3xl font-display font-medium text-white mb-2">{formatMT(memberDetails.totalEmCirculacao)}</div>
                </div>

                {/* Lucros Estimados */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-3xl p-6 border border-emerald-500/20 relative overflow-hidden">
                   <div className="absolute right-0 bottom-0 p-4 opacity-10"><ShieldCheck className="w-20 h-20 text-emerald-500" /></div>
                   <p className="text-sm font-semibold text-emerald-400 mb-2">Projeção de Lucros</p>
                   <div className="text-4xl font-display font-medium text-white">+{formatMT(memberDetails.totalJuroEsperado)}</div>
                   <p className="text-xs text-slate-400 mt-2">Ganhos estimados ao fim dos ciclos vigentes.</p>
                </div>

                {/* Últimos Aportes */}
                <div className="mt-8">
                   <h3 className="text-sm font-semibold text-white mb-4 px-2">Últimos Aportes</h3>
                   <div className="space-y-3">
                     {dbStore.depositRequests.filter(r => r.user_id === memberUser.id).slice(0, 5).map(r => (
                       <div key={r.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-white/5 active:bg-slate-800/50 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/5"><TrendingUp className="w-5 h-5 text-emerald-400"/></div>
                            <div>
                               <div className="font-semibold text-white text-base">{formatMT(r.valor)}</div>
                               <div className="text-[11px] text-slate-400">{formatDateTime(r.ts)}</div>
                            </div>
                         </div>
                         <div className={cn("text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full", r.status === "Aprovado" ? "bg-emerald-500/20 text-emerald-400" : r.status === "Rejeitado" ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400")}>
                           {r.status}
                         </div>
                       </div>
                     ))}
                     {dbStore.depositRequests.filter(r => r.user_id === memberUser.id).length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-10 bg-slate-800/20 rounded-3xl border border-dashed border-white/10">Nenhum aporte realizado.</div>
                     )}
                   </div>
                </div>
              </motion.div>
            )}

            {/* ── CRÉDITOS (LOANS) ── */}
            {activeTab === "loans" && (
              <motion.div key="loans" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold text-white px-2">Meus Créditos</h2>
                 
                 {myActiveLoans.length === 0 ? (
                   <div className="bg-slate-800/20 rounded-3xl p-8 border border-dashed border-white/10 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-blue-400"/></div>
                      <h3 className="font-medium text-white mb-2">Tudo em dia!</h3>
                      <p className="text-sm text-slate-400">Você não possui empréstimos ativos no momento.</p>
                      <button onClick={() => setIsLoanOpen(true)} className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-full text-sm">Solicitar Crédito</button>
                   </div>
                 ) : (
                   myActiveLoans.map(l => (
                     <button 
                       key={l.id} 
                       onClick={() => setSelectedLoan(l)}
                       className={cn("w-full text-left bg-slate-800/40 rounded-3xl p-5 border active:scale-[0.98] transition-all", l.statusCalc.mes > 1 ? "border-rose-500/30" : "border-white/5")}
                     >
                       <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">ID: {l.id.slice(0,6)}</span>
                          {l.statusCalc.mes > 1 ? (
                            <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">Em Atraso</span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Ativo e Regular</span>
                          )}
                       </div>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[11px] text-slate-400 mb-1">Total a Devolver</p>
                             <div className="text-2xl font-display font-medium text-white">{formatMT(l.statusCalc.totalADevolver)}</div>
                          </div>
                          <div className="text-right">
                             <p className="text-[11px] text-slate-400 mb-1">Juros</p>
                             <div className="text-lg font-medium text-amber-500">{formatMT(l.statusCalc.juroReal)}</div>
                          </div>
                       </div>
                     </button>
                   ))
                 )}
              </motion.div>
            )}

            {/* ── PERFIL / SETTINGS ── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold text-white px-2">Meu Perfil</h2>
                 <div className="bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center gap-4 border-b border-white/5">
                       <UserIcon className="w-5 h-5 text-blue-400"/>
                       <div className="flex-1 text-sm text-slate-300">{memberUser.nome}</div>
                    </div>
                    <div className="p-4 flex items-center gap-4 border-b border-white/5">
                       <Phone className="w-5 h-5 text-blue-400"/>
                       <div className="flex-1 text-sm text-slate-300">{memberUser.telefone || 'Não definido'}</div>
                    </div>
                    {memberUser.email && (
                      <div className="p-4 flex items-center gap-4 border-b border-white/5">
                         <FileText className="w-5 h-5 text-blue-400"/>
                         <div className="flex-1 text-sm text-slate-300">{memberUser.email}</div>
                      </div>
                    )}
                    <div className="p-4 flex items-center gap-4 border-b border-white/5">
                       <MapPin className="w-5 h-5 text-blue-400"/>
                       <div className="flex-1 text-sm text-slate-300">
                          {memberUser.endereco || (memberUser.bairro ? `${memberUser.bairro}${memberUser.zona ? `, ${memberUser.zona}` : ''}, ${memberUser.cidade || 'Chimoio'}` : 'Endereço não definido')}
                       </div>
                    </div>
                    {memberUser.nuit && (
                      <div className="p-4 flex items-center gap-4 border-b border-white/5">
                         <Building2 className="w-5 h-5 text-blue-400"/>
                         <div className="flex-1 text-sm text-slate-300">NUIT: {memberUser.nuit}</div>
                      </div>
                    )}
                    {memberUser.bi && (
                      <div className="p-4 flex items-center gap-4 border-b border-white/5">
                         <CreditCard className="w-5 h-5 text-blue-400"/>
                         <div className="flex-1 text-sm text-slate-300">B.I.: {memberUser.bi}</div>
                      </div>
                    )}
                 </div>

                 {/* Contactos de Emergência no Painel */}
                 {(memberUser.conjuge_nome || memberUser.irmao_nome || memberUser.parente_nome) && (
                   <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-400 px-2 uppercase tracking-wide">Emergência / Parentes</h3>
                      <div className="bg-slate-800/20 rounded-3xl border border-white/5 p-2 space-y-1">
                         {memberUser.conjuge_nome && (
                           <div className="p-3 flex justify-between items-center bg-white/5 rounded-2xl">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cônjuge</span>
                             <div className="text-right">
                               <p className="text-sm font-medium text-white leading-none mb-1">{memberUser.conjuge_nome}</p>
                               <p className="text-xs text-blue-400/80 font-mono tracking-tighter leading-none">{memberUser.conjuge_numero}</p>
                             </div>
                           </div>
                         )}
                         {memberUser.irmao_nome && (
                           <div className="p-3 flex justify-between items-center bg-white/5 rounded-2xl">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Irmão(ã)</span>
                             <div className="text-right">
                               <p className="text-sm font-medium text-white leading-none mb-1">{memberUser.irmao_nome}</p>
                               <p className="text-xs text-blue-400/80 font-mono tracking-tighter leading-none">{memberUser.irmao_numero}</p>
                             </div>
                           </div>
                         )}
                         {memberUser.parente_nome && (
                           <div className="p-3 flex justify-between items-center bg-white/5 rounded-2xl">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Familiar</span>
                             <div className="text-right">
                               <p className="text-sm font-medium text-white leading-none mb-1">{memberUser.parente_nome}</p>
                               <p className="text-xs text-blue-400/80 font-mono tracking-tighter leading-none">{memberUser.parente_numero}</p>
                             </div>
                           </div>
                         )}
                      </div>
                   </div>
                 )}

                 <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-semibold text-slate-400 px-2 mb-2 uppercase tracking-wide">Ações de Gestão</h3>
                    <button onClick={() => setIsProfileEditOpen(true)} className="w-full flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl active:bg-slate-700/50 transition-colors border border-white/5">
                       <div className="flex items-center gap-3 text-white">
                         <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><Settings className="w-5 h-5"/></div>
                         <span className="font-medium">Editar Perfil</span>
                       </div>
                       <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                    <button onClick={() => generateMemberReport(memberUser, memberDetails)} className="w-full flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl active:bg-slate-700/50 transition-colors border border-white/5">
                       <div className="flex items-center gap-3 text-white">
                         <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-400"/></div>
                         <span className="font-medium">Extrato em PDF</span>
                       </div>
                       <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* ── BOTTOM NAV BAR ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#090D14]/90 backdrop-blur-2xl border-t border-white/5 pb-2 pt-2">
            <div className="max-w-md mx-auto flex justify-between items-center px-4">
               <NavButton id="summary" label="Início" icon={Home} active={activeTab} set={setActiveTab} />
               <NavButton id="assets" label="Carteira" icon={Wallet} active={activeTab} set={setActiveTab} />
               <NavButton id="loans" label="Crédito" icon={CreditCard} active={activeTab} set={setActiveTab} />
               <NavButton id="profile" label="Perfil" icon={UserCircle} active={activeTab} set={setActiveTab} />
            </div>
        </nav>

        {/* ── MODALS (BOTTOM SHEETS) ── */}
        <AnimatePresence>
          {isLoanOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLoanOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#111827] rounded-t-3xl p-6 sm:max-w-md w-full mx-auto pb-8">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Solicitar Crédito</h3>
                  <button onClick={() => setIsLoanOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleLoanSubmit} className="space-y-5">
                   <div className="bg-slate-800/50 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-medium mb-1">Limite Disponível</p>
                      <p className="text-2xl font-display font-medium text-white">{formatMT(loanLimit)}</p>
                   </div>
                   <div>
                       <label className="text-sm font-medium text-slate-300 block mb-2">Valor (MZN)</label>
                       <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-display" placeholder="0.00" type="number" step="0.01" />
                   </div>
                   <div>
                       <label className="text-sm font-medium text-slate-300 block mb-2">Motivo</label>
                       <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px]" placeholder="Ex: Investimento comercial..." />
                   </div>
                   <button disabled={createLoanMut.isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all flex justify-center items-center gap-2 mt-4">
                      {createLoanMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Solicitação"}
                   </button>
                </form>
              </motion.div>
            </div>
          )}

          {isDepositOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDepositOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#111827] rounded-t-3xl p-6 sm:max-w-md w-full mx-auto pb-8">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Aportar Capital</h3>
                  <button onClick={() => setIsDepositOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleDepositSubmit} className="space-y-5">
                   <div>
                       <label className="text-sm font-medium text-slate-300 block mb-2">Valor a Investir (MZN)</label>
                       <input required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-2xl text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-display" placeholder="0.00" type="number" step="0.01" />
                   </div>
                   <p className="text-xs text-slate-500 text-center">Taxa fixa de 30 MZN aplicável.</p>
                   <button disabled={createDepositMut.isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl transition-all flex justify-center items-center mt-2">
                      {createDepositMut.isPending ? "Processando..." : "Confirmar Depósito"}
                   </button>
                </form>
              </motion.div>
            </div>
          )}

          {selectedLoan && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLoan(null)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#111827] rounded-t-3xl p-6 sm:max-w-md w-full mx-auto pb-8 max-h-[85vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-semibold text-white">Detalhes do Crédito</h3>
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">ID: {selectedLoan.id.slice(0,8)}</span>
                     <button onClick={() => setSelectedLoan(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
                   </div>
                </div>
                
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl">
                     <span className="text-slate-400">Capital Liberado</span>
                     <span className="font-medium text-white">{formatMT(selectedLoan.statusCalc.base)}</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                     <span className="text-amber-400/80">Juros</span>
                     <span className="font-medium text-amber-400">+{formatMT(selectedLoan.statusCalc.juroReal)}</span>
                   </div>
                   <div className="flex justify-between items-center p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                     <span className="text-emerald-400 font-medium">Total para Liquidação</span>
                     <span className="text-xl font-bold text-emerald-400">{formatMT(selectedLoan.statusCalc.totalADevolver)}</span>
                   </div>
                </div>

                <div className="mb-8">
                   <h4 className="text-sm font-medium text-slate-300 mb-3 px-1">Distribuição de Lucro:</h4>
                   <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-800/50 p-3 rounded-xl border-l-2 border-blue-500">
                         <span className="text-[10px] text-slate-400 block mb-1">Membros (80%)</span>
                         <span className="font-medium text-blue-400">{formatMT(selectedLoan.statusCalc.juroReal * 0.8)}</span>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl border-l-2 border-amber-500">
                         <span className="text-[10px] text-slate-400 block mb-1">Sistema (20%)</span>
                         <span className="font-medium text-amber-500">{formatMT(selectedLoan.statusCalc.juroReal * 0.2)}</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => handleLiquidationRequest(selectedLoan.id, selectedLoan.statusCalc.totalADevolver)}
                  className="w-full bg-white text-black font-semibold py-4 rounded-xl transition-all flex justify-center items-center gap-2"
                  disabled={createLiqMet.isPending}
                >
                  {createLiqMet.isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : "Pagar Agora"}
                </button>
              </motion.div>
            </div>
          )}

          {isNotifOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#111827] rounded-t-3xl p-6 sm:max-w-md w-full mx-auto pb-8 max-h-[85vh] flex flex-col">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Notificações</h3>
                  <button onClick={() => setIsNotifOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="overflow-y-auto space-y-3 pb-6 flex-1">
                  {notifications.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Nenhuma notificação.</div>
                  ) : notifications.map(notif => (
                    <div key={notif.id} className={cn("p-4 rounded-2xl border", notif.read ? "bg-slate-800/30 border-white/5" : "bg-slate-800 border-blue-500/30")}>
                        <h4 className="text-sm font-semibold text-white mb-1">{notif.title}</h4>
                        <p className="text-xs text-slate-400 mb-2">{notif.message}</p>
                        <span className="text-[10px] text-slate-500">{formatDateTime(notif.ts)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {isProfileEditOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileEditOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#111827] rounded-t-3xl p-6 sm:max-w-md w-full mx-auto pb-8 max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Editar Perfil</h3>
                  <button onClick={() => setIsProfileEditOpen(false)} type="button" className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
                       <input value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} type="email" className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Telefone</label>
                       <input value={profileForm.telefone} onChange={e => setProfileForm({...profileForm, telefone: e.target.value.replace(/\D/g, '').slice(0, 9)})} pattern="^$|^[0-9]{9}$" title="Apenas números, com exatamente 9 dígitos" placeholder="Ex: 840000000" className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Profissão</label>
                       <input value={profileForm.profissao} onChange={e => setProfileForm({...profileForm, profissao: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">NUIT Fiscal</label>
                       <input value={profileForm.nuit} onChange={e => setProfileForm({...profileForm, nuit: e.target.value.replace(/\D/g, '').slice(0, 9)})} pattern="^$|^[0-9]{9}$" title="O NUIT deve conter exatamente 9 dígitos numéricos" placeholder="Ex: 123456789" className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Nº de B.I.</label>
                       <input value={profileForm.bi} onChange={e => setProfileForm({...profileForm, bi: e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 13)})} pattern="^$|^[0-9]{12}[A-Z]$" title="Deve conter 12 números e terminar com 1 letra (Ex: 123456789012A)" placeholder="Ex: 000000000000A" className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Bairro</label>
                       <input value={profileForm.bairro} onChange={e => setProfileForm({...profileForm, bairro: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                     <div>
                       <label className="text-xs font-semibold text-slate-400 mb-1 block">Zona</label>
                       <input value={profileForm.zona} onChange={e => setProfileForm({...profileForm, zona: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm" />
                     </div>
                   </div>
                   
                   <div className="pt-2">
                       <p className="text-xs text-blue-400 font-black uppercase tracking-[0.2em] mb-4">Contactos de Emergência / Parentes</p>
                       <div className="space-y-4">
                         {/* Cônjuge */}
                         <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                           <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cônjuge</div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Nome</label>
                             <input value={profileForm.conjuge_nome} onChange={e => setProfileForm({...profileForm, conjuge_nome: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Telefone</label>
                             <input value={profileForm.conjuge_numero} onChange={e => setProfileForm({...profileForm, conjuge_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                         </div>
                         
                         {/* Irmão */}
                         <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                           <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Irmão(ã)</div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Nome</label>
                             <input value={profileForm.irmao_nome} onChange={e => setProfileForm({...profileForm, irmao_nome: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Telefone</label>
                             <input value={profileForm.irmao_numero} onChange={e => setProfileForm({...profileForm, irmao_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                         </div>

                         {/* Outro Familiar */}
                         <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                           <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Outro Familiar</div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Nome</label>
                             <input value={profileForm.parente_nome} onChange={e => setProfileForm({...profileForm, parente_nome: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                           <div>
                             <label className="text-[9px] font-semibold text-slate-400 mb-1 block">Telefone</label>
                             <input value={profileForm.parente_numero} onChange={e => setProfileForm({...profileForm, parente_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs" />
                           </div>
                         </div>
                       </div>
                    </div>

                   <button disabled={createProfileEditMut.isPending} className="w-full bg-blue-600 text-white font-semibold flex justify-center py-4 rounded-xl mt-4 active:scale-95 transition-all">
                      {createProfileEditMut.isPending ? <Loader2 className="animate-spin w-5 h-5"/> : "Submeter Solicitação"}
                   </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
