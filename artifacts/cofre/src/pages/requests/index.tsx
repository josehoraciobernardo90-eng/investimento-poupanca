import { useState, useRef } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest, useApproveMembershipRequest, useRejectMembershipRequest, useCreateDeletionRequest, useApproveProfileEditRequest, useRejectProfileEditRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
  const { loans, deposits, memberships, profileEdits, isLoading } = useRequests();
  const { data: users } = useUsers();
  const [tab, setTab] = useState<"memberships" | "loans" | "deposits" | "profileEdits">("memberships");

  const approveLoanMut = useApproveLoanRequest();
  const rejectLoanMut = useRejectLoanRequest();
  const approveDepMut = useApproveDepositRequest();
  const rejectDepMut = useRejectDepositRequest();
  const approveMemMut = useApproveMembershipRequest();
  const rejectMemMut = useRejectMembershipRequest();
  const approveProfileMut = useApproveProfileEditRequest();
  const rejectProfileMut = useRejectProfileEditRequest();

  const [createType, setCreateType] = useState<"loan" | "deposit" | null>(null);
  const createLoanMut = useCreateLoanRequest();
  const createDepMut = useCreateDepositRequest();
  const [userId, setUserId] = useState("");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  const createDelReqMut = useCreateDeletionRequest();
  const [confirmDelete, setConfirmDelete] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" } | null>(null);

  const [confirmApprove, setConfirmApprove] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" } | null>(null);
  const [confirmReject, setConfirmReject] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" } | null>(null);
  // Snapshot ref so the modal always has data during Framer exit animation
  const displayApprove = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" } | null>(null);
  const displayReject = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" | "profileEdit" } | null>(null);
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
      setCreateType(null);
      setUserId(""); setValor(""); setMotivo("");
    } catch {
      // Error feedback is handled by onError toast in the hooks
    }
  };

  const handleConfirmApprove = async () => {
    if (!confirmApprove) return;
    try {
      if (confirmApprove.type === "loan") {
        await approveLoanMut.mutateAsync({ requestId: confirmApprove.req.id });
      } else if (confirmApprove.type === "deposit") {
        await approveDepMut.mutateAsync({ requestId: confirmApprove.req.id });
      } else if (confirmApprove.type === "membership") {
        await approveMemMut.mutateAsync({ requestId: confirmApprove.req.id });
      } else if (confirmApprove.type === "profileEdit") {
        await approveProfileMut.mutateAsync({ requestId: confirmApprove.req.id });
      }
    } catch {
      // Error feedback is handled by onError toast in the hooks
    } finally {
      setConfirmApprove(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmReject) return;
    try {
      if (confirmReject.type === "loan") {
        await rejectLoanMut.mutate({ requestId: confirmReject.req.id });
      } else if (confirmReject.type === "deposit") {
        await rejectDepMut.mutate({ requestId: confirmReject.req.id });
      } else if (confirmReject.type === "membership") {
        await rejectMemMut.mutate({ requestId: confirmReject.req.id });
      } else if (confirmReject.type === "profileEdit") {
        await rejectProfileMut.mutate({ requestId: confirmReject.req.id });
      }
    } catch {
      // Error feedback is handled by onError toast in the hooks
    } finally {
      setConfirmReject(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await createDelReqMut.mutateAsync({
        targetId: confirmDelete.req.id,
        targetType: confirmDelete.type,
        userId: confirmDelete.req.user_id,
        userNome: confirmDelete.req.user_nome,
        details: {
          valor: confirmDelete.req.valor,
          ts: confirmDelete.req.ts
        }
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const isApproving = approveLoanMut.isPending || approveDepMut.isPending || approveMemMut.isPending || approveProfileMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Solicitações</h1>
          <p className="text-muted-foreground">Aprove pedidos de empréstimos e aportes de capital.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateType("deposit")} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            <ArrowDownToLine className="w-4 h-4" /> Aporte
          </button>
          <button onClick={() => setCreateType("loan")} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <ArrowUpFromLine className="w-4 h-4" /> Empréstimo
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setTab("memberships")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === "memberships" ? "bg-card text-white shadow-sm" : "text-muted-foreground hover:text-white")}
        >
          Adesões ({pendingMems.length})
        </button>
        <button
          onClick={() => setTab("loans")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === "loans" ? "bg-card text-white shadow-sm" : "text-muted-foreground hover:text-white")}
        >
          Empréstimos ({pendingLoans.length})
        </button>
        <button
          onClick={() => setTab("deposits")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === "deposits" ? "bg-card text-white shadow-sm" : "text-muted-foreground hover:text-white")}
        >
          Aportes ({pendingDeps.length})
        </button>
        <button
          onClick={() => setTab("profileEdits")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === "profileEdits" ? "bg-card text-white shadow-sm" : "text-muted-foreground hover:text-white")}
        >
          Edições ({pendingProfileEdits.length})
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Pendentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[100px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : pendingDeps).map((req) => (
              <motion.div 
                key={`req-${tab}-${req.id}`} 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                layout="position"
                className="glass-panel p-5 rounded-2xl border-l-4 border-l-warning origin-top shadow-xl"
              >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-sm">
                    {req.user_foto}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{req.user_nome}</h4>
                    <span className="text-xs text-muted-foreground">{formatDateTime(req.ts)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {tab !== "profileEdits" ? (
                    <span className="block font-mono font-bold text-lg text-white">{formatMT(req.valor)}</span>
                  ) : (
                    <span className="block font-bold text-sm text-primary uppercase tracking-widest">Edição</span>
                  )}
                  <StatusBadge status={req.status} />
                </div>
              </div>

              {tab === "loans" && "motivo" in req && (req as AnyRequest).motivo && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm text-gray-300">
                  <span className="block text-xs text-muted-foreground mb-1">Motivo:</span>
                  {(req as AnyRequest).motivo}
                </div>
              )}

              {tab === "memberships" && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm border border-white/5 space-y-2">
                   <div className="flex justify-between"><span className="text-muted-foreground mr-2">Profissão:</span> <span className="text-white text-right">{(req as AnyRequest).profissao || "—"}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground mr-2">Telefone:</span> <span className="text-white text-right">{(req as AnyRequest).telefone || "—"}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground mr-2">NUIT:</span> <span className="text-white font-mono text-right">{(req as AnyRequest).nuit || "—"}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground mr-2">Endereço:</span> <span className="text-white text-right">{(req as AnyRequest).endereco || "—"}</span></div>
                </div>
              )}

              {tab === "profileEdits" && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm border border-white/5 grid grid-cols-2 gap-x-4 gap-y-2">
                   {(req as any).conjuge_nome && <div className="col-span-2 text-xs"><span className="text-muted-foreground mr-1">Cônjuge:</span><span className="text-white">{(req as any).conjuge_nome} ({(req as any).conjuge_numero || "—"})</span></div>}
                   {(req as any).irmao_nome && <div className="col-span-2 text-xs"><span className="text-muted-foreground mr-1">Irmão:</span><span className="text-white">{(req as any).irmao_nome} ({(req as any).irmao_numero || "—"})</span></div>}
                   {(req as any).parente_nome && <div className="col-span-2 text-xs"><span className="text-muted-foreground mr-1">Pai/Mãe:</span><span className="text-white">{(req as any).parente_nome} ({(req as any).parente_numero || "—"})</span></div>}
                   {(req as any).bairro && <div className="col-span-1 text-xs"><span className="text-muted-foreground mr-1">Bairro:</span><span className="text-white">{(req as any).bairro}</span></div>}
                   {(req as any).zona && <div className="col-span-1 text-xs"><span className="text-muted-foreground mr-1">Zona:</span><span className="text-white">{(req as any).zona}</span></div>}
                </div>
              )}

              {tab === "loans" && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                  <span className="text-primary font-semibold">Algoritmo de alocação:</span> O membro com maior saldo perde tudo primeiro; o restante divide-se igualmente pelos outros.
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => setConfirmApprove({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : "deposit" })}
                  disabled={isApproving || rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || rejectProfileMut.isPending}
                  className="flex-1 bg-success/20 text-success hover:bg-success hover:text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> Aprovar
                </button>
                <button
                  onClick={() => setConfirmReject({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : tab === "profileEdits" ? "profileEdit" : "deposit" })}
                  disabled={rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || rejectProfileMut.isPending || isApproving}
                  className="flex-1 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {(rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || rejectProfileMut.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Rejeitar
                </button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : tab === "profileEdits" ? pendingProfileEdits : pendingDeps).length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-white/5 rounded-2xl">
              <p className="text-lg font-medium">Nenhuma solicitação pendente</p>
              <p className="text-sm mt-1 opacity-60">Todas as solicitações foram processadas.</p>
            </div>
          )}
        </div>

        {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : historyDeps).length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mt-10">Histórico</h2>
            <div className="glass-panel rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membro</th>
                    {tab !== "profileEdits" && <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>}
                    {tab === "loans" && <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo</th>}
                    {tab === "profileEdits" && <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alterações</th>}
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    {tab !== "profileEdits" && <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acções</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : tab === "profileEdits" ? historyProfileEdits : historyDeps).map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-xs">
                            {req.user_foto}
                          </div>
                          <div>
                            <div className="font-medium text-white">{req.user_nome}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(req.ts)}</div>
                          </div>
                        </div>
                      </td>
                      {tab !== "profileEdits" && <td className="p-4 font-mono text-white font-semibold">{formatMT(req.valor)}</td>}
                      {tab === "loans" && <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">{"motivo" in req ? req.motivo || "—" : "—"}</td>}
                      {tab === "profileEdits" && <td className="p-4 text-xs text-muted-foreground max-w-[200px] truncate">Atualizou Informações Familiares/Endereço</td>}
                      <td className="p-4"><StatusBadge status={req.status} /></td>
                      {tab !== "profileEdits" && <td className="p-4 text-right">
                        <button 
                          onClick={() => setConfirmDelete({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : "deposit" })}
                          className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                          title="Solicitar Exclusão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Confirm Approve Dialog - Robust Radix Portal */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent className="glass-panel border-white/10 rounded-[2rem] max-w-md p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center text-success border border-success/20">
                <Check className="w-6 h-6" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-white">Confirmar Aprovação</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acção processa a transação e atualiza os saldos em tempo real.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-6">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-xs">
                    {displayApprove.current?.req?.user_foto}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{displayApprove.current?.req?.user_nome}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {displayApprove.current?.type === "loan" ? "Pedido de Empréstimo" : 
                       displayApprove.current?.type === "membership" ? "Adesão ao Cofre" : 
                       displayApprove.current?.type === "profileEdit" ? "Edição de Perfil" : "Novo Aporte"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {displayApprove.current?.type !== "profileEdit" ? (
                    <span className="text-xl font-mono font-black text-primary">{formatMT(displayApprove.current?.req?.valor || 0)}</span>
                  ) : (
                    <span className="text-sm font-black text-primary uppercase">Edição</span>
                  )}
                </div>
              </div>

              {displayApprove.current?.type === "loan" && (
                <div className="pt-4 border-t border-white/5 text-[10px] text-muted-foreground space-y-2 leading-relaxed">
                  <p className="font-bold text-primary uppercase tracking-widest mb-1">Algoritmo de Segurança:</p>
                  <p>• O membro com <span className="text-white">maior saldo</span> contribui primeiro.</p>
                  <p>• O juro escala de <span className="text-white">10% a 50%</span> conforme o tempo.</p>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-white/5 text-muted-foreground hover:text-white border-white/10 rounded-2xl px-6 h-12 font-bold transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmApprove();
              }}
              disabled={isApproving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-8 h-12 font-bold transition-all shadow-lg shadow-primary/20 flex-1"
            >
              {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Aprovação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reject Dialog - Robust Radix Portal */}
      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent className="glass-panel border-white/10 rounded-[2rem] max-w-md p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-white">Rejeitar Pedido</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              O autor será informado e a solicitação movida para o histórico como "Rejeitada".
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-5 bg-destructive/5 rounded-3xl border border-destructive/10 my-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-xs">
                {displayReject.current?.req?.user_foto}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{displayReject.current?.req?.user_nome}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {displayReject.current?.type === "profileEdit" 
                    ? "Rejeição de Edição de Perfil"
                    : `Rejeição de ${formatMT(displayReject.current?.req?.valor || 0)}`
                  }
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-white/5 text-muted-foreground hover:text-white border-white/10 rounded-2xl px-6 h-12 font-bold transition-all">
              Manter Pedido
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmReject();
              }}
              disabled={rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || rejectProfileMut.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl px-8 h-12 font-bold transition-all shadow-lg shadow-destructive/20 flex-1"
            >
              {(rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || rejectProfileMut.isPending) 
                ? <Loader2 className="w-5 h-5 animate-spin" /> 
                : "Confirmar Rejeição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm History Deletion Dialog - Robust Radix Portal */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent className="glass-panel border-white/10 rounded-[2rem] max-w-md p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-white">Solicitar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acção requer a aprovação do membro proprietário para que ele sirva como testemunha da exclusão no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 my-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-xs">
                {confirmDelete?.req?.user_foto}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{confirmDelete?.req?.user_nome}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Exclusão de {formatMT(confirmDelete?.req?.valor || 0)}
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-white/5 text-muted-foreground hover:text-white border-white/10 rounded-2xl px-6 h-12 font-bold transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={createDelReqMut.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl px-8 h-12 font-bold transition-all shadow-lg shadow-destructive/20 flex-1"
            >
              {createDelReqMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solicitar Aprovação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Request Dialog - Robust Radix Portal */}
      <Dialog open={!!createType} onOpenChange={(open) => !open && setCreateType(null)}>
        <DialogContent className="glass-panel border-white/10 rounded-[2rem] max-w-md p-8 shadow-2xl overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border",
                createType === 'loan' ? "bg-primary/20 text-primary border-primary/20" : "bg-success/20 text-success border-success/20"
              )}>
                {createType === 'loan' ? <ArrowUpFromLine className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">Nova Solicitação</DialogTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
                  {createType === 'loan' ? "Registo de Empréstimo" : "Registo de Aporte"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Membro Beneficiário</label>
              <select required value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-medium focus:outline-none focus:border-primary transition-all">
                <option value="" className="bg-black">Selecione o membro...</option>
                {users?.filter(u => u.status === 'Ativo').map(u => (
                  <option key={u.id} value={u.id} className="bg-black">{u.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Valor do Montante (MTn)</label>
              <input required type="text" value={valor} onChange={e => setValor(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xl font-black text-white focus:outline-none focus:border-primary placeholder:text-muted-foreground transition-all" placeholder="0.00 MT" />
            </div>
            {createType === "loan" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Finalidade do Crédito</label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary min-h-[100px] resize-none placeholder:text-muted-foreground transition-all" placeholder="Descreva brevemente o motivo..." />
              </div>
            )}
            <button 
              type="submit" 
              disabled={createLoanMut.isPending || createDepMut.isPending} 
              className={cn(
                "w-full py-5 rounded-[1.5rem] font-black text-lg shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3",
                createType === 'loan' ? "bg-primary text-primary-foreground" : "bg-white text-black"
              )}
            >
              {(createLoanMut.isPending || createDepMut.isPending) ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-5 h-5" /> Criar Solicitação</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

