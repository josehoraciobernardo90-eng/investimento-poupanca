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
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useApproveDeletionRequest, useRejectDeletionRequest, useRequests } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { dbStore } from "@/data/firebase-data";

// Componente Robusto para Seções Expansíveis
function DashboardSection({ 
  id, title, icon: Icon, children, isOpen, onToggle, 
  badge, variant = "default" 
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const createLoanMut = useCreateLoanRequest();
  const createDepositMut = useCreateDepositRequest();

  const { deletionRequests } = useRequests();
  const approveDelMut = useApproveDeletionRequest();
  const rejectDelMut = useRejectDeletionRequest();

  if (!memberUser || !memberDetails) return null;

  const myDeletionRequests = deletionRequests.filter(r => r.user_id === memberUser.id && r.status === "Pendente");

  const calculateLoanStatus = (loan: any) => {
    const tsNow = Math.floor(Date.now() / 1000);
    const diffSecs = tsNow - loan.data_inicio;
    const diffDays = Math.floor(diffSecs / (24 * 3600));
    
    let mes = 1;
    let taxa = 10;
    if (diffDays >= 60) {
      mes = 3;
      taxa = 50;
    } else if (diffDays >= 30) {
      mes = 2;
      taxa = 20;
    }

    const juroReal = loan.valor_original * (taxa / 100);
    const totalADevolver = loan.valor_original + juroReal;
    const proximoVencimento = 30 * mes;
    const diasRestantes = Math.max(0, proximoVencimento - diffDays);

    return {
      mes, taxa, juroReal, totalADevolver, diasRestantes, base: loan.valor_original
    };
  };

  const myActiveLoans = dbStore.loans
    .filter(l => l.user_id === memberUser.id && l.status === "Ativo")
    .map(l => ({ ...l, statusCalc: calculateLoanStatus(l) }));

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(loanAmount.replace(/[^0-9.]/g, '')) * 100;
    if (isNaN(val) || val <= 0) return;
    try {
      await createLoanMut.mutateAsync({ data: { user_id: memberUser.id, valor: val, motivo: loanReason } });
      setIsLoanOpen(false);
      setLoanAmount("");
      setLoanReason("");
    } catch {}
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount.replace(/[^0-9.]/g, '')) * 100;
    if (isNaN(val) || val <= 0) return;
    try {
      await createDepositMut.mutateAsync({ data: { user_id: memberUser.id, valor: val } });
      setIsDepositOpen(false);
      setDepositAmount("");
    } catch {}
  };

  const loanLimit = (memberDetails.emCaixa * 1.30);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6 pb-32 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
            <Shield className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Cofre Capital</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Membro: {memberUser.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 relative"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            )}
          </button>
          <button 
            onClick={logout}
            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Card - Balance */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none">
           <Wallet className="w-32 h-32 sm:w-48 sm:h-48" />
        </div>
        
        <p className="text-primary/70 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2 px-1">Seu Património Pessoal</p>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
          {formatMT(memberDetails.patrimonioTotal)}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] sm:text-[9px] uppercase font-bold mb-1">
                <ArrowDownRight className="w-3 h-3 text-success" /> Saldo Base
             </div>
             <div className="text-base sm:text-xl font-bold">{formatMT(memberDetails.emCaixa)}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] sm:text-[9px] uppercase font-bold mb-1">
                <ArrowUpRight className="w-3 h-3 text-primary" /> Investido
             </div>
             <div className="text-base sm:text-xl font-bold">{formatMT(memberDetails.totalEmCirculacao)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsDepositOpen(true)}
            className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-md text-sm"
          >
            <Plus className="w-4 h-4" /> Solicitar Aporte
          </button>
          <button 
            onClick={() => setIsLoanOpen(true)}
            className="flex-1 bg-[#222] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition-all active:scale-95 border border-white/10 shadow-md text-sm"
          >
            <CreditCard className="w-4 h-4" /> Solicitar Empréstimo
          </button>
        </div>
      </motion.div>

      {/* REFACTOR: Accordion Style Sections */}
      <div className="space-y-4 pt-4">
        
        {/* Nova Secção: Aprovações de Exclusão (Testemunho) */}
        <AnimatePresence>
          {myDeletionRequests.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-[2.5rem] space-y-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center text-destructive border border-destructive/20">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Testemunho de Exclusão</h3>
                    <p className="text-[10px] text-destructive/80 uppercase font-bold tracking-widest">O Administrador solicita remover do histórico:</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {myDeletionRequests.map(req => (
                    <div key={req.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">
                            {req.target_type === 'loan' ? 'Empréstimo' : req.target_type === 'deposit' ? 'Aporte' : 'Adesão'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(req.details.ts)}</span>
                        </div>
                        <p className="text-xl font-black text-primary">{formatMT(req.details.valor || 0)}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          disabled={approveDelMut.isPending || rejectDelMut.isPending}
                          onClick={() => rejectDelMut.mutateAsync({ requestId: req.id })}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/5"
                        >
                          Rejeitar
                        </button>
                        <button
                          disabled={approveDelMut.isPending || rejectDelMut.isPending}
                          onClick={() => approveDelMut.mutateAsync({ requestId: req.id })}
                          className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-destructive text-white text-xs font-bold shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          {approveDelMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Aprovar</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Resumo do Cofre */}
        <DashboardSection
          id="summary"
          title="Resumo do Cofre"
          badge="Visão Global"
          icon={TrendingUp}
          isOpen={expandedSection === 'summary'}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 p-5 rounded-[2.5rem] border border-white/5">
            {[
              { label: "Total Cofre", val: formatMT(globalStats?.total || 0), icon: Wallet, color: "text-white" },
              { label: "Em Caixa", val: formatMT(globalStats?.caixa || 0), icon: ArrowDownRight, color: "text-success" },
              { label: "Na Rua", val: formatMT(globalStats?.naRua || 0), icon: ArrowUpRight, color: "text-primary" },
              { label: "Lucros", val: formatMT(globalStats?.lucros || 0), icon: TrendingUp, color: "text-success" },
              { label: "Membros", val: globalStats?.membros_ativos || 0, icon: Users, color: "text-white" },
              { label: "Contratos", val: globalStats?.emprestimos_ativos || 0, icon: Activity, color: "text-white" },
              { label: "Pendentes", val: globalStats?.solicitacoes_pendentes || 0, icon: Clock, color: "text-warning" }
            ].map((stat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 opacity-60">
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-sm sm:text-base font-bold truncate">{stat.val}</div>
              </div>
            ))}
          </div>
        </DashboardSection>

        {/* Section 2: Meus Pagamentos e Prazos */}
        <DashboardSection
          id="loans"
          title="Meus Pagamentos"
          badge={myActiveLoans.length > 0 ? `${myActiveLoans.length} Ativos` : "Sem débitos"}
          icon={Clock}
          isOpen={expandedSection === 'loans'}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            {myActiveLoans.length === 0 ? (
              <div className="bg-white/5 p-8 rounded-[2rem] border-dashed border-white/10 text-center text-muted-foreground italic text-xs">
                Nenhum empréstimo ativo no momento.
              </div>
            ) : (
              myActiveLoans.map((loan) => (
                <div 
                  key={loan.id}
                  className="bg-white/5 p-5 rounded-[2rem] border border-white/10 space-y-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${
                    loan.statusCalc.mes === 3 ? "bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)]" : 
                    loan.statusCalc.mes === 2 ? "bg-warning" : "bg-success"
                  }`} />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/10">
                        {memberUser.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{memberUser.nome}</h4>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Base: {formatMT(loan.statusCalc.base)}</p>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                      loan.statusCalc.mes === 3 ? "bg-destructive/10 text-destructive border-destructive/20" : 
                      loan.statusCalc.mes === 2 ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"
                    }`}>
                      Mês {loan.statusCalc.mes} — {loan.statusCalc.taxa}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1 opacity-60">Juro Real</p>
                      <p className="text-base font-bold text-white">{formatMT(loan.statusCalc.juroReal)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1 opacity-60">Total Retorno</p>
                      <p className="text-base font-bold text-primary">{formatMT(loan.statusCalc.totalADevolver)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1 opacity-60">Faltam</p>
                      <div className="flex items-center gap-2">
                         <p className={`text-base font-black ${loan.statusCalc.diasRestantes <= 5 ? "text-destructive animate-pulse" : "text-white"}`}>
                           {loan.statusCalc.diasRestantes} dias
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSection>

        {/* Section 3: Regras de Juro e Congelamento */}
        <DashboardSection
          id="rules"
          title="Protocolo de Juro"
          badge="Segurança"
          icon={AlertTriangle}
          isOpen={expandedSection === 'rules'}
          onToggle={toggleSection}
        >
          <div className="bg-warning/5 border border-warning/20 p-6 rounded-[2rem] space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-success">Mês 1</span>
                      <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-md font-bold">10%</span>
                   </div>
                   <p className="text-[9px] text-muted-foreground leading-relaxed">Devolve base + 10% no próximo mês.</p>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-warning">Mês 2</span>
                      <span className="text-[10px] bg-warning/20 text-warning px-2 py-0.5 rounded-md font-bold">20%</span>
                   </div>
                   <p className="text-[9px] text-muted-foreground leading-relaxed">Juro escalado para 20% no 2º mês.</p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-destructive">Mês 3⚠️</span>
                      <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-md font-bold">50%</span>
                   </div>
                   <p className="text-[9px] text-destructive leading-relaxed font-bold">Limite máximo. Bloqueio automático após 00:00.</p>
                </div>
             </div>
             
             <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  * Somente o administrador central pode desbloquear contas congeladas em Chimoio.
                </p>
             </div>
          </div>
        </DashboardSection>

        {/* Section 4: Gestão de Perfil */}
        <DashboardSection
          id="profile"
          title="Gestão de Perfil"
          badge="Conta"
          icon={UserIcon}
          isOpen={expandedSection === 'profile'}
          onToggle={toggleSection}
        >
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 border border-white/5">
                     <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-bold">ID Membro</p>
                     <p className="text-xs font-bold text-white">{memberUser.nome}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 border border-white/5">
                     <Phone className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-bold">Telefone</p>
                     <p className="text-xs font-bold text-white">{memberUser.telefone || "N/A"}</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 border border-white/5">
                     <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-bold">Chimoio</p>
                     <p className="text-xs font-bold text-white">{memberUser.bairro}</p>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
               <p className="text-[11px] text-muted-foreground leading-relaxed text-center sm:text-left opacity-70">
                  Relatório oficial certificado pela cloud para verificação de créditos e extrato.
               </p>
               <button 
                 onClick={() => generateMemberReport(memberUser, memberDetails)}
                 className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 px-8 py-4 rounded-2xl font-bold hover:bg-primary/20 transition-all active:scale-95 text-sm"
               >
                 <FileText className="w-5 h-5" /> Baixar Extrato Oficial
               </button>
            </div>
          </div>
        </DashboardSection>

      </div>

      {/* MODALS */}
      <AnimatePresence mode="popLayout">
        {isLoanOpen && (
          <div key="loan-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div key="loan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoanOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div key="loan-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 border-white/10 relative z-10 shadow-2xl">
              <button onClick={() => setIsLoanOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-white"><X className="w-6 h-6" /></button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20"><Calculator className="w-7 h-7" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Crédito Instante</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Solicitação de Empréstimo</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl mb-8">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Seu Limite Atual</span>
                  <Info className="w-3 h-3 text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-primary">{formatMT(loanLimit)}</p>
              </div>

              <form onSubmit={handleLoanSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Valor do Crédito</label>
                  <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} type="text" placeholder="0.00 MT" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Finalidade</label>
                  <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} placeholder="Ex: Investimento em negócio..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary transition-all min-h-[100px] resize-none" />
                </div>
                <button 
                  disabled={createLoanMut.isPending}
                  className="w-full bg-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createLoanMut.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Enviar Pedido</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isDepositOpen && (
          <div key="deposit-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div key="deposit-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDepositOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div key="deposit-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 border-white/10 relative z-10 shadow-2xl">
              <button onClick={() => setIsDepositOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-white"><X className="w-6 h-6" /></button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-success/20 rounded-2xl flex items-center justify-center text-success border border-success/20"><Plus className="w-7 h-7" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Novo Aporte</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Injeção de Capital</p>
                </div>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Valor a Depositar</label>
                  <input required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} type="text" placeholder="0.00 MT" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-bold focus:outline-none focus:border-success transition-all text-center" />
                </div>
                <button 
                  disabled={createDepositMut.isPending}
                  className="w-full bg-white text-black py-5 rounded-3xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createDepositMut.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 text-success" /> Confirmar Pedido</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isNotifOpen && (
          <div key="notifications-modal-container" className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div key="notif-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNotifOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div 
              key="notif-content"
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }} 
              className="glass-panel w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 border-white/10 relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Notificações</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Atividade Recente</p>
                </div>
                <button onClick={() => setIsNotifOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {notifications.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                    <Bell className="w-12 h-12 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Sem novas notificações</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <motion.div 
                      key={notif.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-white/5 border border-white/5 p-5 rounded-3xl hover:bg-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                          notif.type === 'success' ? 'bg-success/10 text-success border-success/20' : 
                          notif.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(notif.ts)}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{notif.message}</p>
                      
                      {notif.deletionReqId && (
                        <div className="flex gap-2 mt-4">
                          <button
                            disabled={approveDelMut.isPending || rejectDelMut.isPending}
                            onClick={() => rejectDelMut.mutateAsync({ requestId: notif.deletionReqId! })}
                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold transition-all border border-white/5"
                          >
                            Rejeitar
                          </button>
                          <button
                            disabled={approveDelMut.isPending || rejectDelMut.isPending}
                            onClick={() => approveDelMut.mutateAsync({ requestId: notif.deletionReqId! })}
                            className="flex-1 px-4 py-2 rounded-xl bg-destructive text-white text-[10px] font-bold shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            {approveDelMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Aprovar</>}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] py-8 border-t border-white/5 mt-12 mx-8">
        Cloud Security Protocol • Chimoio • 2026
      </p>
    </div>
  );
}
