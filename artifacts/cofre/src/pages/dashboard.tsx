import { useDashboard } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { Wallet, TrendingUp, Users, AlertCircle, RefreshCw, Briefcase } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Erro ao carregar dashboard.</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Resumo do Cofre</h1>
        <p className="text-muted-foreground">Visão geral do capital e operações ativas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Patrimônio Total" 
          value={formatMT(data.total)} 
          icon={<Briefcase />}
          delay={0.1}
          className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20"
        />
        <StatCard 
          title="Em Caixa" 
          value={formatMT(data.caixa)} 
          icon={<Wallet />}
          delay={0.2}
        />
        <StatCard 
          title="Na Rua (Empréstimos)" 
          value={formatMT(data.naRua)} 
          icon={<RefreshCw />}
          delay={0.3}
        />
        <StatCard 
          title="Lucros Gerados" 
          value={formatMT(data.lucros)} 
          icon={<TrendingUp className="text-success" />}
          delay={0.4}
        />
        <StatCard 
          title="Membros Ativos" 
          value={data.membros_ativos.toString()} 
          icon={<Users />}
          delay={0.5}
        />
        <StatCard 
          title="Empréstimos Ativos" 
          value={data.emprestimos_ativos.toString()} 
          icon={<Briefcase />}
          delay={0.6}
        />
        <StatCard 
          title="Solicitações Pend." 
          value={data.solicitacoes_pendentes.toString()} 
          icon={<AlertCircle className={data.solicitacoes_pendentes > 0 ? "text-warning" : ""} />}
          delay={0.7}
          className={data.solicitacoes_pendentes > 0 ? "border-warning/30" : ""}
        />
      </div>

      <div className="mt-12 p-8 glass-panel rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">O Cofre está saudável</h3>
        <p className="text-muted-foreground max-w-md">
          A rentabilidade deste mês está fluindo conforme esperado. 
          Verifique a aba de solicitações para alocar capital ocioso.
        </p>
      </div>
    </div>
  );
}
