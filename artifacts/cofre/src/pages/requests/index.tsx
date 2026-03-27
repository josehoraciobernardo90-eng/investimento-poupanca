import { useState, useRef } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest, useApproveMembershipRequest, useRejectMembershipRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AnyRequest = {
  id: string;
  user_id: string;
  user_nome: string;
  user_foto: string;
  valor: number;
  status: string;
  ts: number;
  motivo?: string;
};

export default function RequestsPage() {
  const { loans, deposits, memberships, isLoading } = useRequests();
  const { data: users } = useUsers();
  const [tab, setTab] = useState<"memberships" | "loans" | "deposits">("memberships");

  const approveLoanMut = useApproveLoanRequest();
  const rejectLoanMut = useRejectLoanRequest();
  const approveDepMut = useApproveDepositRequest();
  const rejectDepMut = useRejectDepositRequest();
  const approveMemMut = useApproveMembershipRequest();
  const rejectMemMut = useRejectMembershipRequest();

  const [createType, setCreateType] = useState<"loan" | "deposit" | null>(null);
  const createLoanMut = useCreateLoanRequest();
  const createDepMut = useCreateDepositRequest();
  const [userId, setUserId] = useState("");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  const [confirmApprove, setConfirmApprove] = useState<{ req: AnyRequest; type: "loan" | "deposit" | "membership" } | null>(null);
  // Snapshot ref so the modal always has data during Framer exit animation
  const displayApprove = useRef<{ req: AnyRequest; type: "loan" | "deposit" | "membership" } | null>(null);
  if (confirmApprove !== null) displayApprove.current = confirmApprove;

  if (isLoading) return <PageLoader />;

  const mappedMemberships = (memberships || []).map(m => ({
    id: m.id, user_id: m.id, user_nome: m.nome, user_foto: m.foto, valor: m.saldo_base, status: m.status, ts: m.ts
  }));
  const pendingMems = mappedMemberships.filter(r => r.status === "Pendente");
  const historyMems = mappedMemberships.filter(r => r.status !== "Pendente");

  const pendingLoans = loans.filter(r => r.status === "Pendente");
  const historyLoans = loans.filter(r => r.status !== "Pendente");
  const pendingDeps = deposits.filter(r => r.status === "Pendente");
  const historyDeps = deposits.filter(r => r.status !== "Pendente");

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
      }
    } catch {
      // Error feedback is handled by onError toast in the hooks
    } finally {
      setConfirmApprove(null);
    }
  };

  const isApproving = approveLoanMut.isPending || approveDepMut.isPending || approveMemMut.isPending;

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
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Pendentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : pendingDeps).map((req) => (
            <motion.div key={req.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-5 rounded-2xl border-l-4 border-l-warning">
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
                  <span className="block font-mono font-bold text-lg text-white">{formatMT(req.valor)}</span>
                  <StatusBadge status={req.status} />
                </div>
              </div>

              {tab === "loans" && "motivo" in req && (req as AnyRequest).motivo && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm text-gray-300">
                  <span className="block text-xs text-muted-foreground mb-1">Motivo:</span>
                  {(req as AnyRequest).motivo}
                </div>
              )}

              {tab === "loans" && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                  <span className="text-primary font-semibold">Algoritmo de alocação:</span> O membro com maior saldo perde tudo primeiro; o restante divide-se igualmente pelos outros.
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => setConfirmApprove({ req: req as AnyRequest, type: tab === "memberships" ? "membership" : tab === "loans" ? "loan" : "deposit" })}
                  disabled={isApproving || rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending}
                  className="flex-1 bg-success/20 text-success hover:bg-success hover:text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> Aprovar
                </button>
                <button
                  onClick={() => tab === "memberships" ? rejectMemMut.mutate({ requestId: req.id }) : tab === "loans" ? rejectLoanMut.mutate({ requestId: req.id }) : rejectDepMut.mutate({ requestId: req.id })}
                  disabled={rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending || isApproving}
                  className="flex-1 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {(rejectLoanMut.isPending || rejectDepMut.isPending || rejectMemMut.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Rejeitar
                </button>
              </div>
            </motion.div>
          ))}
          {(tab === "memberships" ? pendingMems : tab === "loans" ? pendingLoans : pendingDeps).length === 0 && (
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
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                    {tab === "loans" && <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo</th>}
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(tab === "memberships" ? historyMems : tab === "loans" ? historyLoans : historyDeps).map((req) => (
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
                      <td className="p-4 font-mono text-white font-semibold">{formatMT(req.valor)}</td>
                      {tab === "loans" && <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">{"motivo" in req ? req.motivo || "—" : "—"}</td>}
                      <td className="p-4"><StatusBadge status={req.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Confirm Approve Dialog — CSS-only transition, no Framer Motion (avoids insertBefore crash) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          pointerEvents: confirmApprove ? "auto" : "none",
          opacity: confirmApprove ? 1 : 0,
          transition: "opacity 0.2s ease",
          background: confirmApprove ? "rgba(0,0,0,0.70)" : "transparent",
          backdropFilter: confirmApprove ? "blur(4px)" : "none",
        }}
      >
        <div
          className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-white/10"
          style={{
            transform: confirmApprove ? "scale(1)" : "scale(0.93)",
            opacity: confirmApprove ? 1 : 0,
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Confirmar Aprovação</h2>
              <p className="text-sm text-muted-foreground">Esta acção é irreversível</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-sm">
                  {displayApprove.current?.req?.user_foto}
                </div>
                <div>
                  <p className="font-semibold text-white">{displayApprove.current?.req?.user_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayApprove.current?.type === "loan" ? "Pedido de empréstimo" : 
                     displayApprove.current?.type === "membership" ? "Adesão ao cofre" : "Pedido de aporte"}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-xl font-mono font-bold text-primary">{formatMT(displayApprove.current?.req?.valor || 0)}</span>
                </div>
              </div>

              {displayApprove.current?.type === "loan" && (
                <div className="mt-3 pt-3 border-t border-white/5 text-sm text-muted-foreground space-y-1">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Regras de alocação</p>
                  <p>• O membro com <span className="text-white">maior saldo</span> contribui primeiro (até esgotar)</p>
                  <p>• O valor restante é <span className="text-white">dividido igualmente</span> pelos demais</p>
                  <p>• Juro mês 1: <span className="text-primary">10%</span> · Mês 2: <span className="text-warning">20%</span> · Mês 3+: <span className="text-destructive">50%</span></p>
                </div>
              )}

              {displayApprove.current?.type === "deposit" && (
                <div className="mt-3 pt-3 border-t border-white/5 text-sm text-muted-foreground">
                  <p>O saldo do membro será <span className="text-success font-semibold">creditado</span> com {formatMT(displayApprove.current?.req?.valor || 0)} imediatamente.</p>
                </div>
              )}

              {displayApprove.current?.type === "membership" && (
                <div className="mt-3 pt-3 border-t border-white/5 text-sm text-muted-foreground">
                  <p>Um novo perfil será criado e <span className="text-success font-semibold">adicionado ao património do cofre</span> com {formatMT(displayApprove.current?.req?.valor || 0)}.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmApprove(null)}
              disabled={isApproving}
              className="flex-1 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 py-3 rounded-xl font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={isApproving}
              className="flex-1 bg-success text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-success/90 transition-colors disabled:opacity-60"
            >
              {isApproving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                : <><Check className="w-4 h-4" /> Confirmar</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Create Request Dialog — CSS-only transition (same pattern as confirm dialog) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          pointerEvents: createType ? "auto" : "none",
          opacity: createType ? 1 : 0,
          transition: "opacity 0.2s ease",
          background: createType ? "rgba(0,0,0,0.60)" : "transparent",
          backdropFilter: createType ? "blur(4px)" : "none",
        }}
      >
        <div
          className="glass-panel w-full max-w-md rounded-2xl p-6 relative"
          style={{
            transform: createType ? "scale(1)" : "scale(0.95)",
            opacity: createType ? 1 : 0,
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}
        >
          <button onClick={() => setCreateType(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold text-white mb-6">Nova Solicitação de {createType === 'loan' ? 'Empréstimo' : 'Aporte'}</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Membro</label>
              <select required value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
                <option value="">Selecione o membro...</option>
                {users?.filter(u => u.status === 'Ativo').map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Valor (MT)</label>
              <input required type="text" value={valor} onChange={e => setValor(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="ex: 500.00" />
            </div>
            {createType === "loan" && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Motivo</label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors min-h-[80px] resize-none" placeholder="Para que será usado o empréstimo..." />
              </div>
            )}
            <button type="submit" disabled={createLoanMut.isPending || createDepMut.isPending} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {(createLoanMut.isPending || createDepMut.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" /> A criar...</> : "Criar Solicitação"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

