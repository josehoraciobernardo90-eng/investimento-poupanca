import { useRoute } from "wouter";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { useLoans } from "@/hooks/use-loans";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Wallet, TrendingUp, Briefcase, Lock, Unlock, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function MemberDetailPage() {
  const [, params] = useRoute("/membros/:id");
  const id = params?.id || "";
  const { data, isLoading } = useUser(id);
  const updateMutation = useUpdateUser();
  const { data: allLoans } = useLoans();

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Membro não encontrado.</div>;

  const toggleStatus = () => {
    updateMutation.mutate({
      userId: id,
      data: {
        status: data.user.status === "Ativo" ? "Congelado" : "Ativo"
      }
    });
  };

  // Professional Limit Calculation
  const limiteTotal = data.emCaixa * 1.30;
  const dividaAtiva = allLoans?.filter(l => l.user_id === id && l.status !== "Liquidado")
    .reduce((acc, l) => acc + l.total_devido, 0) || 0;
  const limiteDisponivel = Math.max(0, limiteTotal - dividaAtiva);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/membros" className="p-2 glass-panel rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-white">{data.user.nome}</h1>
            <StatusBadge status={data.user.status} />
          </div>
          <p className="text-muted-foreground">Mapa de Capital e Investimentos</p>
        </div>
        <button
          onClick={toggleStatus}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 glass-panel px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {data.user.status === "Ativo" ? <><Lock className="w-4 h-4 text-warning" /> Congelar</> : <><Unlock className="w-4 h-4 text-success" /> Ativar</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Disponível (Caixa)" value={formatMT(data.emCaixa)} icon={<Wallet />} className="border-primary/20 bg-primary/5" />
        <StatCard
          title="Limite Disponível"
          value={formatMT(limiteDisponivel)}
          description={dividaAtiva > 0 ? "Descontando dívidas activas" : "Caixa + 30%"}
          icon={<ShieldCheck className="text-success" />}
          className="bg-success/5 border-success/20"
        />
        <StatCard title="Patrimônio Total" value={formatMT(data.patrimonioTotal)} icon={<Briefcase />} />
        <StatCard title="Juro Esperado" value={formatMT(data.totalJuroEsperado)} icon={<TrendingUp className="text-success" />} />
      </div>

      <h2 className="text-xl font-bold text-white mt-10 mb-4 border-b border-white/10 pb-2">Capital em Circulação</h2>

      {data.emCirculacao.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
           Nenhum capital alocado em empréstimos no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.emCirculacao.map((item, i) => (
            <Link key={i} href={`/emprestimos/${item.loan_id}`}>
              <div className="glass-panel rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white">
                    {item.tomador_foto}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Mutuário: {item.tomador_nome}</h4>
                    <StatusBadge status={item.status} className="mt-1" />
                  </div>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Contribuído</span>
                    <span className="font-mono text-white font-medium">{formatMT(item.valor_contribuido)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Participação no Empréstimo</span>
                    <span className="text-sm px-2 py-0.5 bg-primary/20 text-primary rounded-md">{item.pctDoEmprestimo.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Juro Atual ({item.taxa_atual}%)</span>
                    <span className="font-mono text-success font-medium">+{formatMT(item.juro_esperado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-sm font-medium text-white">Total a Receber</span>
                    <span className="font-mono text-primary font-bold text-lg">{formatMT(item.total_esperado)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
