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
import { useCreateLoanRequest, useCreateDepositRequest, useApproveDeletionRequest, useRejectDeletionRequest, useRequests, useCreateProfileEditRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";

// Seções que abrem e fecham
function SecaoDashboard({ 
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
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const createLoanMut = useCreateLoanRequest();
  const createDepositMut = useCreateDepositRequest();
  const createProfileEditMut = useCreateProfileEditRequest();

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfileEditMut.mutateAsync({
         data: {
           user_id: memberUser.id,
           user_nome: memberUser.nome,
           user_foto: memberUser.foto,
           ...profileForm
         }
      });
      setIsProfileEditOpen(false);
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

  // Limite = saldo + 50% do saldo (= 150% do saldo em caixa)
  const loanLimit = (memberDetails.emCaixa * 1.50);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6 pb-32 max-w-4xl mx-auto">
      {/* Cabeçalho de Identificação */}
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

      {/* Avisos Rápidos Dinâmicos */}
      <MemberTechSlides userData={memberUser} loans={myActiveLoans || []} />

      {/* Cartão de Saldo Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none text-primary">
           <Wallet className="w-32 h-32 sm:w-48 sm:h-48" />
        </div>
        
        <p className="text-primary/70 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-2 px-1">Meu Dinheiro no Cofre</p>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
          {formatMT(memberDetails.patrimonioTotal)}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] sm:text-[9px] uppercase font-black mb-1">
                <ArrowDownRight className="w-3 h-3 text-success" /> Saldo em Mão
             </div>
             <div className="text-base sm:text-xl font-bold">{formatMT(memberDetails.emCaixa)}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-muted-foreground text-[8px] sm:text-[9px] uppercase font-black mb-1">
                <ArrowUpRight className="w-3 h-3 text-primary" /> Dinheiro Investido
             </div>
             <div className="text-base sm:text-xl font-bold">{formatMT(memberDetails.totalEmCirculacao)}</div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsDepositOpen(true)}
            className="flex-1 bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-md text-xs uppercase"
          >
            <Plus className="w-4 h-4" /> Colocar Dinheiro
          </button>
          <button 
            onClick={() => setIsLoanOpen(true)}
            className="flex-1 bg-[#111] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#222] transition-all active:scale-95 border border-white/10 shadow-md text-xs uppercase"
          >
            <CreditCard className="w-4 h-4" /> Pedir Empréstimo
          </button>
        </div>
      </motion.div>

      {/* Secções de Detalhes */}
      <div className="space-y-4 pt-4">
        
        {/* Pedidos de Remoção (Se houver) */}
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
                    <h3 className="font-bold text-lg text-white">Limpeza de Histórico</h3>
                    <p className="text-[10px] text-destructive/80 uppercase font-black tracking-widest">O Gestor quer remover estes registos:</p>
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
                          {approveDelMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Aceitar Limpeza</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SecaoDashboard
          id="summary"
          title="Resumo Geral"
          badge="Meus Números"
          icon={TrendingUp}
          isOpen={expandedSection === 'summary'}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 p-5 rounded-[2.5rem] border border-white/5">
            {[
              { label: "Co-fre Total", val: formatMT(globalStats?.total || 0), icon: Wallet },
              { label: "Em Caixa", val: formatMT(globalStats?.caixa || 0), icon: ArrowDownRight },
              { label: "Investido", val: formatMT(globalStats?.naRua || 0), icon: ArrowUpRight },
              { label: "Meus Lucros", val: formatMT(globalStats?.lucros || 0), icon: TrendingUp }
            ].map((stat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-wider opacity-60">{stat.label}</span>
                <div className="text-sm font-bold truncate">{stat.val}</div>
              </div>
            ))}
          </div>
        </SecaoDashboard>

        <SecaoDashboard
          id="loans"
          title="Pagamentos e Dívidas"
          badge={myActiveLoans.length > 0 ? `${myActiveLoans.length} Contratos` : "Sem dívidas"}
          icon={Clock}
          isOpen={expandedSection === 'loans'}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            {myActiveLoans.length === 0 ? (
              <div className="bg-white/5 p-8 rounded-[2rem] border-dashed border-white/10 text-center text-muted-foreground italic text-xs">
                Você não tem empréstimos ativos no momento.
              </div>
            ) : (
              myActiveLoans.map((loan) => (
                <div 
                  key={loan.id}
                  className="bg-white/5 p-5 rounded-[2rem] border border-white/10 space-y-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${
                    loan.statusCalc.mes === 3 ? "bg-destructive animate-pulse" : 
                    loan.statusCalc.mes === 2 ? "bg-warning" : "bg-success"
                  }`} />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm">Contrato #{loan.id.slice(0, 5)}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase font-black">Base: {formatMT(loan.statusCalc.base)}</p>
                    </div>
                    <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                      loan.statusCalc.mes === 3 ? "bg-destructive/10 text-destructive border-destructive/20" : 
                      loan.statusCalc.mes === 2 ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"
                    }`}>
                      Mês atual: {loan.statusCalc.mes} — Taxa: {loan.statusCalc.taxa}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Juros</p>
                      <p className="text-base font-bold text-white">{formatMT(loan.statusCalc.juroReal)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Total a Devolver</p>
                      <p className="text-base font-bold text-primary">{formatMT(loan.statusCalc.totalADevolver)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Prazo Restante</p>
                      <p className={`text-base font-black ${loan.statusCalc.diasRestantes <= 5 ? "text-destructive" : "text-white"}`}>
                         {loan.statusCalc.diasRestantes} dias
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SecaoDashboard>

        <SecaoDashboard
          id="profile"
          title="Minha Conta"
          badge="Perfil"
          icon={UserIcon}
          isOpen={expandedSection === 'profile'}
          onToggle={toggleSection}
        >
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-primary/40" />
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Nome do Membro</p>
                     <p className="text-xs font-bold text-white">{memberUser.nome}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary/40" />
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Contacto</p>
                     <p className="text-xs font-bold text-white">{memberPhone || "N/A"}</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary/40" />
                  <div>
                     <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Localidade</p>
                     <p className="text-xs font-bold text-white">{memberUser.bairro || "Chimoio"}</p>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4">
               <button 
                 onClick={() => setIsProfileEditOpen(true)}
                 className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black transition-all active:scale-95 text-xs uppercase"
               >
                 <Settings className="w-4 h-4" /> Alterar Meus Dados
               </button>
               <button 
                 onClick={() => generateMemberReport(memberUser, memberDetails)}
                 className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 px-8 py-4 rounded-2xl font-black hover:bg-primary/20 transition-all active:scale-95 text-xs uppercase"
               >
                 <FileText className="w-4 h-4" /> Baixar Extrato Oficial (PDF)
               </button>
            </div>
          </div>
        </SecaoDashboard>

      </div>

      {/* MODAL DE EMPRÉSTIMO */}
      <AnimatePresence>
        {isLoanOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoanOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 border-white/10 relative z-10 shadow-2xl">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Novo Empréstimo</h2>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-6">Seu Limite: {formatMT(loanLimit)}</p>

              <form onSubmit={handleLoanSubmit} className="space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase mb-2">Quanto você precisa? (MT)</label>
                  <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} type="text" placeholder="0.00 MT" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase mb-2">Para que será o dinheiro?</label>
                  <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} placeholder="Explique brevemente..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary transition-all min-h-[100px] resize-none" />
                </div>
                <button 
                  disabled={createLoanMut.isPending}
                  className="w-full bg-primary text-black py-5 rounded-3xl font-black text-xs uppercase hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {createLoanMut.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar Pedido de Crédito'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* ... (Outros Modais seguem a mesma lógica de simplificação) */}
    </div>
  );
}
