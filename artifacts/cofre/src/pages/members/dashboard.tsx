import { useMember } from "@/hooks/use-member";
import { formatMT, formatDateTime, cn } from "@/lib/utils";
import { 
  Wallet, LogOut, 
  ArrowUpRight, ArrowDownRight, Shield, 
  User as UserIcon, Phone, MapPin, 
  Lock, CreditCard, Bell, FileText, 
  X,
  Loader2,
  CheckCircle2,
  Activity,
  Settings,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useApproveDeletionRequest, useRejectDeletionRequest, useRequests, useCreateProfileEditRequest, useCreateLiquidationRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";
import { createPortal } from "react-dom";

const C = '#00d4ff'; // Cyan
const G = '#00ff8c'; // Green
const M = '#ff0080'; // Magenta
const Y = '#fbbf24'; // Amber (Admin)

function HudCorners() {
  return (
    <>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 z-20" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 z-20" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 z-20" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 z-20" />
    </>
  );
}

function HudPanel({ children, className, color = C }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: 'rgba(0,10,25,0.8)', border: `1px solid ${color}33`, borderRadius: '4px' }}>
      <HudCorners />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color} 2px, ${color} 4px)` }} />
      {children}
    </div>
  );
}

function HudLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', letterSpacing: '0.15em' }} className="text-cyan-500/40 uppercase font-black px-1">{children}</span>;
}

export default function MemberDashboard() {
  const { logout, memberUser, memberDetails } = useMember();
  const { notifications } = useNotifications();
  const { data: globalStats } = useDashboard();
  
  const [activeTab, setActiveTab] = useState<"summary" | "loans" | "profile">("summary");

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
  const createLiqMet = useCreateLiquidationRequest();

  const [profileForm, setProfileForm] = useState({
    // Dados pessoais editáveis
    telefone: memberUser?.telefone || "",
    email: memberUser?.email || "",
    // Endereço
    bairro: memberUser?.bairro || "",
    zona: memberUser?.zona || "",
    // Cônjuge
    conjuge_nome: memberUser?.conjuge_nome || "",
    conjuge_numero: memberUser?.conjuge_numero || "",
    // Familiar
    irmao_nome: memberUser?.irmao_nome || "",
    irmao_numero: memberUser?.irmao_numero || "",
    // Parente / Contacto de emergência
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
    if (!confirm(`Confirmar envio de pedido de liquidação total de ${formatMT(amount)}?`)) return;
    try {
      await createLiqMet.mutateAsync({
        data: { user_id: memberUser.id, loan_id: loanId, valor: amount }
      });
    } catch {}
  };

  const loanLimit = memberDetails.emCaixa * 1.50;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filtra campos vazios para não sobrescrever dados existentes com vazio
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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 font-mono">
      {/* Scanline Background */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00d4ff 2px, #00d4ff 4px)' }} />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-32 relative">
        
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5">
                <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
             </div>
             <div>
                <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-sm font-black tracking-widest text-white italic">MEMBRO_SECURE_PATH</h1>
                <p style={{ fontFamily: "'Share Tech Mono', monospace" }} className="text-[9px] text-cyan-500/40 uppercase">ID: {memberUser.id} · CHIMOIO_NODE</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-emerald-400">ONLINE</span>
                <span className="text-[8px] text-white/20">Uptime: 99.9%</span>
             </div>
             <button onClick={() => setIsNotifOpen(true)} className="p-2 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5 rounded relative group">
                <Bell className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[7px] font-black text-black">{unreadCount}</span>}
             </button>
             <button onClick={logout} className="p-2 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 rounded group">
                <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>

        <MemberTechSlides userData={memberUser} loans={myActiveLoans || []} />

        {/* MAIN HUD STATS */}
        <HudPanel className="p-8 group relative" color={C}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Wallet className="w-64 h-64" /></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
            <div>
              <HudLabel>// PATRIMÓNIO_TOTAL_LIQUIDEZ</HudLabel>
              <h2 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter mt-2 shadow-cyan-500/20 drop-shadow-xl">
                {formatMT(memberDetails.patrimonioTotal)}
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsDepositOpen(true)} className="px-6 py-2 bg-white text-black font-black text-[10px] uppercase rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">Aportar Capital</button>
              <button onClick={() => setIsLoanOpen(true)} className="px-6 py-2 border border-cyan-500/30 text-cyan-400 font-black text-[10px] uppercase rounded hover:bg-cyan-500/5 transition-all">Requisitar K</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 border-t border-cyan-500/10 pt-6">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded">
               <div className="flex items-center gap-2 mb-2"><ArrowDownRight className="w-3 h-3 text-emerald-400" /><HudLabel>VALOR_EM_CAIXA</HudLabel></div>
               <div className="text-xl font-black text-white leading-none">{formatMT(memberDetails.emCaixa)}</div>
            </div>
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded">
               <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-3 h-3 text-cyan-400" /><HudLabel>TOTAL_CIRCULANTE</HudLabel></div>
               <div className="text-xl font-black text-white leading-none">{formatMT(memberDetails.totalEmCirculacao)}</div>
            </div>
          </div>
        </HudPanel>

        {/* TAB NAVIGATION HUD */}
        <div className="flex gap-2 p-1 border border-cyan-500/10 bg-white/5 rounded">
           {([["summary", "Resumo", Activity], ["loans", "Finanças", CreditCard], ["profile", "Terminais", Settings]] as const).map(([id, label, Icon]) => (
             <button
               key={id}
               onClick={() => setActiveTab(id)}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === id ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]" : "text-white/40 hover:text-white"
               )}
             >
               <Icon className="w-3.5 h-3.5" /> {label}
             </button>
           ))}
        </div>

        {/* CONTENT PANELS */}
        <AnimatePresence mode="wait">
          {activeTab === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <HudPanel className="p-6">
                 <div className="flex items-center justify-between mb-4">
                    <HudLabel>SISTEMA_COFRE_GLOBAL_DATA</HudLabel>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] text-emerald-500">REAL-TIME SYNC</span></div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: "CAIXA_TOTAL", v: formatMT(globalStats?.caixa || 0) },
                      { l: "K_EM_RUA", v: formatMT(globalStats?.naRua || 0) },
                      { l: "COMUM_POOL", v: formatMT(globalStats?.total || 0) },
                      { l: "BANCO_ROI", v: formatMT(globalStats?.lucros || 0) }
                    ].map((s, i) => (
                      <div key={i} className="p-3 bg-black/40 border border-white/5 rounded group hover:border-cyan-500/30 transition-all">
                        <span className="text-[8px] text-white/30 block mb-1 font-black">{s.l}</span>
                        <span className="text-xs font-bold text-white font-mono">{s.v}</span>
                      </div>
                    ))}
                 </div>
              </HudPanel>
              
              <HudPanel className="p-6 overflow-hidden">
                 <div className="flex items-center justify-between mb-4"><HudLabel>HISTÓRICO_TÁCTICO_RECENTE</HudLabel></div>
                 <div className="space-y-2">
                    {dbStore.audit.filter(a => a.user === memberUser.nome || a.desc.includes(memberUser.nome)).slice(0, 4).map((a, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded bg-white/5 border border-white/5 font-mono">
                         <div>
                            <div className="text-[10px] text-white/80">{a.desc}</div>
                            <div className="text-[8px] text-cyan-500/40 uppercase">{formatDateTime(a.ts)}</div>
                         </div>
                         <div className="text-xs font-black" style={{ color: a.tipo === "LIQUIDACAO" ? G : C }}>{a.tipo}</div>
                      </div>
                    ))}
                 </div>
              </HudPanel>
            </motion.div>
          )}

          {activeTab === "loans" && (
            <motion.div key="loans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
               {myActiveLoans.length === 0 ? (
                 <HudPanel className="p-16 text-center border-dashed">
                    <Database className="w-8 h-8 text-white/10 mx-auto mb-4" />
                    <HudLabel>NEXUS_EMPTY // NENHUM CONTRATO DETECTADO</HudLabel>
                 </HudPanel>
               ) : (
                 myActiveLoans.map(l => (
                   <HudPanel key={l.id} className="p-6" color={l.statusCalc.mes === 3 ? M : l.statusCalc.mes === 2 ? Y : G}>
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <HudLabel>DÍVIDA_NODE #{l.id.slice(0, 6)}</HudLabel>
                            <h4 className="text-xl font-black text-white mt-1 italic uppercase tracking-tighter">Liquidamento Pendente</h4>
                         </div>
                         <div className="px-3 py-1 rounded border font-black text-[9px]" style={{ background: `${l.statusCalc.mes === 3 ? M : l.statusCalc.mes === 2 ? Y : G}11`, color: l.statusCalc.mes === 3 ? M : l.statusCalc.mes === 2 ? Y : G, borderColor: `${l.statusCalc.mes === 3 ? M : l.statusCalc.mes === 2 ? Y : G}33` }}>
                            PHASE_0{l.statusCalc.mes} · {l.statusCalc.taxa}% TAX
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                         <div><HudLabel>VALOR_BASE</HudLabel><div className="text-md font-bold mt-1">{formatMT(l.statusCalc.base)}</div></div>
                         <div><HudLabel>JUROS_ACRÉSCIMO</HudLabel><div className="text-md font-bold text-amber-500 mt-1">{formatMT(l.statusCalc.juroReal)}</div></div>
                         <div><HudLabel>TOTAL_RESOLUÇÃO</HudLabel><div className="text-md font-black text-rose-500 mt-1 underline decoration-rose-500/30 underline-offset-4">{formatMT(l.statusCalc.totalADevolver)}</div></div>
                         <div><HudLabel>EXPURAÇÃO_EM</HudLabel><div className="text-md font-bold text-white/60 mt-1">{l.statusCalc.diasRestantes} DIAS</div></div>
                      </div>

                      <button 
                        onClick={() => handleLiquidationRequest(l.id, l.statusCalc.totalADevolver)}
                        className="w-full py-4 border border-cyan-500/30 hover:bg-cyan-500 text-cyan-400 hover:text-black font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group"
                      >
                        <Lock className="w-4 h-4 group-hover:hidden" />
                        <CheckCircle2 className="w-4 h-4 hidden group-hover:block" />
                        AUTORIZAR LIQUIDAÇÃO TOTAL
                      </button>
                   </HudPanel>
                 ))
               )}
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HudPanel className="p-6">
                     <HudLabel>TERMINAL_USER_DATA</HudLabel>
                     <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
                           <UserIcon className="w-4 h-4 text-cyan-500" />
                           <div><span className="text-[7px] text-white/20 block font-black uppercase">Membro de Elite</span><span className="text-xs font-bold text-white">{memberUser.nome}</span></div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
                           <Phone className="w-4 h-4 text-cyan-500" />
                           <div><span className="text-[7px] text-white/20 block font-black uppercase">Canal Síncrono</span><span className="text-xs font-bold text-white">{memberUser.telefone}</span></div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
                           <MapPin className="w-4 h-4 text-cyan-500" />
                           <div><span className="text-[7px] text-white/20 block font-black uppercase">Localização Geo</span><span className="text-xs font-bold text-white">{memberUser.bairro}, Chimoio</span></div>
                        </div>
                     </div>
                  </HudPanel>
                  <HudPanel className="p-6 flex flex-col justify-between">
                     <HudLabel>SECURE_OPERATIONS</HudLabel>
                     <div className="mt-4 space-y-3">
                        <button onClick={() => setIsProfileEditOpen(true)} className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/40 rounded transition-all text-left">
                           <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Alterar Crypt-Dados</span>
                           <Settings className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button onClick={() => generateMemberReport(memberUser, memberDetails)} className="w-full flex justify-between items-center p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-all text-left">
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Extrair Relatório PDF</span>
                           <FileText className="w-4 h-4 text-emerald-400" />
                        </button>
                     </div>
                     <p className="text-[7px] text-white/20 uppercase font-black text-center mt-6">Protocolo de segurança fiduciária ativo v4.2</p>
                  </HudPanel>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PORTALS (MODAIS HUD) */}
      {createPortal(
        <AnimatePresence>
          {isLoanOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <HudPanel className="w-full max-w-md p-8 shadow-[0_0_100px_rgba(0,10,50,1)]">
                <div className="flex justify-between items-center mb-6">
                  <HudLabel>// REQUISIÇÃO_DE_K (CRÉDITO)</HudLabel>
                  <button onClick={() => setIsLoanOpen(false)} className="text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleLoanSubmit} className="space-y-6">
                   <div className="bg-cyan-500/5 p-4 border-l-2 border-cyan-500 rounded-r">
                      <p className="text-[8px] text-cyan-500/60 font-black uppercase tracking-widest mb-1">Limite de Mobilização</p>
                      <p className="text-2xl font-black text-white italic">{formatMT(loanLimit)}</p>
                   </div>
                   <div className="space-y-4">
                      <div>
                         <label className="text-[9px] font-black text-cyan-500/40 uppercase mb-2 block">Quantia Exata (MT)</label>
                         <input required value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="w-full bg-black/60 border border-cyan-500/20 rounded px-6 py-4 text-xl font-black text-white focus:border-cyan-500 outline-none text-center" placeholder="00.00" />
                      </div>
                      <div>
                         <label className="text-[9px] font-black text-cyan-500/40 uppercase mb-2 block">Justificativa Operacional</label>
                         <textarea required value={loanReason} onChange={e => setLoanReason(e.target.value)} className="w-full bg-black/60 border border-cyan-500/20 rounded px-6 py-4 text-xs font-bold text-white focus:border-cyan-500 outline-none min-h-[100px] resize-none" placeholder="MISSÃO DE INVESTIMENTO..." />
                      </div>
                   </div>
                   <button disabled={createLoanMut.isPending} className="w-full bg-cyan-500 text-black py-5 font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                      {createLoanMut.isPending ? "TRANSMITINDO..." : "INICIAR PROTOCOLO"}
                   </button>
                </form>
              </HudPanel>
            </motion.div>
          )}

          {isDepositOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <HudPanel className="w-full max-w-md p-8" color={G}>
                <div className="flex justify-between items-center mb-6">
                  <HudLabel>// APORTE_DE_LIQUIDEZ</HudLabel>
                  <button onClick={() => setIsDepositOpen(false)} className="text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleDepositSubmit} className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-emerald-500/40 uppercase mb-2 block">Valor do Depósito (MT)</label>
                      <input required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-black/60 border border-emerald-500/20 rounded px-6 py-4 text-xl font-black text-white focus:border-emerald-500 outline-none text-center" placeholder="00.00" />
                   </div>
                   <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded flex items-start gap-4">
                      <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                      <p className="text-[9px] text-white/60 font-black uppercase leading-relaxed tracking-wider">Atenção: Uma taxa fiduciária fixa de 30 MT será deduzida conforme protocolo oficial.</p>
                   </div>
                   <button disabled={createDepositMut.isPending} className="w-full bg-emerald-500 text-black py-5 font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(0,255,140,0.2)]">
                      {createDepositMut.isPending ? "PROCESSANDO..." : "VALIDAR APORTE"}
                   </button>
                </form>
              </HudPanel>
            </motion.div>
          )}

          {isProfileEditOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
              <HudPanel className="w-full max-w-xl p-8 my-auto overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                   <HudLabel>SYSTEM_CONFIG // PROFILE_OVERRIDE</HudLabel>
                   <button onClick={() => setIsProfileEditOpen(false)} className="text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {/* Aviso de fluxo */}
                <div className="mb-6 p-3 bg-cyan-500/5 border-l-2 border-cyan-500 rounded-r">
                  <p className="text-[8px] text-cyan-400/80 font-black uppercase tracking-widest leading-relaxed">
                    ⚠ As alterações serão enviadas ao Administrador para aprovação.<br />
                    Após aprovação, o perfil é sincronizado em tempo real para ambas as partes.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                   {/* SECÇÃO: Contacto Pessoal */}
                   <div>
                     <HudLabel>PERSONAL_CHANNEL</HudLabel>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                       <div>
                         <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Telefone</label>
                         <input value={profileForm.telefone} onChange={e => setProfileForm({...profileForm, telefone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500 transition-colors" placeholder={memberUser.telefone || "ex: 84xxxxxxx"} />
                       </div>
                       <div>
                         <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">E-mail</label>
                         <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500 transition-colors" placeholder={memberUser.email || "ex: nome@email.com"} />
                       </div>
                     </div>
                   </div>

                   {/* SECÇÃO: Localização */}
                   <div className="pt-4 border-t border-white/5">
                      <HudLabel>LOCAL_CALIBRATION</HudLabel>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                         <div>
                           <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Bairro</label>
                           <input value={profileForm.bairro} onChange={e => setProfileForm({...profileForm, bairro: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" placeholder={memberUser.bairro || "Bairro"} />
                         </div>
                         <div>
                           <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Zona / Rua</label>
                           <input value={profileForm.zona} onChange={e => setProfileForm({...profileForm, zona: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" placeholder={memberUser.zona || "Zona/Rua"} />
                         </div>
                      </div>
                   </div>

                   {/* SECÇÃO: Contactos de Emergência */}
                   <div className="pt-4 border-t border-white/5">
                     <HudLabel>EMERGENCY_NODES</HudLabel>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                       <div className="space-y-3">
                         <p className="text-[7px] text-cyan-500/40 font-black uppercase">→ Cônjuge</p>
                         <div><label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Nome</label><input value={profileForm.conjuge_nome} onChange={e => setProfileForm({...profileForm, conjuge_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" /></div>
                         <div><label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Telemóvel</label><input value={profileForm.conjuge_numero} onChange={e => setProfileForm({...profileForm, conjuge_numero: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" /></div>
                       </div>
                       <div className="space-y-3">
                         <p className="text-[7px] text-cyan-500/40 font-black uppercase">→ Familiar / Irmão</p>
                         <div><label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Nome</label><input value={profileForm.irmao_nome} onChange={e => setProfileForm({...profileForm, irmao_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" /></div>
                         <div><label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Telemóvel</label><input value={profileForm.irmao_numero} onChange={e => setProfileForm({...profileForm, irmao_numero: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" /></div>
                       </div>
                     </div>
                     {/* Parente extra */}
                     <div className="grid grid-cols-2 gap-4 mt-4">
                       <div>
                         <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Parente (nome)</label>
                         <input value={profileForm.parente_nome} onChange={e => setProfileForm({...profileForm, parente_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" />
                       </div>
                       <div>
                         <label className="text-[8px] font-black text-white/20 uppercase mb-1 block">Parente (tel.)</label>
                         <input value={profileForm.parente_numero} onChange={e => setProfileForm({...profileForm, parente_numero: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-xs text-white outline-none focus:border-cyan-500" />
                       </div>
                     </div>
                   </div>

                   <button disabled={createProfileEditMut.isPending} className="w-full bg-white text-black py-5 font-black text-[11px] uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2">
                      {createProfileEditMut.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> UPLOAD_IN_PROGRESS...</>
                        : <><Database className="w-4 h-4" /> SUBMETER ALTERAÇÕES
                      </>}
                   </button>
                </form>
              </HudPanel>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
