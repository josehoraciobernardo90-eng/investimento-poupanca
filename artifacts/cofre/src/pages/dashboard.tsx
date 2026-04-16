import { useDashboard } from "@/hooks/use-dashboard";
import { useLoans } from "@/hooks/use-loans";
import { StatCard } from "@/components/ui/stat-card";
import { formatMT } from "@/lib/utils";
import { calcularStatusEmprestimo, verificarCongelamentos } from "@/lib/auto-freeze";
import { PageLoader } from "@/components/ui/page-loader";
import { Wallet, TrendingUp, Users, AlertCircle, RefreshCw, Briefcase, ShieldAlert, Clock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { ResetAppModal } from "@/components/admin/ResetAppModal";
import { Settings, Award } from "lucide-react";
import { BankingCharts } from "@/components/dashboard/BankingCharts";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: loans } = useLoans();
  const { isAdmin } = useAdmin();

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Erro ao carregar dashboard.</div>;

  // Verificar se há membros que devem ser congelados automaticamente
  const membrosBloqueados = loans ? verificarCongelamentos(loans) : [];

  // Calcular status de cada empréstimo activo
  const emprestimosStatus = (loans || [])
    .filter(l => l.status !== "Liquidado")
    .map(l => ({
      ...l,
      autoFreezeStatus: calcularStatusEmprestimo(l.valor_original, l.data_inicio),
    }));

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BankingCharts />
        </div>
        <div className="glass-panel rounded-2xl p-6 border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Status de Elite</h3>
            <p className="text-xs text-muted-foreground mb-6">Média de confiabilidade dos membros ativos.</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tighter">Índice Pagador</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Compromisso Real</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">84%</p>
                  <p className="text-[10px] text-success font-bold uppercase tracking-widest">+2.4% este mês</p>
                </div>
              </div>

              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '84%' }}
                  className="h-full bg-gradient-to-r from-primary/50 to-primary"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 text-center">Recomendação Bancária</p>
            <p className="text-xs text-center text-white font-medium">Capacidade de expansão de crédito: <span className="text-success font-bold">ALTA</span></p>
          </div>
        </div>
      </div>

      {/* --- ALERTA DE CONGELAMENTO AUTOMÁTICO --- */}
      {membrosBloqueados.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive mb-1">⚠️ Congelamento Automático Detectado</h3>
            <p className="text-sm text-muted-foreground">
              {membrosBloqueados.length} membro(s) não pagou(aram) o juro de 50% no prazo limite. 
              As contas foram bloqueadas automaticamente às 00:00. Somente o Admin pode desbloquear.
            </p>
          </div>
        </motion.div>
      )}

      {/* --- STATUS DOS EMPRÉSTIMOS COM PRAZOS --- */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Prazos dos Empréstimos Activos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emprestimosStatus.map((emp, i) => {
            const s = emp.autoFreezeStatus;
            const faseColors = {
              1: "border-success/30 bg-success/5",
              2: "border-warning/30 bg-warning/5",
              3: "border-destructive/30 bg-destructive/5",
              VENCIDO: "border-destructive bg-destructive/20",
            };
            const faseIcons = {
              1: <span className="text-success text-xs font-bold px-2 py-1 bg-success/20 rounded-full">Mês 1 — 10%</span>,
              2: <span className="text-warning text-xs font-bold px-2 py-1 bg-warning/20 rounded-full">Mês 2 — 20%</span>,
              3: <span className="text-destructive text-xs font-bold px-2 py-1 bg-destructive/20 rounded-full">Mês 3 — 50% ⚠️</span>,
              VENCIDO: <span className="text-white text-xs font-bold px-2 py-1 bg-destructive rounded-full animate-pulse">🔒 VENCIDO</span>,
            };

            return (
              <Link key={emp.id} href={`/emprestimos/${emp.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-panel rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 border-2 ${faseColors[s.fase]}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white text-sm">
                        {emp.tomador_foto}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{emp.tomador_nome}</h4>
                        <span className="text-xs text-muted-foreground">Base: {formatMT(emp.valor_original)}</span>
                      </div>
                    </div>
                    {faseIcons[s.fase]}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Juro actual</span>
                      <span className="font-mono text-warning font-medium">{formatMT(s.juro)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total a devolver</span>
                      <span className="font-mono text-white font-bold">{formatMT(s.totalDevido)}</span>
                    </div>
                    {s.diasRestantes > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dias restantes</span>
                        <span className={`font-bold ${s.diasRestantes <= 5 ? "text-destructive" : s.diasRestantes <= 10 ? "text-warning" : "text-success"}`}>
                          {s.diasRestantes} {s.diasRestantes === 1 ? "dia" : "dias"}
                        </span>
                      </div>
                    )}
                  </div>

                  {s.deveBloqueiar && (
                    <div className="mt-3 p-2 bg-destructive/30 rounded-lg text-center">
                      <span className="text-xs font-bold text-destructive">🔒 CONTA DO MEMBRO BLOQUEADA AUTOMATICAMENTE</span>
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* --- REGRAS DO COFRE --- */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📋 Regras de Juro & Congelamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="text-success font-bold text-lg mb-1">Mês 1 → 10%</div>
            <p className="text-xs text-muted-foreground">O membro pode devolver a base + 10% de juro na mesma data do próximo mês.</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
            <div className="text-warning font-bold text-lg mb-1">Mês 2 → 20%</div>
            <p className="text-xs text-muted-foreground">Se não pagou no mês 1, o juro sobe para 20% da base no 2º mês.</p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="text-destructive font-bold text-lg mb-1">Mês 3 → 50% ⚠️</div>
            <p className="text-xs text-muted-foreground">Último prazo! Se não pagar às 00:00 do dia seguinte, a conta é <strong className="text-white">BLOQUEADA automaticamente</strong>.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center opacity-70">
          A base nunca muda — apenas o juro escala. Somente o Admin pode desbloquear uma conta congelada.
        </p>
      </div>

      {/* --- ADMINISTRAÇÃO DO SISTEMA --- */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-10 border-t border-white/5"
        >
          <div className="glass-panel rounded-2xl p-6 border-destructive/20 bg-destructive/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Zona de Perigo: Administração do Sistema</h3>
                  <p className="text-sm text-muted-foreground">Ações críticas para manutenção do Cofre Capital.</p>
                </div>
              </div>
              <ResetAppModal />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
