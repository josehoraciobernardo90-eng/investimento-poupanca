import React, { useState, useRef } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest, useApproveMembershipRequest, useRejectMembershipRequest, useCreateDeletionRequest, useApproveProfileEditRequest, useRejectProfileEditRequest, useApproveLiquidationRequest, useRejectLiquidationRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney, cn } from "@/lib/utils";
import { Link } from "wouter";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Trash2, ShieldCheck, User, Receipt } from "lucide-react";
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
  const [tab, setTab] = useState<"memberships" | "loans" | "deposits" | "profileEdits" | "liquidations" | "vault">("memberships");

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
  const [indicadorId, setIndicadorId] = useState("");

  const createDelReqMut = useCreateDeletionRequest();
  const [confirmDelete, setConfirmDelete] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "liquidation" } | null>(null);

  const [confirmApprove, setConfirmApprove] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  const [confirmReject, setConfirmReject] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  
  const displayApprove = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  const displayReject = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" | "liquidation" } | null>(null);
  if (confirmApprove !== null) displayApprove.current = confirmApprove;
  if (confirmReject !== null) displayReject.current = confirmReject;

  const [photoPreview, setPhotoPreview] = useState<{ url: string, name: string } | null>(null);

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

  const handleConfirmApprove = async () => {
    if (!confirmApprove) return;
    try {
      const { type, req } = confirmApprove;
      if (type === "loan") await approveLoanMut.mutateAsync({ requestId: req.id });
      else if (type === "deposit") await approveDepMut.mutateAsync({ requestId: req.id });
      else if (type === "membership") await approveMemMut.mutateAsync({ requestId: req.id });
      else if (type === "profileEdit") await approveProfileMut.mutateAsync({ requestId: req.id });
      else if (type === "liquidation") await approveLiqMut.mutateAsync({ requestId: req.id });
      
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

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { type, req } = confirmDelete;
      await createDelReqMut.mutateAsync({
        targetId: req.id,
        targetType: type as any,
        userId: req.user_id,
        userNome: req.user_nome,
        details: { valor: req.valor }
      });
      setTimeout(() => setConfirmDelete(null), 100);
    } catch {}
  };

  const isApproving = approveLoanMut.isPending || approveDepMut.isPending || approveMemMut.isPending || approveProfileMut.isPending;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/60">Gestão das Contas · Auditoria Fiscal</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Administração do Cofre</h1>
          <p className="text-sm mt-1 text-white/30">Validação de movimentações e arquivo de provas documentais.</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit bg-white/5 border border-white/5 overflow-x-auto max-w-full no-scrollbar">
        {[
          { id: "memberships", label: "Cadastros", count: pendingMems.length },
          { id: "loans", label: "Empréstimos", count: pendingLoans.length },
          { id: "deposits", label: "Aportes", count: pendingDeps.length },
          { id: "liquidations", label: "Liquidações", count: pendingLiqs.length },
          { id: "profileEdits", label: "Alterações", count: pendingProfileEdits.length },
          { id: "vault", label: "Cofre de Recibos", count: [...deposits, ...liquidations].filter(d => (d as any).foto).length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="px-4 py-2 rounded-lg transition-all text-xs font-bold whitespace-nowrap"
            style={tab === t.id
              ? { background: 'rgba(255,255,255,0.08)', color: 'white' }
              : { color: 'rgba(255,255,255,0.35)' }
            }
          >
            {t.label}
            {t.count > 0 && t.id !== "vault" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {tab === "vault" ? (
             <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...deposits, ...liquidations].filter(d => (d as any).foto).sort((a,b) => b.ts - a.ts).map((item) => (
                   <motion.div
                    key={`vault-${item.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0A0F1C] border border-white/5 cursor-zoom-in"
                    onClick={() => setPhotoPreview({ url: (item as any).foto, name: `Recibo: ${item.user_nome} - ${formatMT(item.valor)}` })}
                   >
                      <img src={(item as any).foto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-end">
                         <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none mb-1">{item.user_nome}</p>
                         <p className="text-[10px] text-emerald-400 font-bold">{formatMT(item.valor)}</p>
                         <p className="text-[8px] text-white/20 mt-1 uppercase font-black">{formatDateTime(item.ts)}</p>
                      </div>
                   </motion.div>
                ))}
                {[...deposits, ...liquidations].filter(d => (d as any).foto).length === 0 && (
                   <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="text-xs text-white/20 uppercase tracking-[0.3em] font-black">Cofre de Provas Vazio</p>
                   </div>
                )}
             </div>
          ) : (tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : tab === "liquidations" ? pendingLiqs : pendingDeps).map((req) => (
            <motion.div
              key={`${tab}-${req.id}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] p-6 bg-[#0A1121] border border-white/5 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => {
                        let photoUrl = req.user_foto;
                        if ((tab === "profileEdits" || tab === "deposits") && (req as any).foto) photoUrl = (req as any).foto;
                        if (photoUrl?.startsWith('data:image') || photoUrl?.startsWith('http')) {
                          setPhotoPreview({ url: photoUrl, name: req.user_nome });
                        }
                    }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold font-mono overflow-hidden cursor-zoom-in relative bg-white/5 border border-white/5"
                  >
                    {req.user_foto?.startsWith('data:image') || req.user_foto?.startsWith('http') ? (
                      <img src={req.user_foto} className="w-full h-full object-cover" />
                    ) : (tab === "profileEdits" || tab === "deposits" || tab === "liquidations") && (req as any).foto ? (
                      <img src={(req as any).foto} className="w-full h-full object-cover" />
                    ) : (
                      req.user_foto
                    )}
                    {(req as any).foto && (tab === "deposits" || tab === "liquidations") && <Receipt className="absolute w-4 h-4 text-blue-400 bottom-1 right-1" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic">{req.user_nome}</h4>
                    <p className="text-[10px] font-mono text-white/20">{formatDateTime(req.ts)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-white italic">{formatMT(req.valor)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmApprove({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-95 transition-all"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmReject({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 active:scale-95 transition-all"
                >
                  Recusar
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent className="max-w-md rounded-[2.5rem] bg-[#0A0F1C] border border-white/5 p-8 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            <AlertDialogHeader className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Validar Acção</AlertDialogTitle>
                    <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest mt-1">Acção Fiscal Validada</p>
                  </div>
                </div>
                
                <AlertDialogDescription className="text-xs text-white/40 leading-relaxed uppercase font-medium">
                  Este pedido será consolidado no sistema com efeito imediato nos saldos.
                </AlertDialogDescription>

                {/* RECIBO EM DESTAQUE */}
                {(displayApprove.current?.type === "deposit" || displayApprove.current?.type === "liquidation") && (displayApprove.current?.req as any)?.foto && (
                   <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Receipt className="w-3 h-3" /> Foto do Recibo
                         </span>
                         <button onClick={() => setPhotoPreview({ url: (displayApprove.current?.req as any).foto, name: "Comprovativo" })} className="text-[9px] font-bold text-white/20 uppercase">Ampliar</button>
                      </div>
                      <div 
                        onClick={() => setPhotoPreview({ url: (displayApprove.current?.req as any).foto, name: "Comprovativo" })}
                        className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group cursor-zoom-in"
                      >
                         <img src={(displayApprove.current?.req as any).foto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                   </div>
                )}
            </AlertDialogHeader>

            <div className="my-8 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden">
                      {displayApprove.current?.req?.user_foto && <img src={displayApprove.current.req.user_foto} className="w-full h-full object-cover" />}
                   </div>
                   <p className="text-sm font-black text-white italic">{displayApprove.current?.req?.user_nome}</p>
                </div>
                <p className="text-lg font-black text-emerald-500 font-mono italic">{formatMT(displayApprove.current?.req?.valor || 0)}</p>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-3">
              <AlertDialogCancel className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/5 border-white/5 text-white/40 hover:bg-white/10">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmApprove(); }} className="h-14 rounded-2xl bg-emerald-500 text-[#050810] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex-1">Confirmar A</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent className="max-w-md rounded-[2.5rem] bg-[#0A0F1C] border border-rose-500/20 p-8 shadow-[0_0_100px_rgba(244,63,94,0.1)]">
            <AlertDialogHeader className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <X className="w-6 h-6 text-rose-500" strokeWidth={3} />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Rejeitar Pedido</AlertDialogTitle>
                    <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-widest mt-1">Cancelamento Automático</p>
                  </div>
                </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex-col sm:flex-row gap-3">
              <AlertDialogCancel className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/5 border-white/5 text-white/40">Manter Pendente</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmReject(); }} className="h-14 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] flex-1">Confirmar Rejeição</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {photoPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPhotoPreview(null)}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-2xl"
          >
             <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={photoPreview.url} 
                className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
             />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
