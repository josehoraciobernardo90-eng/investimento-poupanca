import { useState, useRef } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest, useApproveMembershipRequest, useRejectMembershipRequest, useCreateDeletionRequest, useApproveProfileEditRequest, useRejectProfileEditRequest, useApproveLiquidationRequest, useRejectLiquidationRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Plus, Trash2, ShieldCheck, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AnyRequest = {
  id: string;
  user_id: string;
  user_nome: string;
  user_foto: string;
  valor: number;
  status: string;
  ts: number;
  motivo?: string;
  nacionalidade?: string;
  telefone?: string;
  nuit?: string;
  endereco?: string;
  profissao?: string;
};

export default function RequestsPage() {
  const { loans, deposits, liquidations, memberships, profileEdits, isLoading } = useRequests();
  const { data: users } = useUsers();
  const [tab, setTab] = useState<"memberships" | "loans" | "deposits" | "profileEdits" | "liquidations">("memberships");

  const approveLoanMut = useApproveLoanRequest();
  const rejectLoanMut = useRejectLoanRequest();
  const approveDepMut = useApproveDepositRequest();
  const rejectDepMut = useRejectDepositRequest();
  const approveMemMut = useApproveMembershipRequest();
  const rejectMemMut = useRejectMembershipRequest();
  const approveProfileMut = useApproveProfileEditRequest();
  const rejectProfileMut = useRejectProfileEditRequest();
  const approveLiqMut = useApproveLiquidationRequest();
  const rejectLiqMut = useRejectLiquidationRequest();

  const [createType, setCreateType] = useState<"loan" | "deposit" | null>(null);
  const createLoanMut = useCreateLoanRequest();
  const createDepMut = useCreateDepositRequest();
  const [userId, setUserId] = useState("");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  const createDelReqMut = useCreateDeletionRequest();
  const [confirmDelete, setConfirmDelete] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "liquidation" } | null>(null);

  const [confirmApprove, setConfirmApprove] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  const [confirmReject, setConfirmReject] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  
  const displayApprove = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  const displayReject = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  if (confirmApprove !== null) displayApprove.current = confirmApprove;
  if (confirmReject !== null) displayReject.current = confirmReject;

  if (isLoading) return <PageLoader />;

  const mappedMemberships = (memberships || []).map(m => ({
    id: m.id, user_id: m.id, user_nome: m.nome, user_foto: m.foto, valor: m.saldo_base, status: m.status, ts: m.ts,
    telefone: m.telefone, nuit: m.nuit, endereco: m.endereco, profissao: m.profissao
  }));
  const pendingMems = mappedMemberships.filter(r => r.status === "Pendente");
  const historyMems = mappedMemberships.filter(r => r.status !== "Pendente");

  const pendingLoans = loans.filter(r => r.status === "Pendente");
  const historyLoans = loans.filter(r => r.status !== "Pendente");
  const pendingDeps = deposits.filter(r => r.status === "Pendente");
  const historyDeps = deposits.filter(r => r.status !== "Pendente");

  const pendingProfileEdits = (profileEdits || []).filter(r => r.status === "Pendente");
  const historyProfileEdits = (profileEdits || []).filter(r => r.status !== "Pendente");

  const pendingLiqs = (liquidations || []).filter((r: any) => r.status === "Pendente");
  const historyLiqs = (liquidations || []).filter((r: any) => r.status !== "Pendente");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInputMoney(valor);
    if (!userId || val <= 0) return;
    try {
      if (createType === "loan") {
        await createLoanMut.mutateAsync({ data: { user_id: userId, valor: val, motivo } });
      } else {
        await createDepMut.mutateAsync({ data: { user_id: userId, valor: val } });
      }
      setTimeout(() => {
        setCreateType(null);
        setUserId(""); setValor(""); setMotivo("");
      }, 100);
    } catch {}
  };

  const handleConfirmApprove = async () => {
    if (!confirmApprove) return;
    try {
      const { type, req } = confirmApprove;
      if (type === "loan") await approveLoanMut.mutateAsync({ requestId: req.id });
      else if (type === "deposit") await approveDepMut.mutateAsync({ requestId: req.id });
      else if (type === "membership") await approveMemMut.mutateAsync({ requestId: req.id });
      else if (type === "profileEdit") await approveProfileMut.mutateAsync({ requestId: req.id });
      else if (type === "liquidation") await approveLiqMut.mutateAsync({ requestId: req.id });
      
      // Delay tático para evitar removeChild error
      setTimeout(() => setConfirmApprove(null), 100);
    } catch {}
  };

  const handleConfirmReject = async () => {
    if (!confirmReject) return;
    try {
      const { type, req } = confirmReject;
      if (type === "loan") await rejectLoanMut.mutateAsync({ requestId: req.id });
      else if (type === "deposit") await rejectDepMut.mutateAsync({ requestId: req.id });
      else if (type === "membership") await rejectMemMut.mutateAsync({ requestId: req.id });
      else if (type === "profileEdit") await rejectProfileMut.mutateAsync({ requestId: req.id });
      else if (type === "liquidation") await rejectLiqMut.mutateAsync({ requestId: req.id });
      
      setTimeout(() => setConfirmReject(null), 100);
    } catch {}
  };

  const isApproving = approveLoanMut.isPending || approveDepMut.isPending || approveMemMut.isPending || approveProfileMut.isPending;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Pedidos pendentes</h1>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Painel de Gestão Fiduciária • Central de Chimoio</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCreateType("deposit")} className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all">
            <Plus className="w-4 h-4" /> Novo Aporte
          </button>
          <button onClick={() => setCreateType("loan")} className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <ArrowUpFromLine className="w-4 h-4" /> Novo Empréstimo
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
        {[
          { id: "memberships", label: "Cadastros", count: pendingMems.length },
          { id: "loans", label: "Empréstimos", count: pendingLoans.length },
          { id: "deposits", label: "Aportes", count: pendingDeps.length },
          { id: "liquidations", label: "Liquidações", count: pendingLiqs.length },
          { id: "profileEdits", label: "Alterações", count: pendingProfileEdits.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              tab === t.id ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : tab === "liquidations" ? pendingLiqs : pendingDeps).map((req) => (
              <motion.div 
                key={`${tab}-${req.id}`} 
                layout
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-warning bg-white/5 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-20 h-20 text-warning" />
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-white text-sm shadow-lg">
                      {req.user_foto}
                    </div>
                    <div>
                      <h4 className="font-black text-white italic text-lg uppercase tracking-tight">{req.user_nome}</h4>
                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{formatDateTime(req.ts)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {tab !== "profileEdits" ? (
                      <span className={cn("block font-black text-2xl italic tracking-tighter", tab === "liquidations" ? "text-success" : "text-white")}>{formatMT(req.valor)}</span>
                    ) : (
                      <span className="block font-black text-[10px] text-primary uppercase tracking-[0.2em]">Pendente</span>
                    )}
                  </div>
                </div>

                {tab === "loans" && (req as any).motivo && (
                  <div className="mb-6 p-4 bg-black/40 rounded-2xl text-[10px] text-white/60 font-medium leading-relaxed border border-white/5 uppercase">
                    <span className="text-warning block mb-1 font-black underline underline-offset-4">Motivo Requisitado:</span>
                    {(req as any).motivo}
                  </div>
                )}

                {tab === "liquidations" && (
                  <div className="mb-6 p-4 bg-success/5 border border-success/20 rounded-2xl text-[10px] text-white/60 font-medium leading-relaxed uppercase">
                    <span className="text-success block mb-1 font-black">Confirmação de Pagamento:</span>
                    O membro afirma ter entregue o valor total da dívida acumulada. Verifique o caixa antes de aprovar.
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setConfirmApprove({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                    disabled={isApproving}
                    className="flex-1 bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4 inline mr-2" /> Aprovar
                  </button>
                  <button
                    onClick={() => setConfirmReject({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                    disabled={isApproving}
                    className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <X className="w-4 h-4 inline mr-2" /> Rejeitar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : tab === "liquidations" ? pendingLiqs : pendingDeps).length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">Nenhum Pedido Requerendo Atenção Imediata</p>
            </div>
          )}
        </div>
      </div>

      {/* HISTÓRICO ELITE */}
      {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : historyDeps).length > 0 && (
        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Histórico de Movimentações</h2>
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-6 text-[8px] font-black text-white/40 uppercase tracking-widest">Membro / Titular</th>
                    {tab !== "profileEdits" && <th className="p-6 text-[8px] font-black text-white/40 uppercase tracking-widest">Capital</th>}
                    <th className="p-6 text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Protocolo</th>
                    <th className="p-6 text-[8px] font-black text-white/40 uppercase tracking-widest text-right">Acção Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : tab === "profileEdits" ? historyProfileEdits : historyDeps).map((req) => (
                    <tr key={`history-${req.id}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-black text-white text-[10px]">
                            {req.user_foto}
                          </div>
                          <div>
                            <div className="font-bold text-white uppercase italic text-xs tracking-tight">{req.user_nome}</div>
                            <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mt-0.5">{formatDateTime(req.ts)}</div>
                          </div>
                        </div>
                      </td>
                      {tab !== "profileEdits" && <td className="p-6 font-black text-white italic">{formatMT(req.valor)}</td>}
                      <td className="p-6 flex justify-center"><StatusBadge status={req.status} /></td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setConfirmDelete({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : "deposit" })}
                          className="p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* JANELAS DE CONFIRMAÇÃO (REFORÇADAS) */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent className="glass-panel border-white/20 rounded-[3rem] max-w-md p-10 shadow-[0_0_100px_rgba(34,197,94,0.1)]">
          <AlertDialogHeader>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-success/20 rounded-2xl flex items-center justify-center text-success border border-success/20 rotate-3 shadow-xl"><Check className="w-8 h-8" /></div>
                <div><AlertDialogTitle className="text-3xl font-black text-white italic uppercase tracking-tighter">Confirmar</AlertDialogTitle><p className="text-[9px] text-success font-black uppercase tracking-[0.3em]">Adesão Fiscal Verificada</p></div>
             </div>
             <AlertDialogDescription className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">Você está prestes a validar este pedido no sistema principal de capitais. Esta acção gera lucro imediato para os investidores.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 my-8 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-black text-white text-[10px]">{displayApprove.current?.req?.user_foto}</div>
                <p className="text-xs font-black text-white uppercase italic">{displayApprove.current?.req?.user_nome}</p>
             </div>
             <p className="text-xl font-black text-primary italic tracking-tighter">{formatMT(displayApprove.current?.req?.valor || 0)}</p>
          </div>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-white/40 flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmApprove(); }} className="bg-white text-black rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest flex-1 shadow-lg active:scale-95">Efetuar Aprovação</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent className="glass-panel border-white/20 rounded-[3rem] max-w-md p-10 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <AlertDialogHeader>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-destructive/20 rounded-2xl flex items-center justify-center text-destructive border border-destructive/20 -rotate-3 shadow-xl"><X className="w-8 h-8" /></div>
                <div><AlertDialogTitle className="text-3xl font-black text-white italic uppercase tracking-tighter">Rejeitar</AlertDialogTitle><p className="text-[9px] text-destructive font-black uppercase tracking-[0.3em]">Cancelamento Automático</p></div>
             </div>
             <AlertDialogDescription className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">Ao rejeitar, o pedido será movido para o histórico de falhas e o membro não receberá os fundos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-8">
            <AlertDialogCancel className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-white/40 flex-1">Manter Pedido</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmReject(); }} className="bg-destructive text-white rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest flex-1 shadow-lg active:scale-95">Confirmar Rejeição</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!createType} onOpenChange={(open) => !open && setCreateType(null)}>
        <DialogContent className="glass-panel border-white/20 rounded-[3rem] max-w-md p-10 shadow-2xl overflow-hidden">
          <DialogHeader><DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Novo Registo Fiscal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div><label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Membro Titular</label><select required value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all appearance-none"><option value="" className="bg-black">Seleccionar Membro...</option>{users?.filter(u => u.status === 'Ativo').map(u => (<option key={u.id} value={u.id} className="bg-black">{u.nome}</option>))}</select></div>
            <div><label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Valor Unitário (MT)</label><input required value={valor} onChange={e => setValor(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-white focus:outline-none focus:border-primary text-center italic tracking-tighter" placeholder="0.00" /></div>
            {createType === "loan" && (<div><label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Justificativa de Crédito</label><textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary min-h-[100px] resize-none" placeholder="Ex: Investimento em gado" /></div>)}
            <button disabled={createLoanMut.isPending || createDepMut.isPending} className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">{(createLoanMut.isPending || createDepMut.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar Lançamento</>}</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
