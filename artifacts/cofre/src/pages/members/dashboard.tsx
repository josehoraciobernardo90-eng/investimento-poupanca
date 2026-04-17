import { useMember } from "@/hooks/use-member";
import { formatMT, formatDateTime, cn } from "@/lib/utils";
import { 
  Wallet, TrendingUp, History, LogOut, 
  ArrowUpRight, ArrowDownRight, Shield, 
  User as UserIcon, Phone, MapPin, 
  Lock, CreditCard, Bell, FileText, 
  X, Plus, Calculator, Info, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  ChevronDown,
  BookOpen,
  Settings,
  Mail,
  Users2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useApproveDeletionRequest, useRejectDeletionRequest, useRequests, useCreateProfileEditRequest, useCreateLiquidationRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";
import { createPortal } from "react-dom";

// Seções que abrem e fecham
function SecaoDashboard({ 
  id, title, icon: Icon, children, isOpen, onToggle, 
  badge 
}: any) {
  return (
    <div className="space-y-4">
      <button 
        onClick={() => onToggle(id)}
        className={cn(
          "w-full flex items-center justify-between p-4 sm:p-6 rounded-[2rem] transition-all border group",
          isOpen 
            ? "bg-white/10 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
            : "bg-white/5 border-white/5 hover:bg-white/8 hover:scale-[1.01]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
            isOpen ? "bg-primary/20 border-primary/20 text-primary rotate-3" : "bg-white/5 border-white/5 text-muted-foreground group-hover:text-white"
          )}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-base sm:text-lg tracking-tight group-hover:translate-x-1 transition-transform">{title}</h3>
            {badge && (
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                isOpen ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
              )}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-full bg-white/5 border border-white/5 transition-all duration-500",
          isOpen ? "rotate-180 bg-primary/20 border-primary/20 text-primary scale-110" : "text-muted-foreground group-hover:scale-110"
        )}>
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-1 sm:p-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MemberDashboard() {
  const { logout, memberUser, memberDetails } = useMember();
  const { notifications } = useNotifications();
  const { data: globalStats } = useDashboard();
  
  const [expandedSection, setExpandedSection] = useState<string | null>("summary");

  const toggleSection = useCallback((id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  }, []);

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const createLoanMut = useCreateLoanRequest();
  const createDepositMut = useCreateDepositRequest();
  const createProfileEditMut = useCreateProfileEditRequest();
  const createLiqMut = useCreateLiquidationRequest();

  const [profileForm, setProfileForm] = useState({
    conjuge_nome: memberUser?.conjuge_nome || "",
    conjuge_numero: memberUser?.conjuge_numero || "",
    irmao_nome: memberUser?.irmao_nome || "",
    irmao_numero: memberUser?.irmao_numero || "",
    parente_nome: memberUser?.parente_nome || "",
    parente_numero: memberUser?.parente_numero || "",
    bairro: memberUser?.bairro || "",
    zona: memberUser?.zona || "",
    email: memberUser?.email || ""
  });

  const { deletionRequests } = useRequests();
  const approveDelMut = useApproveDeletionRequest();
  const rejectDelMut = useRejectDeletionRequest();

  if (!memberUser || !memberDetails) return null;

  const myDeletionRequests = deletionRequests.filter(r => r.user_id === memberUser.id && r.status === "Pendente");

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
      setLoanAmount("");
      setLoanReason("");
      // Fechar com timeout para evitar erro de reconciliação DOM
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
    if (!confirm(`Confirmar envio de pedido de liquidação total de ${formatMT(amount)}?`)) return;
    try {
      await createLiqMut.mutateAsync({
        data: { user_id: memberUser.id, loan_id: loanId, valor: amount }
      });
    } catch {}
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfileEditMut.mutateAsync({ data: { user_id: memberUser.id, user_nome: memberUser.nome, user_foto: memberUser.foto, ...profileForm } });
      setTimeout(() => setIsProfileEditOpen(false), 100);
    } catch {}
  };

  const loanLimit = (memberDetails.emCaixa * 1.50);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6 pb-32 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
            <Shield className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase italic">Cofre Elite</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Olá, {memberUser.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setIsNotifOpen(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 relative">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
          </button>
          <button onClick={logout} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <MemberTechSlides userData={memberUser} loans={myActiveLoans || []} />

      {/* Cartão de Saldo Elite */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none text-primary"><Wallet className="w-32 h-32 sm:w-48 sm:h-48" /></div>
        <p className="text-primary/70 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-2 px-1">Meu Dinheiro no Cofre</p>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent italic">{formatMT(memberDetails.patrimonioTotal)}</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] uppercase font-black mb-1"><ArrowDownRight className="w-3 h-3 text-success" /> Saldo em Mão</div>
             <div className="text-sm sm:text-xl font-bold">{formatMT(memberDetails.emCaixa)}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] uppercase font-black mb-1"><ArrowUpRight className="w-3 h-3 text-primary" /> Investido</div>
             <div className="text-sm sm:text-xl font-bold">{formatMT(memberDetails.totalEmCirculacao)}</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setIsDepositOpen(true)} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-lg"><Plus className="w-4 h-4" /> Colocar Dinheiro</button>
          <button onClick={() => setIsLoanOpen(true)} className="flex-1 bg-black/40 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black/60 transition-all border border-white/10 active:scale-95 shadow-lg"><CreditCard className="w-4 h-4" /> Pedir Empréstimo</button>
        </div>
      </motion.div>

      {/* Seções Accordion */}
      <div className="space-y-4 pt-4">
        <SecaoDashboard id="summary" title="Resumo Geral" badge="Global" icon={TrendingUp} isOpen={expandedSection === 'summary'} onToggle={toggleSection}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white/5 p-5 rounded-[2rem] border border-white/5">
            {[
              { label: "Capital Total", val: formatMT(globalStats?.total || 0) },
              { label: "Hoje em Caixa", val: formatMT(globalStats?.caixa || 0) },
              { label: "Em Circulação", val: formatMT(globalStats?.naRua || 0) },
              { label: "Lucros do Banco", val: formatMT(globalStats?.lucros || 0) }
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                <span className="text-[7px] text-white/40 font-black uppercase tracking-widest block mb-1">{s.label}</span>
                <span className="text-sm font-bold text-white">{s.val}</span>
              </div>
            ))}
          </div>
        </SecaoDashboard>

        <SecaoDashboard id="loans" title="Pagamentos e Dívidas" badge={myActiveLoans.length.toString()} icon={Clock} isOpen={expandedSection === 'loans'} onToggle={toggleSection}>
          <div className="space-y-4">
            {myActiveLoans.length === 0 ? (
              <div className="bg-white/5 p-10 rounded-[2rem] border border-dashed border-white/10 text-center text-[10px] uppercase font-black text-white/20">Sem contratos ativos no momento</div>
            ) : (
              myActiveLoans.map(l => (
                <div key={l.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                  <div className={cn("absolute top-0 right-0 w-1.5 h-full", l.statusCalc.mes === 3 ? "bg-destructive" : l.statusCalc.mes === 2 ? "bg-warning" : "bg-success")} />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight">Dívida #{l.id.slice(0, 6)}</h4>
                      <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Acordado: {formatMT(l.statusCalc.base)}</p>
                    </div>
                    <span className="text-[8px] font-black px-2 py-1 rounded-md bg-white/5 border border-white/10 uppercase tracking-widest">Mês {l.statusCalc.mes} (Taxa {l.statusCalc.taxa}%)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div><p className="text-[7px] text-white/40 uppercase font-black mb-1">Juros</p><p className="text-sm font-bold">{formatMT(l.statusCalc.juroReal)}</p></div>
                    <div><p className="text-[7px] text-white/40 uppercase font-black mb-1">Total Devolução</p><p className="text-sm font-bold text-primary">{formatMT(l.statusCalc.totalADevolver)}</p></div>
                    <div>
                      <p className="text-[7px] text-white/40 uppercase font-black mb-1">Faltam</p>
                      <p className="text-sm font-bold">{l.statusCalc.diasRestantes} dias</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <button 
                      onClick={() => handleLiquidationRequest(l.id, l.statusCalc.totalADevolver)}
                      disabled={createLiqMut.isPending}
                      className="w-full bg-white/5 hover:bg-white text-white hover:text-black py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/5 hover:border-white flex items-center justify-center gap-2"
                    >
                      {createLiqMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Enviar Pedido de Liquidação</>}
                    </button>
                    <p className="text-[7px] text-white/20 text-center mt-2 uppercase font-bold">O Admin confirmará o recebimento do valor total: {formatMT(l.statusCalc.totalADevolver)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SecaoDashboard>

        <SecaoDashboard id="profile" title="Perfil de Elite" icon={UserIcon} isOpen={expandedSection === 'profile'} onToggle={toggleSection}>
           <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] underline decoration-primary/20 underline-offset-8 mb-4">Dados Titulares</h4>
                    <div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-xl"><UserIcon className="w-4 h-4 text-primary" /></div><div><p className="text-[8px] text-white/40 uppercase font-black">Nome Completo</p><p className="text-xs font-bold">{memberUser.nome}</p></div></div>
                    <div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-xl"><Phone className="w-4 h-4 text-primary" /></div><div><p className="text-[8px] text-white/40 uppercase font-black">Telemóvel</p><p className="text-xs font-bold">{memberUser.telefone}</p></div></div>
                    <div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-xl"><MapPin className="w-4 h-4 text-primary" /></div><div><p className="text-[8px] text-white/40 uppercase font-black">Localidade Principal</p><p className="text-xs font-bold">{memberUser.bairro}, Chimoio</p></div></div>
                 </div>
                 <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Acções de Auditoria</h4>
                    <button onClick={() => setIsProfileEditOpen(true)} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase mb-3 text-white/60"><span>Editar Meus Dados</span><Settings className="w-4 h-4" /></button>
                    <button onClick={() => generateMemberReport(memberUser, memberDetails)} className="w-full flex items-center justify-between p-4 bg-primary/20 hover:bg-primary/30 rounded-2xl border border-primary/20 transition-all text-[10px] font-black uppercase text-primary shadow-lg shadow-primary/10"><span>Emitir Extrato PDF</span><FileText className="w-4 h-4" /></button>
                 </div>
              </div>
           </div>
        </SecaoDashboard>
      </div>

      {/* PORTAIS DE MODAIS (BLINDADOS) */}
      {createPortal(
        <AnimatePresence>
          {isLoanOpen && (
            <motion.div key="modal-loan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,212,255,0.2)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Solicitar Empréstimo</h2>
                  <button onClick={() => setIsLoanOpen(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleLoanSubmit} className="space-y-6">
                   <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl text-center">
                      <p className="text-[8px] text-primary/60 font-black uppercase tracking-[0.2em] mb-2">Seu Limite Base de Elite</p>
                      <p className="text-2xl font-black text-white italic">{formatMT(loanLimit)}</p>
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-white/40 uppercase mb-2 block px-1">Valor Requisitado (MT)</label>
                      <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} type="text" placeholder="Ex: 5.000,00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold text-white focus:border-primary transition-all text-center" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-white/40 uppercase mb-2 block px-1">Justificativa para o Banco</label>
                      <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} placeholder="Breve resumo..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary transition-all min-h-[100px] resize-none" />
                   </div>
                   <button disabled={createLoanMut.isPending} className="w-full bg-primary text-black py-5 rounded-3xl font-black text-[10px] uppercase shadow-xl hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                      {createLoanMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar para Aprovação"}
                   </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {isDepositOpen && (
            <motion.div key="modal-deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-success to-transparent" />
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Fazer Novo Aporte</h2>
                  <button onClick={() => setIsDepositOpen(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleDepositSubmit} className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-white/40 uppercase mb-2 block px-1">Valor do Aporte (MT)</label>
                      <input required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} type="text" placeholder="Ex: 10.000,00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold text-white focus:border-success transition-all text-center" />
                   </div>
                   <div className="p-5 bg-success/5 border border-success/20 rounded-2xl flex items-start gap-4">
                      <Info className="w-5 h-5 text-success flex-shrink-0" />
                      <p className="text-[10px] text-white/60 font-bold uppercase leading-relaxed">O valor será creditado no seu saldo oficial após a confirmação manual do Administrador Geral.</p>
                   </div>
                   <button disabled={createDepositMut.isPending} className="w-full bg-success text-white py-5 rounded-3xl font-black text-[10px] uppercase shadow-xl hover:shadow-success/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                      {createDepositMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Envio"}
                   </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {isProfileEditOpen && (
            <motion.div key="modal-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel w-full max-w-xl rounded-[2.5rem] p-8 border-white/10 relative my-auto shadow-2xl">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Perfil de Elite</h2>
                  <button onClick={() => setIsProfileEditOpen(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Users2 className="w-3 h-3" /> Contactos de Emergência</h4>
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Nome do Cônjuge</label><input value={profileForm.conjuge_nome} onChange={e => setProfileForm({...profileForm, conjuge_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Contacto Cônjuge</label><input value={profileForm.conjuge_numero} onChange={e => setProfileForm({...profileForm, conjuge_numero: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                      </div>
                      <div className="space-y-4 pt-4 md:pt-[26px]">
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Nome de Irmão/Irmã</label><input value={profileForm.irmao_nome} onChange={e => setProfileForm({...profileForm, irmao_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Contacto Irmão/Irmã</label><input value={profileForm.irmao_numero} onChange={e => setProfileForm({...profileForm, irmao_numero: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Morada e Digital</h4>
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Bairro de Residência</label><input value={profileForm.bairro} onChange={e => setProfileForm({...profileForm, bairro: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">Zona/Rua</label><input value={profileForm.zona} onChange={e => setProfileForm({...profileForm, zona: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                      </div>
                      <div className="space-y-4 pt-4 md:pt-[26px]">
                         <div><label className="text-[8px] font-black text-white/40 uppercase mb-1 block px-1">E-mail (Opcional)</label><input value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" /></div>
                      </div>
                   </div>
                   <button disabled={createProfileEditMut.isPending} className="w-full bg-white text-black py-5 rounded-3xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                      {createProfileEditMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Solicitar Alteração Cadastral"}
                   </button>
                   <p className="text-[10px] text-white/30 text-center font-black uppercase tracking-widest italic">Atenção: Os dados serão verificados individualmente pelo administrador.</p>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
