import { useState } from "react";
import { useRequests, useApproveLoanRequest, useRejectLoanRequest, useCreateDepositRequest, useApproveDepositRequest, useRejectDepositRequest, useCreateLoanRequest } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatMT, formatDateTime, parseInputMoney } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RequestsPage() {
  const { loans, deposits, isLoading } = useRequests();
  const { data: users } = useUsers();
  const [tab, setTab] = useState<"loans" | "deposits">("loans");
  
  const approveLoanMut = useApproveLoanRequest();
  const rejectLoanMut = useRejectLoanRequest();
  const approveDepMut = useApproveDepositRequest();
  const rejectDepMut = useRejectDepositRequest();

  // Create Modal States
  const [createType, setCreateType] = useState<"loan" | "deposit" | null>(null);
  const createLoanMut = useCreateLoanRequest();
  const createDepMut = useCreateDepositRequest();
  const [userId, setUserId] = useState("");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  if (isLoading) return <PageLoader />;

  const pendingLoans = loans.filter(r => r.status === "Pendente");
  const historyLoans = loans.filter(r => r.status !== "Pendente");
  const pendingDeps = deposits.filter(r => r.status === "Pendente");
  const historyDeps = deposits.filter(r => r.status !== "Pendente");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInputMoney(valor);
    if (!userId || val <= 0) return;

    if (createType === "loan") {
      await createLoanMut.mutateAsync({ data: { user_id: userId, valor: val, motivo } });
    } else {
      await createDepMut.mutateAsync({ data: { user_id: userId, valor: val } });
    }
    setCreateType(null);
    setUserId(""); setValor(""); setMotivo("");
  };

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

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Pendentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tab === "loans" ? pendingLoans : pendingDeps).map((req) => (
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
                </div>
              </div>
              
              {tab === "loans" && "motivo" in req && (
                <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm text-gray-300">
                  <span className="block text-xs text-muted-foreground mb-1">Motivo:</span>
                  {req.motivo}
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => tab === "loans" ? approveLoanMut.mutate({ requestId: req.id }) : approveDepMut.mutate({ requestId: req.id })}
                  disabled={approveLoanMut.isPending || approveDepMut.isPending}
                  className="flex-1 bg-success/20 text-success hover:bg-success hover:text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Aprovar
                </button>
                <button 
                  onClick={() => tab === "loans" ? rejectLoanMut.mutate({ requestId: req.id }) : rejectDepMut.mutate({ requestId: req.id })}
                  disabled={rejectLoanMut.isPending || rejectDepMut.isPending}
                  className="flex-1 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Rejeitar
                </button>
              </div>
            </motion.div>
          ))}
          {(tab === "loans" ? pendingLoans : pendingDeps).length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-white/5 rounded-2xl">
              Nenhuma solicitação pendente.
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mt-10">Histórico</h2>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <tbody className="divide-y divide-white/5">
              {(tab === "loans" ? historyLoans : historyDeps).map((req) => (
                <tr key={req.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-medium text-white">{req.user_nome}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(req.ts)}</div>
                  </td>
                  <td className="p-4 font-mono text-white">{formatMT(req.valor)}</td>
                  <td className="p-4"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Dialog */}
      {createType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-md rounded-2xl p-6 relative">
            <button onClick={() => setCreateType(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-white mb-6">Nova Solicitação de {createType === 'loan' ? 'Empréstimo' : 'Aporte'}</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Membro</label>
                <select required value={userId} onChange={e=>setUserId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {users?.filter(u => u.status === 'Ativo').map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Valor (MT)</label>
                <input required type="text" value={valor} onChange={e=>setValor(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="5000.00" />
              </div>
              {createType === "loan" && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Motivo (Opcional)</label>
                  <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary min-h-[80px]" placeholder="Para negócio..." />
                </div>
              )}
              
              <button type="submit" disabled={createLoanMut.isPending || createDepMut.isPending} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold mt-6 hover:bg-primary/90 disabled:opacity-50">
                Criar Solicitação
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
