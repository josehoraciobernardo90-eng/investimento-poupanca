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
  UserCircle,
  Camera,
  Scan,
  Trophy,
  Calculator,
  Zap,
  Star,
  ShieldAlert,
  Receipt,
  Sparkles,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode, useRef, useEffect, useMemo } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { generateMemberReport } from "@/lib/pdf-utils";
import { useCreateLoanRequest, useCreateDepositRequest, useRequests, useCreateProfileEditRequest, useCreateLiquidationRequest, useApproveDeletionRequest, useRejectDeletionRequest } from "@/hooks/use-requests";
import { useDashboard } from "@/hooks/use-dashboard";
import { MemberTechSlides } from "@/components/dashboard/MemberTechSlides";
import { dbStore } from "@/data/firebase-data";
import { HudBell } from "@/components/ui/HudBell";
import { InnovationHub } from "@/components/dashboard/InnovationHub";
import { GeralIntelligence } from "@/components/dashboard/GeralIntelligence";
import { NotificationHub } from "@/components/dashboard/NotificationHub";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";
import { ReceiptScanner } from "@/components/dashboard/ReceiptScanner";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { useToast } from "@/hooks/use-toast";

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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-1">
    <div className="w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{children}</span>
  </div>
);

export default function MemberDashboard() {
  const { logout, memberUser, memberDetails } = useMember();
  const { notifications } = useNotifications();
  const { data: globalStats } = useDashboard();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"summary" | "assets" | "loans" | "profile" | "rank" | "simulator">("summary");

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhoto, setDepositPhoto] = useState<string | null>(null);
  const [liquidationAmount, setLiquidationAmount] = useState("");
  const [liquidationPhoto, setLiquidationPhoto] = useState<string | null>(null);
  const [isLiqScannerOpen, setIsLiqScannerOpen] = useState(false);
  const [simAmount, setSimAmount] = useState(10000);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);

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

  const [newPhoto, setNewPhoto] = useState<string | null>(null);

  if (!memberUser || !memberDetails) return null;

  const myActiveLoans = (dbStore.loans || [])
    .filter(l => l.user_id === memberUser.id && l.status === "Ativo")
    .map(l => ({ ...l, statusCalc: calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0) }));

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
      await createDepositMut.mutateAsync({ 
        data: { 
          user_id: memberUser.id, 
          valor: val,
          foto: depositPhoto || ""
        } 
      });
      setDepositAmount("");
      setDepositPhoto(null);
      setTimeout(() => setIsDepositOpen(false), 100);
    } catch {}
  };

  const handleLiquidationRequest = async (loanId: string, valor: number) => {
    if (!liquidationPhoto) {
      toast({ 
        title: "Comprovativo Necessário", 
        description: "Por favor, anexe a foto do recibo para validar o pagamento.",
        variant: "destructive" 
      });
      return;
    }

    const loan = (dbStore.loans || []).find(l => l.id === loanId);
    if (loan) {
      const status = calcularStatusEmprestimo(loan.valor_original, loan.data_inicio, loan.valor_pago || 0);
      if (valor > status.totalDevido + 10) { // Margem de 0.10 para arredondamentos
        toast({
          title: "Valor Excedido",
          description: `Você não pode pagar mais do que a dívida atual (${formatMT(status.totalDevido)}).`,
          variant: "destructive"
        });
        return;
      }
    }
    try {
      const success = await createLiqMet.mutateAsync({ 
        data: { 
          user_id: memberUser.id, 
          loan_id: loanId, 
          valor, 
          foto: liquidationPhoto 
        } 
      });
      if (success) {
        setSelectedLoan(null);
        setLiquidationAmount("");
        setLiquidationPhoto(null);
      }
    } catch {}
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturingProfile, setIsCapturingProfile] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "error">("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (isCapturingProfile) {
      startCamera();
    }
  }, [facingMode]);

  const startCamera = async () => {
    setIsCapturingProfile(true);
    setCameraStatus("requesting");
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("error");
      toast({ 
        title: "Câmara Inacessível", 
        description: "O seu navegador ou conexão (HTTP) não permite acesso à câmara. Use a galeria.",
        variant: "destructive"
      });
      setIsCapturingProfile(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 640 }, 
          height: { ideal: 640 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraStatus("active");
        };
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      setCameraStatus("error");
      setIsCapturingProfile(false);
      toast({ 
        title: "Erro de Permissão", 
        description: "Não foi possível aceder à câmara. Por favor, verifique as permissões do navegador.",
        variant: "destructive" 
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturingProfile(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const vid = videoRef.current;
        const minDim = Math.min(vid.videoWidth, vid.videoHeight);
        const startX = (vid.videoWidth - minDim) / 2;
        const startY = (vid.videoHeight - minDim) / 2;
        ctx.drawImage(vid, startX, startY, minDim, minDim, 0, 0, 600, 600);
        setNewPhoto(canvas.toDataURL("image/jpeg", 0.7));
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 600;
          canvas.height = 600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 600, 600);
            setNewPhoto(canvas.toDataURL("image/jpeg", 0.7));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const loanLimit = memberDetails.emCaixa * 1.50;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dadosNaoVazios: any = {};
    Object.entries(profileForm).forEach(([k, v]) => { if (v && v.trim() !== "") dadosNaoVazios[k] = v.trim(); });
    
    if (newPhoto) {
      dadosNaoVazios.foto = newPhoto;
    }

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
                  {memberUser.foto?.startsWith('data:image') || memberUser.foto?.startsWith('http') ? (
                    <img src={memberUser.foto} className="w-full h-full object-cover" alt={memberUser.nome} />
                  ) : (
                    memberUser.foto || <UserIcon className="w-6 h-6"/>
                  )}
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
                
                {/* ── HERO BALANCE: PATRIMÓNIO ABSOLUTO ── */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700"><ShieldCheck className="w-48 h-48 text-white"/></div>
                   <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                   
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em]">Património Total Calculado</span>
                      </div>
                      <div className="font-display text-5xl font-black text-white tracking-tighter italic mb-2">
                        {formatMT(memberDetails.emCaixa + memberDetails.totalEmCirculacao + (memberUser.lucro_acumulado || 0) + memberDetails.totalJuroEsperado)}
                      </div>
                      <p className="text-xs text-blue-200/50 font-medium uppercase tracking-widest mb-8">Valor total com Juros Inclusos</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setIsDepositOpen(true)} className="bg-white text-black rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all active:scale-95 shadow-xl">
                            <ArrowDownRight className="w-4 h-4" /> Aportar
                         </button>
                         <button onClick={() => setIsLoanOpen(true)} className="bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95">
                            <ArrowUpRight className="w-4 h-4" /> Crédito
                         </button>
                      </div>
                   </div>
                </div>

                 {/* ── INOVAÇÃO & SIMULAÇÃO (TECNOLOGIA DE ÚLTIMA GERAÇÃO) ── */}
                 <div className="space-y-6">
                    <InnovationHub loans={myActiveLoans} isAdmin={false} />
                    
                    <GeralIntelligence 
                      memberBalance={memberDetails.emCaixa}
                      recentRequests={[
                        ...dbStore.membershipRequests,
                        ...dbStore.loanRequests,
                        ...dbStore.depositRequests
                      ].sort((a, b) => b.ts - a.ts)}
                      isAdmin={false}
                    />
                  </div>

                  {/* ── MÉTRICAS INDIVIDUAIS (PRESSURIZADO) ── */}
                  {(() => {
                     const lucroRealizado = memberUser.lucro_acumulado || 0;
                     const lucroProjetado = myActiveLoans.reduce((acc, l) => acc + (l.statusCalc.juro + (l.statusCalc.multaAtraso || 0)), 0);
                     const lucroTotal = lucroRealizado + lucroProjetado;

                     return (
                        <div className="grid grid-cols-1 gap-4">
                           <button 
                             onClick={() => setIsProfitModalOpen(true)}
                             className="bg-gradient-to-br from-emerald-500/20 via-slate-900/40 to-slate-900/40 rounded-[2rem] p-7 border border-emerald-500/20 relative overflow-hidden group shadow-2xl text-left active:scale-[0.98] transition-all"
                           >
                              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24 text-emerald-400" /></div>
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lucro Total Gerado</h3>
                                    </div>
                                    <p className="text-4xl font-black text-white italic tracking-tighter">
                                      +{formatMT(lucroTotal)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                       <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Calculado via Algoritmo Gogoma</span>
                                       <div className="w-1 h-1 rounded-full bg-slate-700" />
                                       <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">Ver Flash <ChevronRight className="w-3 h-3"/></span>
                                    </div>
                                 </div>
                                 <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20"><Zap className="w-6 h-6 text-emerald-400 animate-pulse"/></div>
                              </div>
                           </button>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-900/40 rounded-3xl p-5 border border-white/5">
                                 <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Dinheiro na Mão</p>
                                 <p className="text-xl font-black text-white">{formatMT(memberDetails.emCaixa)}</p>
                              </div>
                              <div className="bg-slate-900/40 rounded-3xl p-5 border border-white/5">
                                 <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Dinheiro na Rua</p>
                                 <p className="text-xl font-black text-blue-500">{formatMT(memberDetails.totalEmCirculacao)}</p>
                              </div>
                           </div>

                            {/* CANAIS OFICIAIS DE PAGAMENTO (REATIVO) */}
                            {(dbStore.dashboard.mpesa_number || dbStore.dashboard.emola_number || dbStore.dashboard.bank_account) && (
                              <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-white/5 space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-2">
                                  <CreditCard className="w-4 h-4 text-blue-500" />
                                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Canais Oficiais de Depósito</h4>
                                </div>
                                
                                <div className="space-y-3">
                                  {dbStore.dashboard.mpesa_number && (
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group/row">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                          <span className="text-[8px] font-black text-rose-500">M</span>
                                        </div>
                                        <div>
                                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">M-Pesa {dbStore.dashboard.mpesa_name && <span className="text-rose-500/50 ml-1">• {dbStore.dashboard.mpesa_name}</span>}</p>
                                          <p className="text-xs font-mono text-white font-bold">{dbStore.dashboard.mpesa_number}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(dbStore.dashboard.mpesa_number);
                                          toast({ title: "Copiado", description: "Número M-Pesa copiado para a área de transferência." });
                                        }}
                                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {dbStore.dashboard.emola_number && (
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group/row">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                          <span className="text-[8px] font-black text-orange-500">E</span>
                                        </div>
                                        <div>
                                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">E-Mola {dbStore.dashboard.emola_name && <span className="text-orange-500/50 ml-1">• {dbStore.dashboard.emola_name}</span>}</p>
                                          <p className="text-xs font-mono text-white font-bold">{dbStore.dashboard.emola_number}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(dbStore.dashboard.emola_number);
                                          toast({ title: "Copiado", description: "Número E-Mola copiado para a área de transferência." });
                                        }}
                                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {(dbStore.dashboard.bank_name || dbStore.dashboard.bank_number) && (
                                    <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 group/row">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                          <Building2 className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter leading-none mb-1">{dbStore.dashboard.bank_name || "Conta Bancária"}</p>
                                          <p className="text-[11px] font-mono text-white font-bold max-w-[180px] break-all leading-tight mb-1">{dbStore.dashboard.bank_number || "A definir..."}</p>
                                          {dbStore.dashboard.bank_titular && <p className="text-[9px] text-slate-500 font-bold uppercase">{dbStore.dashboard.bank_titular}</p>}
                                        </div>
                                      </div>
                                      {dbStore.dashboard.bank_number && (
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(dbStore.dashboard.bank_number);
                                            toast({ title: "Copiado", description: "Dados bancários copiados com sucesso." });
                                          }}
                                          className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all shadow-lg active:scale-95"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center italic">Sincronizado com a Central de Controlo</p>
                              </div>
                            )}

                           {/* APOIO AO CLIENTE (SUPORTE TÉCNICO) */}
                           {dbStore.dashboard.support_phone && (
                              <a 
                               href={`https://wa.me/${dbStore.dashboard.support_phone.replace(/\D/g, "")}`} 
                               target="_blank"
                               className="block bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10 hover:bg-indigo-500/10 transition-all group overflow-hidden relative"
                              >
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Phone className="w-16 h-16 text-indigo-400" />
                                 </div>
                                 <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
                                       <Phone className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Apoio ao Cliente</p>
                                       <h4 className="text-sm font-bold text-white italic">{dbStore.dashboard.support_phone}</h4>
                                       <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter mt-1 italic">Clique para falar com a Administração Agora</p>
                                    </div>
                                 </div>
                              </a>
                           )}
                        </div>
                     );
                  })()}

                {/* ── ECOSSISTEMA GLOBAL DO FUNDO (TRANSPARÊNCIA) ── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <div className="flex flex-col">
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Sede do Capital Geral</h3>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Controlo Master do Ecossistema</p>
                       </div>
                       <div className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/20">SIS MASTER ONLINE</div>
                    </div>

                    {/* PATRIMÓNIO GLOBAL (MAIN) */}
                    <div className="bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
                       <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Building2 className="w-32 h-32 text-white"/></div>
                       <div className="relative z-10">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 block">Património Global do Fundo</span>
                          <div className="text-4xl font-black text-white tracking-tighter italic mb-4">
                            {formatMT(globalStats?.patrimonyGlobal || 0)}
                          </div>
                          <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                             <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Sistema Master Operacional ({globalStats?.membros_ativos || 0} Cofres)</span>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {/* DINHEIRO EM CAIXA */}
                       <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Wallet className="w-6 h-6 text-emerald-400" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Dinheiro em Caixa</p>
                                   <p className="text-xl font-black text-white">{formatMT(globalStats?.caixa || 0)}</p>
                                   <p className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-widest">Reserva Imediata</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Status</p>
                                <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">Alta Liquidez</div>
                             </div>
                          </div>
                       </div>

                       {/* CAPITAL NA ESTRADA */}
                       <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><TrendingUp className="w-6 h-6 text-blue-400" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Capital na Estrada</p>
                                   <p className="text-xl font-black text-white">{formatMT(globalStats?.naRua || 0)}</p>
                                   <p className="text-[8px] text-blue-500/60 font-bold uppercase tracking-widest">
                                      {globalStats?.contagemContratos || 0} Contratos (Em Operação)
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Carga</p>
                                <div className="bg-blue-500/20 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">Em Renda</div>
                             </div>
                          </div>
                       </div>

                       {/* LUCRO GLOBAL */}
                       <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Star className="w-6 h-6 text-amber-400" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Lucro Global (Fundos)</p>
                                   <p className="text-xl font-black text-amber-400">{formatMT(globalStats?.lucros || 0)}</p>
                                   <p className="text-[8px] text-amber-500/60 font-bold uppercase tracking-widest">+ Taxas Consolidadas</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Fundo</p>
                                <div className="bg-amber-500/20 text-amber-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">Histórico</div>
                             </div>
                          </div>
                       </div>
                    </div>
                    <p className="text-[8px] text-center text-slate-600 font-black uppercase tracking-[0.3em] italic py-4">Actualizado em Tempo Real via Algoritmo Gogoma</p>
                 </div>
              </motion.div>
            )}

            {/* ── CARTEIRA (ASSETS) ── */}
            {activeTab === "assets" && (
              <motion.div key="assets" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="flex justify-between items-end px-2">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Central de Gestão do Cofre</span>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Meus Ganhos</h1>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Lucro Realizado</p>
                      <p className="text-lg font-display font-bold text-emerald-500">{formatMT(memberUser.lucro_acumulado || 0)}</p>
                   </div>
                </div>
                
                {/* Ativos Rendendo */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-800/30 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24 text-blue-500" /></div>
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><Activity className="w-5 h-5 text-blue-400"/></div>
                        <div><p className="text-sm font-semibold text-white">Capital Ativo</p><p className="text-[10px] text-slate-400 uppercase">Investido no mercado</p></div>
                     </div>
                     <div className="text-4xl font-display font-medium text-white mb-2">{formatMT(memberDetails.totalEmCirculacao)}</div>
                     <div className="mt-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: memberDetails.patrimonioTotal > 0 ? `${(memberDetails.totalEmCirculacao / memberDetails.patrimonioTotal) * 100}%` : "0%" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                     </div>
                     <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Exposição</span>
                        <span>{memberDetails.patrimonioTotal > 0 ? ((memberDetails.totalEmCirculacao / memberDetails.patrimonioTotal) * 100).toFixed(1) : 0}% do património</span>
                     </div>
                  </div>

                  {/* Lucros Estimados (80/20 Aplicado) */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-[2rem] p-6 border border-emerald-500/20 relative overflow-hidden group">
                     <div className="absolute right-0 bottom-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldCheck className="w-20 h-20 text-emerald-500" /></div>
                     <div className="flex items-center justify-between mb-2">
                   <h3 className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Resumo do Dinheiro</h3>
                   <div className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Sua Parte (80%)</div>
                </div>
                     <div className="text-4xl font-display font-medium text-white">+{formatMT(memberDetails.totalJuroEsperado)}</div>
                     <p className="text-xs text-slate-400 mt-2">Ganhos líquidos estimados ao fim dos ciclos vigentes.</p>
                  </div>
                </div>

                {/* Ativos em Operação (Lista Detalhada) */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Dinheiro que está Render</h3>
                    <button className="text-[8px] font-black text-emerald-400 uppercase tracking-widest hover:underline">Ver Todos</button>
                  </div>
                   
                   <div className="space-y-3">
                      {(memberDetails.emCirculacao || []).filter((c: any) => c.status !== "Liquidado").map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-800/30 rounded-2xl p-4 border border-white/5 space-y-3">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full border border-blue-500/20 p-0.5">
                                    {item.tomador_foto ? <img src={item.tomador_foto} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center"><UserIcon className="w-4 h-4 text-slate-400"/></div>}
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-white leading-none mb-1">{item.tomador_nome}</p>
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Tomador (ID: {item.loan_id.slice(1,7)})</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-bold text-white leading-none mb-1">{formatMT(item.valor_contribuido)}</p>
                                 <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">{item.pctDoEmprestimo.toFixed(1)}% do Bolo</p>
                              </div>
                           </div>
                           <div className="flex justify-between items-center pt-3 border-t border-white/5">
                              <div className="flex gap-4">
                                 <div>
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Taxa Fixa</p>
                                    <p className="text-xs font-mono text-slate-300">{item.taxa_atual}%</p>
                                 </div>
                                 <div>
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Expectativa</p>
                                    <p className="text-xs font-mono text-emerald-400">+{formatMT(item.juro_esperado)}</p>
                                 </div>
                              </div>
                              <div className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-1 rounded uppercase tracking-[0.1em]">
                                 Em Trânsito
                              </div>
                           </div>
                        </div>
                      ))}

                      {(!memberDetails.emCirculacao || memberDetails.emCirculacao.filter((c: any) => c.status !== "Liquidado").length === 0) && (
                         <div className="text-center py-12 bg-slate-800/10 rounded-3xl border border-dashed border-white/5 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                               <Shield className="w-6 h-6 text-slate-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">Nenhum capital alocado no momento</p>
                            <p className="text-[10px] text-white/40 font-bold leading-relaxed uppercase">
                          O seu dinheiro vai render quando houver pedidos de crédito. 
                          <br/>O Patrão do cofre avisa você.
                        </p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Histórico Recente de Aportes */}
                <div className="mt-8">
                   <h3 className="text-sm font-semibold text-white mb-4 px-2">Histórico de Aportes</h3>
                   <div className="space-y-3">
                     {dbStore.depositRequests.filter(r => r.user_id === memberUser.id).slice(0, 3).map(r => (
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
                             <div className="text-2xl font-display font-medium text-white">{formatMT(l.statusCalc.totalDevido)}</div>
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

                 <div className="mt-8 border-t border-white/5 pt-8">
                    <NotificationHub />
                 </div>
               </motion.div>
            )}

            {activeTab === "rank" && (
              <motion.div
                key="rank"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pb-24 pt-4"
              >
                <div className="mb-6 flex justify-between items-end">
                   <div>
                      <SectionLabel>Comunidade Elite</SectionLabel>
                      <h2 className="text-2xl font-black text-white italic tracking-tighter">Ranking de Confiança</h2>
                   </div>
                   <Trophy className="w-8 h-8 text-amber-500 opacity-20" />
                </div>

                <div className="space-y-4">
                   {/* Pódio Dinâmico (Top 3) */}
                   <div className="grid grid-cols-3 gap-2 items-end mb-8 pt-4">
                      {(() => {
                        const top3 = Object.values(dbStore.userDetails || {})
                          .map((ud: any) => {
                            const dLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status !== "Liquidado" && (calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0).fase !== 1));
                            const pLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status === "Liquidado").length;
                            let s = 800;
                            s -= dLoans.length * 150;
                            s += pLoans * 20;
                            s += Math.min(100, (ud.emCaixa / 10000) * 10);
                            return { ...ud, score: s };
                          })
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 3);

                        return [
                          { pos: 2, user: top3[1], color: "bg-slate-400", label: "Prata" },
                          { pos: 1, user: top3[0], color: "bg-amber-500", label: "Ouro" },
                          { pos: 3, user: top3[2], color: "bg-amber-700", label: "Bronze" }
                        ].map((p, idx) => (
                          <div key={idx} className={cn("flex flex-col items-center", p.pos === 1 ? "order-2" : p.pos === 2 ? "order-1" : "order-3")}>
                             <div className="mb-2 relative">
                                <div className={cn("w-14 h-14 rounded-full border-2 p-1 overflow-hidden", p.pos === 1 ? "border-amber-500" : p.pos === 2 ? "border-slate-400" : "border-amber-700")}>
                                   {p.user?.user.foto ? (
                                     <img src={p.user.user.foto} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                                   ) : (
                                     <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-[10px] text-slate-500">?</div>
                                   )}
                                </div>
                                <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-[#090D14]", p.color)}>
                                   {p.pos}º
                                </div>
                             </div>
                             <div className="text-center px-1">
                                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate w-20 leading-none mb-1">{p.user?.user.nome.split(' ')[0] || "Vago"}</p>
                                <p className={cn("text-[9px] font-mono font-bold", p.pos === 1 ? "text-amber-500" : "text-slate-400")}>{p.user ? `${p.user.score.toFixed(0)} pts` : "---"}</p>
                             </div>
                             <div className={cn("w-full mt-3 rounded-t-xl opacity-20", p.pos === 1 ? "h-16 bg-amber-500" : p.pos === 2 ? "h-10 bg-slate-400" : "h-6 bg-amber-700")} />
                          </div>
                        ));
                      })()}
                   </div>

                   {/* Lista Completa (Membro Actual em Destaque) */}
                   <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden">
                      {Object.values(dbStore.userDetails || {})
                        .map((ud: any) => {
                          const delayedLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status !== "Liquidado" && (calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0).fase !== 1));
                          const paidLoans = (dbStore.loans || []).filter(l => l.user_id === ud.user.id && l.status === "Liquidado").length;
                          let score = 800;
                          score -= delayedLoans.length * 150;
                          score += paidLoans * 20;
                          score += Math.min(100, (ud.emCaixa / 10000) * 10);
                          return { ...ud, score };
                        })
                        .sort((a, b) => b.score - a.score)
                        .map((user, i) => (
                          <div key={user.user.id} className={cn("flex items-center justify-between p-4 border-b border-white/5 last:border-0 transition-colors", user.user.id === memberUser.id ? "bg-blue-500/10" : "hover:bg-white/[0.02]")}>
                             <div className="flex items-center gap-3">
                                <span className={cn("text-xs font-black w-5", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-slate-600")}>{i + 1}º</span>
                                <div className="text-sm font-bold text-slate-200">
                                  {user.user.nome} {user.user.id === memberUser.id && <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full ml-2 uppercase">Tu</span>}
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-xs font-mono font-bold text-blue-400">{user.score.toFixed(0)} pts</span>
                                <div className="h-1 w-12 bg-slate-800 rounded-full mt-1 overflow-hidden drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]">
                                   <div className="h-full bg-blue-500" style={{ width: `${(user.score / 1000) * 100}%` }} />
                                </div>
                             </div>
                          </div>
                        ))}
                   </div>
                   <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6 bg-white/5 py-2 rounded-full">Actualizado em Tempo Real via Algoritmo Gogoma</p>
                </div>
              </motion.div>
            )}

            {activeTab === "simulator" && (
              <motion.div
                key="simulator"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pb-24 pt-4"
              >
                <div className="mb-8">
                   <SectionLabel>Simulador de Micro-Crédito</SectionLabel>
                   <h2 className="text-2xl font-black text-white italic tracking-tighter">Planeie o seu Futuro</h2>
                </div>

                <div className="bg-slate-800/30 rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden backdrop-blur-xl">
                   <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                   
                   <div className="space-y-8 relative z-10">
                      <div>
                         <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Valor do Empréstimo</label>
                            <span className="text-xl font-display font-medium text-white">{formatMT(simAmount)}</span>
                         </div>
                         <input 
                            type="range" 
                            min="1000" 
                            max="50000" 
                            step="1000"
                            value={simAmount}
                            onChange={(e) => setSimAmount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                         />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                         {[
                           { label: "1 Mês", juro: 0.10, d: "10%" },
                           { label: "2 Meses", juro: 0.20, d: "20%" },
                           { label: "3 Meses", juro: 0.50, d: "50%" }
                         ].map((opt, i) => (
                           <div key={i} className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                              <span className="text-[10px] font-bold text-slate-500 mb-1">{opt.label}</span>
                              <span className="text-lg font-black text-white">{opt.d}</span>
                              <span className="text-[9px] text-blue-400 font-bold mt-2">+{formatMT(simAmount * opt.juro)}</span>
                           </div>
                         ))}
                      </div>

                      <div className="pt-8 border-t border-white/5">
                         <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retorno Estimado (3 Meses)</span>
                            <span className="text-3xl font-display font-medium text-emerald-400">{formatMT(simAmount * 1.5)}</span>
                         </div>
                         <p className="text-[9px] text-slate-600 font-medium">Cálculo baseado na taxa progressiva de 10%, 20% e 50% conforme o Cofre Capital.</p>
                      </div>

                      <button 
                        onClick={() => { setLoanAmount((simAmount/100).toString()); setIsLoanOpen(true); }}
                        className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-all shadow-xl"
                      >
                         Solicitar Este Valor
                      </button>
                   </div>
                </div>

                <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                   <div className="flex items-center gap-3 mb-3">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">Aviso de Responsabilidade</span>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Os valores apresentados são simulações. A aprovação final depende do seu Ranking de Confiança e da liquidez disponível no ecossistema.</p>
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
               <NavButton id="rank" label="Rank" icon={Trophy} active={activeTab} set={setActiveTab} />
               <NavButton id="loans" label="Crédito" icon={CreditCard} active={activeTab} set={setActiveTab} />
               <NavButton id="simulator" label="Simular" icon={Calculator} active={activeTab} set={setActiveTab} />
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
                <div className="mb-6 space-y-4">
                  {depositPhoto ? (
                    <div className="relative group">
                      <div className="w-full h-40 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-lg">
                        <img src={depositPhoto} className="w-full h-full object-cover" alt="Comprovativo" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setDepositPhoto(null)}
                        className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-rose-500 transition-colors backdrop-blur-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Comprovativo Digitalizado
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group active:bg-white/10 transition-all shadow-inner"
                    >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                              <Scan className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="text-left">
                              <p className="text-sm font-bold text-white leading-none mb-1">Digitalizar Comprovante</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] leading-none">Auto-preencher via IA</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-6">
                   <div>
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3 pl-1">Valor a Investir (MZN)</label>
                       <input 
                         required 
                         value={depositAmount} 
                         onChange={e => setDepositAmount(e.target.value)} 
                         className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-5 text-white text-3xl text-center focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-display font-bold shadow-inner" 
                         placeholder="0.00" 
                         type="number" 
                         step="0.01" 
                       />
                   </div>
                   <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Taxa fixa de 30 MZN aplicável.</p>
                   </div>
                   <button 
                     disabled={createDepositMut.isPending} 
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-900/20 flex justify-center items-center gap-3 active:scale-[0.98] uppercase tracking-widest text-sm"
                   >
                      {createDepositMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Depósito"}
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
                      <span className="font-medium text-white">{formatMT(selectedLoan.valor_original)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <span className="text-amber-400/80">Juros Acumulados</span>
                      <span className="font-medium text-amber-400">+{formatMT(selectedLoan.statusCalc.juro + (selectedLoan.statusCalc.multaAtraso || 0))}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <span className="text-emerald-400 font-medium">Total para Liquidação</span>
                      <span className="text-xl font-bold text-emerald-400">{formatMT(selectedLoan.statusCalc.totalDevido)}</span>
                    </div>
                 </div>
 
                 <div className="mb-8">
                    {(() => {
                       const juroTotal = selectedLoan.statusCalc.juro + (selectedLoan.statusCalc.multaAtraso || 0);
                       return (
                         <>
                           <h4 className="text-sm font-medium text-slate-300 mb-3 px-1">Distribuição de Lucro:</h4>
                           <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-slate-800/50 p-3 rounded-xl border-l-2 border-blue-500">
                                 <span className="text-[10px] text-slate-400 block mb-1">Investidores (80%)</span>
                                 <span className="font-medium text-blue-400 font-display">{formatMT(juroTotal * 0.8)}</span>
                              </div>
                              <div className="bg-slate-800/50 p-3 rounded-xl border-l-2 border-emerald-500">
                                 <span className="text-[10px] text-slate-400 block mb-1">Cashback Membro (20%)</span>
                                 <span className="font-medium text-emerald-400 font-display">{formatMT(juroTotal * 0.2)}</span>
                              </div>
                           </div>
                         </>
                       );
                    })()}
                 </div>

                 <div className="space-y-4 pt-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Quanto deseja pagar? (MTn)</label>
                      <div className="relative flex items-center">
                        <input 
                          type="number"
                          value={liquidationAmount}
                          onChange={(e) => setLiquidationAmount(e.target.value)}
                          placeholder={(selectedLoan.statusCalc.totalDevido / 100).toString()}
                          className={cn(
                            "w-full bg-transparent text-2xl font-bold outline-none transition-colors",
                            parseFloat(liquidationAmount) * 100 > selectedLoan.statusCalc.totalDevido + 10 ? "text-rose-500" : "text-white"
                          )}
                        />
                        <button 
                          type="button"
                          onClick={() => setLiquidationAmount((selectedLoan.statusCalc.totalDevido / 100).toString())}
                          className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 whitespace-nowrap active:scale-95 transition-all"
                        >
                          Máximo
                        </button>
                      </div>
                      {parseFloat(liquidationAmount) * 100 > selectedLoan.statusCalc.totalDevido + 10 && (
                        <p className="text-[10px] text-rose-500 font-bold uppercase mt-2 animate-pulse">⚠️ O valor excede a dívida total ({formatMT(selectedLoan.statusCalc.totalDevido)})</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Comprovativo de Pagamento</label>
                      {liquidationPhoto ? (
                        <div className="relative group">
                          <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-blue-500/30">
                            <img src={liquidationPhoto} className="w-full h-full object-cover" alt="Recibo" />
                          </div>
                          <button 
                            onClick={() => setLiquidationPhoto(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-rose-500 transition-colors backdrop-blur-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsLiqScannerOpen(true)}
                          className="w-full py-6 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 group active:scale-[0.98] transition-all"
                        >
                           <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                              <Camera className="w-5 h-5 text-blue-400" />
                           </div>
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Capturar Recibo</span>
                        </button>
                      )}
                    </div>

                    <SlideToConfirm 
                      label="Deslize para Confirmar"
                      successLabel="Pagamento Enviado!"
                      onConfirm={() => handleLiquidationRequest(selectedLoan.id, liquidationAmount ? parseFloat(liquidationAmount) * 100 : selectedLoan.statusCalc.totalDevido)}
                    />
                 </div>
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
                   
                   {/* Alterar Foto */}
                   <div className={cn("relative w-full overflow-hidden bg-black border-2 transition-all duration-500", 
                     isCapturingProfile ? "h-48 rounded-2xl border-blue-500/50 mb-4" : "h-0 rounded-0 border-transparent mb-0")}>
                     <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 z-10" />
                     {cameraStatus === "requesting" && (
                       <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center p-4">
                         <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                       </div>
                     )}
                     {cameraStatus === "active" && (
                       <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                         <div className="w-24 h-32 border-2 border-dashed border-blue-500/40 rounded-[2rem] animate-pulse"></div>
                       </div>
                     )}
                     <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-4">
                       <button type="button" onClick={stopCamera} className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors backdrop-blur-md">
                         <X className="w-5 h-5" />
                       </button>
                       <button type="button" onClick={takePhoto} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
                         <Camera className="w-5 h-5" />
                       </button>
                       <button type="button" onClick={toggleCamera} className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-blue-500 transition-colors backdrop-blur-md">
                         <Sparkles className={cn("w-5 h-5 transition-transform duration-500", facingMode === "user" ? "rotate-180" : "rotate-0")} />
                       </button>
                     </div>
                   </div>

                    {!isCapturingProfile && (
                      <div className="flex items-center gap-6 bg-slate-900/60 p-6 rounded-3xl border border-white/5 shadow-inner mb-6">
                        <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-slate-700 bg-slate-950 flex-shrink-0 group shadow-2xl">
                           {newPhoto ? (
                             <img src={newPhoto} className="w-full h-full object-cover" alt="Nova Foto" />
                           ) : memberUser.foto?.startsWith('data:image') || memberUser.foto?.startsWith('http') ? (
                             <img src={memberUser.foto} className="w-full h-full object-cover" alt="Foto Atual" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-blue-500/10 text-blue-500">{memberUser.nome[0].toUpperCase()}</div>
                           )}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                           </div>
                        </div>
                        <div className="flex-1 space-y-3">
                           <div>
                             <p className="text-sm font-black text-white uppercase italic tracking-tighter leading-none mb-1">Identidade Visual</p>
                             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-tight">Escolha entre Captura Biométrica ou Arquivo Digital.</p>
                           </div>
                           <div className="flex gap-2">
                             <button type="button" onClick={startCamera} className="flex-1 h-10 text-[9px] font-black bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95">
                               <Camera className="w-3.5 h-3.5" /> Câmara
                             </button>
                             <div className="relative flex-1">
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-10 text-[9px] font-black bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest text-center shadow-lg active:scale-95">
                                  Galeria
                               </button>
                               <input 
                                 ref={fileInputRef}
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden"
                                 onChange={handlePhotoUpload}
                               />
                             </div>
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Identificador Fiscal (Email)</label>
                        <input 
                          type="email"
                          value={profileForm.email} 
                          onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                          className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs transition-all shadow-inner" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Telefone Principal (9 Dígitos)</label>
                        <div className="relative">
                          <input 
                            inputMode="numeric"
                            maxLength={9}
                            value={profileForm.telefone} 
                            onChange={e => setProfileForm({...profileForm, telefone: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs font-mono transition-all shadow-inner" 
                            placeholder="8x 000 0000"
                          />
                          {profileForm.telefone.length === 9 && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Estrutura Profissional</label>
                        <input 
                          value={profileForm.profissao} 
                          onChange={e => setProfileForm({...profileForm, profissao: e.target.value})} 
                          className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs transition-all shadow-inner" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">NUIT Tax ID (9 Dígitos)</label>
                        <div className="relative">
                          <input 
                            inputMode="numeric"
                            maxLength={9}
                            value={profileForm.nuit} 
                            onChange={e => setProfileForm({...profileForm, nuit: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs font-mono transition-all shadow-inner" 
                            placeholder="123 456 789"
                          />
                          {profileForm.nuit.length === 9 && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Identidade (B.I.)</label>
                        <input value={profileForm.bi} onChange={e => setProfileForm({...profileForm, bi: e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 13)})} placeholder="Ex: 000000000000A" className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs shadow-inner transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Bairro de Residência</label>
                        <input value={profileForm.bairro} onChange={e => setProfileForm({...profileForm, bairro: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs shadow-inner transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Zona / Quarteirão / Detalhes</label>
                      <input value={profileForm.zona} onChange={e => setProfileForm({...profileForm, zona: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none text-xs shadow-inner transition-all" />
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
                             <input 
                                inputMode="numeric"
                                value={profileForm.conjuge_numero} 
                                onChange={e => setProfileForm({...profileForm, conjuge_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs font-mono" 
                                placeholder="8x 000 0000"
                              />
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
                             <input 
                                inputMode="numeric"
                                value={profileForm.irmao_numero} 
                                onChange={e => setProfileForm({...profileForm, irmao_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs font-mono" 
                                placeholder="8x 000 0000"
                              />
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
                             <input 
                                inputMode="numeric"
                                value={profileForm.parente_numero} 
                                onChange={e => setProfileForm({...profileForm, parente_numero: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs font-mono" 
                                placeholder="8x 000 0000"
                              />
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

        {/* ── SCANNER DE ÚLTIMA GERAÇÃO ── */}
        <AnimatePresence>
          {isScannerOpen && (
            <ReceiptScanner 
              onClose={() => setIsScannerOpen(false)}
              onScanResult={(data) => {
                setDepositAmount(data.valor.toString());
                if (data.foto) setDepositPhoto(data.foto);
                setIsScannerOpen(false);
              }}
            />
          )}
          {isLiqScannerOpen && (
            <ReceiptScanner 
              onClose={() => setIsLiqScannerOpen(false)}
              onScanResult={(data) => {
                if (data.foto) setLiquidationPhoto(data.foto);
                setIsLiqScannerOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* ── MODAL DE LUCRO DETALHADO (ELITE FLASH) ── */}
        <AnimatePresence>
          {isProfitModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfitModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-[#090D14] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-1.5 flex justify-center"><div className="w-12 h-1 bg-white/10 rounded-full" /></div>
                <div className="p-8 space-y-8 overflow-y-auto">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] italic">Relatório de Performance</h2>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">Lucro Total Gerado</p>
                      </div>
                      <button onClick={() => setIsProfitModalOpen(false)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                   </div>

                    {(() => {
                       const lucroRealizado = memberUser.lucro_acumulado || 0;

                       // Projeção como Investidor (80% do juro ou 100% se autofinanciado)
                       const projInvestidor = (memberDetails.emCirculacao || [])
                         .filter((c: any) => c.status !== "Liquidado")
                         .reduce((acc: number, c: any) => {
                           const realLoan = dbStore.loans.find(l => l.id === c.loan_id);
                           if (!realLoan) return acc;
                           const status = calcularStatusEmprestimo(realLoan.valor_original, realLoan.data_inicio, realLoan.valor_pago || 0);
                           const juroEfetivo = status.juro + (status.multaAtraso || 0);
                           const minhaFatiaJuro = juroEfetivo * (c.pctDoEmprestimo / 100);
                           
                           // Cashback: Se eu sou o tomador, fico com 100% do meu próprio juro. Caso contrário, 80%.
                           return acc + (c.tomador_id === memberUser.id ? minhaFatiaJuro : minhaFatiaJuro * 0.8);
                         }, 0);

                       // Projeção como Tomador (20% cashback dos empréstimos coletivos)
                       const projCashback = (dbStore.loans || [])
                         .filter(l => l.user_id === memberUser.id && l.status === "Ativo")
                         .reduce((acc, l) => {
                            const status = calcularStatusEmprestimo(l.valor_original, l.data_inicio, l.valor_pago || 0);
                            const juroEfetivo = status.juro + (status.multaAtraso || 0);
                            // Se eu contribuir para meu próprio empréstimo, esses 20% do meu capital foram contados acima.
                            // Aqui pegamos 20% do juro total que NÃO veio do meu bolso.
                            const minhaContrib = (memberDetails.emCirculacao || []).find(c => c.loan_id === l.id);
                            const pctTerceiros = 100 - (minhaContrib?.pctDoEmprestimo || 0);
                            const juroDeTerceiros = juroEfetivo * (pctTerceiros / 100);
                            return acc + (juroDeTerceiros * 0.2);
                         }, 0);

                       const lucroProjetado = Math.round(projInvestidor + projCashback);
                       const lucroTotal = lucroRealizado + lucroProjetado;

                      return (
                        <div className="space-y-6">
                           {/* BIG TOTAL */}
                           <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 rounded-[2rem] p-8 border border-emerald-500/20 relative overflow-hidden group">
                              <div className="absolute -right-8 -top-8 p-8 opacity-5"><TrendingUp className="w-32 h-32 text-emerald-400" /></div>
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 block">Saldo Acumulado de Ganhos</span>
                              <div className="text-5xl font-black text-white tracking-tighter italic mb-4">
                                +{formatMT(lucroTotal)}
                              </div>
                              <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Cálculo em Tempo Real (Algoritmo Gogoma)</span>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                              {/* REALIZADO */}
                              <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5">
                                 <div className="flex justify-between items-center mb-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lucro Realizado</p>
                                    <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">Consolidado</div>
                                 </div>
                                 <p className="text-2xl font-black text-white">{formatMT(lucroRealizado)}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic leading-none">Já no seu bolso (Auditado via Blockchain Local)</p>
                              </div>

                              {/* PROJEÇÃO */}
                              <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                 <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                 <div className="flex justify-between items-center mb-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lucro em Projeção</p>
                                    <div className="bg-blue-500/20 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded uppercase">Em Renda</div>
                                 </div>
                                 <p className="text-2xl font-black text-blue-400">{formatMT(lucroProjetado)}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic leading-none">Vínculo em contratos ativos ({myActiveLoans.length} operando)</p>
                              </div>
                           </div>

                           {/* INFORMATIONAL FLASH */}
                           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3">
                              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0"/>
                              <p className="text-[10px] text-emerald-200/60 font-medium leading-relaxed">
                                Este relatório reflecte o desempenho bruto dos seus activos. O lucro realizado já pode ser levantado ou reinvestido, enquanto a projecção amadurece conforme o calendário dos contratos.
                              </p>
                           </div>
                        </div>
                      );
                   })()}

                   <button onClick={() => setIsProfitModalOpen(false)} className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">Fechar Relatório</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
