import React, { useState, useRef } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest, useApproveMembershipRequest, useRejectMembershipRequest, useCreateDeletionRequest, useApproveProfileEditRequest, useRejectProfileEditRequest, useApproveLiquidationRequest, useRejectLiquidationRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney, cn } from "@/lib/utils";
import { Link } from "wouter";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Trash2, ShieldCheck, User } from "lucide-react";
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInputMoney(valor);
    if (!userId || val <= 0) return;
    try {
      if (createType === "loan") {
        await createLoanMut.mutateAsync({ data: { user_id: userId, valor: val, motivo, indicador_id: indicadorId } });
      } else {
        await createDepMut.mutateAsync({ data: { user_id: userId, valor: val } });
      }
      setTimeout(() => {
        setCreateType(null);
        setUserId(""); setValor(""); setMotivo(""); setIndicadorId("");
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
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'hsl(160 84% 44%)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.6)' }}>Gestão das Contas · Chimoio</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Pedidos dos Membros</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Pedidos pendentes de aprovação e histórico de movimentações.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateType("deposit")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
            <ArrowDownToLine className="w-3.5 h-3.5" /> Novo Aporte
          </button>
          <button onClick={() => setCreateType("loan")} className="btn-primary">
            <ArrowUpFromLine className="w-3.5 h-3.5" /> Novo Empréstimo
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
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
            className="px-4 py-2 rounded-md transition-all text-xs font-medium"
            style={tab === t.id
              ? { background: 'rgba(255,255,255,0.08)', color: 'white' }
              : { color: 'rgba(255,255,255,0.35)' }
            }
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: 'hsl(160 84% 44%)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pedidos Pendentes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : tab === "liquidations" ? pendingLiqs : pendingDeps).map((req) => (
            <motion.div
              key={`${tab}-${req.id}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="rounded-xl p-5"
              style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '2px solid rgba(251,191,36,0.3)' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => {
                        let photoUrl = req.user_foto;
                        if (tab === "profileEdits" && (req as any).foto) photoUrl = (req as any).foto;
                        if (photoUrl?.startsWith('data:image') || photoUrl?.startsWith('http')) {
                          setPhotoPreview({ url: photoUrl, name: req.user_nome });
                        }
                    }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-mono overflow-hidden cursor-zoom-in group-hover:scale-110 transition-transform" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.8)' }}
                  >
                    {req.user_foto?.startsWith('data:image') || req.user_foto?.startsWith('http') ? (
                      <img src={req.user_foto} className="w-full h-full object-cover" alt={req.user_nome} />
                    ) : tab === "profileEdits" && (req as any).foto ? (
                      <img src={(req as any).foto} className="w-full h-full object-cover" />
                    ) : (
                      req.user_foto
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{req.user_nome}</h4>
                    <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDateTime(req.ts)}</p>
                  </div>
                </div>
                <div className="text-right">
                  {tab !== "profileEdits" ? (
                    <span className="text-lg font-bold font-mono" style={{ color: tab === "liquidations" ? 'hsl(160 84% 44%)' : 'white' }}>{formatMT(req.valor)}</span>
                  ) : (
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.07)', color: 'rgba(16,185,129,0.7)', border: '1px solid rgba(16,185,129,0.12)' }}>Alteração</span>
                  )}
                </div>
              </div>

              {tab === "loans" && (req as any).motivo && (
                <div className="mb-4 p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: 'rgba(251,191,36,0.7)' }} className="font-semibold">Motivo: </span>{(req as any).motivo}
                </div>
              )}

              {tab === "liquidations" && (
                <div className="mb-4 p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: 'rgba(16,185,129,0.7)' }} className="font-semibold">Confirmação de Pagamento: </span>O membro afirma ter entregue o valor acumulado. Verifique o caixa antes de aprovar.
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/[0.04]">
                <button
                  onClick={() => setConfirmApprove({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                  disabled={isApproving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.08)', color: 'rgba(16,185,129,0.8)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <Check className="w-3.5 h-3.5" /> Aceitar
                </button>
                <button
                  onClick={() => setConfirmReject({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : tab === "liquidations" ? "liquidation" : "deposit" })}
                  disabled={isApproving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <X className="w-3.5 h-3.5" /> Recusar
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : tab === "liquidations" ? pendingLiqs : pendingDeps).length === 0 && (
          <div className="col-span-full py-16 text-center rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
            <ShieldCheck className="w-6 h-6 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhum pedido pendente nesta categoria</p>
          </div>
        )}
      </div>

      {/* ── Histórico ── */}
      {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : historyDeps).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Histórico</h2>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Membro</th>
                    {tab !== "profileEdits" && <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Capital</th>}
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>Estado</th>
                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-widest text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>Acção</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : tab === "profileEdits" ? historyProfileEdits : historyDeps).map((req) => (
                    <tr key={`history-${req.id}`} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => {
                                let photoUrl = req.user_foto;
                                if (tab === "profileEdits" && (req as any).foto) photoUrl = (req as any).foto;
                                if (photoUrl?.startsWith('data:image') || photoUrl?.startsWith('http')) {
                                  setPhotoPreview({ url: photoUrl, name: req.user_nome });
                                }
                            }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono overflow-hidden cursor-zoom-in" style={{ background: 'rgba(99,102,241,0.08)', color: 'rgba(165,180,252,0.7)' }}
                          >
                            {req.user_foto?.startsWith('data:image') || req.user_foto?.startsWith('http') ? (
                              <img src={req.user_foto} className="w-full h-full object-cover" alt={req.user_nome} />
                            ) : tab === "profileEdits" && (req as any).foto ? (
                              <img src={(req as any).foto} className="w-full h-full object-cover" />
                            ) : (
                              req.user_foto
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{req.user_nome}</p>
                            <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{formatDateTime(req.ts)}</p>
                          </div>
                        </div>
                      </td>
                      {tab !== "profileEdits" && <td className="px-5 py-3 text-sm font-semibold font-mono text-white">{formatMT(req.valor)}</td>}
                      <td className="px-5 py-3 text-center"><StatusBadge status={req.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setConfirmDelete({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : "deposit" })}
                          className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          style={{ background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.5)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── Modais de Confirmação ── */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent className="max-w-sm rounded-xl p-0 overflow-hidden border-0" style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <Check className="w-4 h-4" style={{ color: 'hsl(160 84% 44%)' }} />
                </div>
                <div>
                  <AlertDialogTitle className="text-base font-bold text-white">Confirmar Aprovação</AlertDialogTitle>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.6)' }}>Acção Fiscal Validada</p>
                </div>
              </div>
              <AlertDialogDescription className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Este pedido será validado no sistema. A operação gera efeito imediato nos saldos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center justify-between p-3 rounded-lg my-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => {
                        let photoUrl = displayApprove.current?.req?.user_foto;
                        if (displayApprove.current?.type === "profileEdit" && (displayApprove.current?.req as any)?.foto) photoUrl = (displayApprove.current?.req as any).foto;
                        if (photoUrl?.startsWith('data:image') || photoUrl?.startsWith('http')) {
                          setPhotoPreview({ url: photoUrl, name: displayApprove.current?.req?.user_nome || "Membro" });
                        }
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono overflow-hidden cursor-zoom-in" style={{ background: 'rgba(99,102,241,0.1)', color: 'rgba(165,180,252,0.7)' }}
                >
                   {displayApprove.current?.req?.user_foto?.startsWith('data:image') || displayApprove.current?.req?.user_foto?.startsWith('http') ? (
                      <img src={displayApprove.current.req.user_foto} className="w-full h-full object-cover" />
                   ) : displayApprove.current?.type === "profileEdit" && (displayApprove.current?.req as any)?.foto ? (
                      <img src={(displayApprove.current?.req as any).foto} className="w-full h-full object-cover" />
                   ) : (
                      displayApprove.current?.req?.user_foto
                   )}
                </div>
                <p className="text-sm font-semibold text-white">{displayApprove.current?.req?.user_nome}</p>
              </div>
              <div className="text-right">
                 {displayApprove.current?.type === "profileEdit" ? (
                   <span className="text-xs font-bold font-mono" style={{ color: 'hsl(160 84% 44%)' }}>Actualização de Perfil</span>
                 ) : (
                   <p className="text-sm font-bold font-mono" style={{ color: 'hsl(160 84% 44%)' }}>{formatMT(displayApprove.current?.req?.valor || 0)}</p>
                 )}
              </div>
            </div>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-lg h-10 text-xs font-medium px-4" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmApprove(); }} className="flex-1 rounded-lg h-10 text-xs font-semibold" style={{ background: 'hsl(160 84% 39%)', color: 'hsl(222 40% 5%)' }}>Confirmar Aprovação</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent className="max-w-sm rounded-xl p-0 overflow-hidden border-0" style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <X className="w-4 h-4" style={{ color: 'rgba(239,68,68,0.8)' }} />
                </div>
                <div>
                  <AlertDialogTitle className="text-base font-bold text-white">Rejeitar Pedido</AlertDialogTitle>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.6)' }}>Cancelamento Automático</p>
                </div>
              </div>
              <AlertDialogDescription className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Ao rejeitar, o pedido é movido para o histórico e o membro não receberá os fundos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-4">
              <AlertDialogCancel className="rounded-lg h-10 text-xs font-medium px-4" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>Manter Pedido</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmReject(); }} className="flex-1 rounded-lg h-10 text-xs font-semibold" style={{ background: 'hsl(0 72% 51%)', color: 'white' }}>Confirmar Rejeição</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-xl p-0 overflow-hidden border-0" style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <Trash2 className="w-4 h-4" style={{ color: 'rgba(239,68,68,0.8)' }} />
                </div>
                <div>
                  <AlertDialogTitle className="text-base font-bold text-white">Eliminar Histórico</AlertDialogTitle>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.6)' }}>Auditoria de Sistema</p>
                </div>
              </div>
              <AlertDialogDescription className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Uma solicitação formal de exclusão será enviada. O histórico só será permanentemente apagado após a aprovação no cofre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-4">
              <AlertDialogCancel className="rounded-lg h-10 text-xs font-medium px-4" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>Manter Histórico</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }} className="flex-1 rounded-lg h-10 text-xs font-semibold" style={{ background: 'hsl(0 72% 51%)', color: 'white' }}>Solicitar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!createType} onOpenChange={(open) => !open && setCreateType(null)}>
        <DialogContent className="glass-panel border-white/20 rounded-[3rem] max-w-md p-10 shadow-2xl overflow-hidden">
          <DialogHeader><DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Novo Registo Fiscal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div><label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Membro Titular</label><select required value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all appearance-none"><option value="" className="bg-black">Seleccionar Membro...</option>{users?.filter(u => u.status === 'Ativo').map(u => (<option key={u.id} value={u.id} className="bg-black">{u.nome}</option>))}</select></div>
            <div><label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Valor Unitário (MT)</label><input required value={valor} onChange={e => setValor(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-white focus:outline-none focus:border-primary text-center italic tracking-tighter" placeholder="0.00" /></div>
            {createType === "loan" && (
              <>
                <div>
                  <label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Membro Indicador (Ganha 20%)</label>
                  <select value={indicadorId} onChange={e => setIndicadorId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all appearance-none">
                    <option value="" className="bg-black text-white/40 italic text-[10px]">Sem indicador (Opcional)</option>
                    {users?.filter(u => u.status === 'Ativo').map(u => (
                      <option key={`ind-${u.id}`} value={u.id} className="bg-black">{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Justificativa de Crédito</label>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary min-h-[100px] resize-none" placeholder="Ex: Investimento em gado" />
                </div>
              </>
            )}
            <button disabled={createLoanMut.isPending || createDepMut.isPending} className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">{(createLoanMut.isPending || createDepMut.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar Lançamento</>}</button>
          </form>
        </DialogContent>
      </Dialog>

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
