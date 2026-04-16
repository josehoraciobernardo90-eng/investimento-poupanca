import { useDashboard } from "@/hooks/use-dashboard";
import { useLoans } from "@/hooks/use-loans";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatMT } from "@/lib/utils";
import { calcularStatusEmprestimo, verificarCongelamentos } from "@/lib/auto-freeze";
import { PageLoader } from "@/components/ui/page-loader";
import { Wallet, TrendingUp, Users, AlertCircle, RefreshCw, Briefcase, ShieldAlert, Clock, Settings, Award, Shield } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { ResetAppModal } from "@/components/admin/ResetAppModal";
// Removed redundant lucide import
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
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Sistema de Alta Performance • Chimoio 
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter leading-none hero-glow">
            Elite<span className="text-primary">Banking</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-md font-medium">Bem-vindo ao centro de comando. Gerencie seu capital com precisão de elite.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-black font-black text-xl shadow-lg shadow-primary/20">
            JH
          </div>
          <div className="pr-4">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Master Admin</p>
            <h4 className="text-sm font-bold text-white">José Horácio</h4>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Patrimônio Total" 
          value={formatMT(data.total)} 
          description="Capital Global no Sistema"
          icon={<Briefcase />}
          delay={0.1}
          className="lg:col-span-2 md:row-span-2 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/30"
        />
        <StatCard 
          title="Em Caixa" 
          value={formatMT(data.caixa)} 
          description="Disponível para saque"
          icon={<Wallet />}
          delay={0.2}
          className="bg-success/5 border-success/10"
        />
        <StatCard 
          title="Na Rua (Ativo)" 
          value={formatMT(data.naRua)} 
          description="Empréstimos circulantes"
          icon={<RefreshCw />}
          delay={0.3}
          className="bg-warning/5 border-warning/10"
        />
        <StatCard 
          title="Lucros Reais" 
          value={formatMT(data.lucros)} 
          description="Rendimento do Chitique"
          icon={<TrendingUp className="text-success" />}
          delay={0.4}
          trend={{ value: 12.5, isPositive: true }}
          className="bg-primary/5 border-primary/10"
        />
        <StatCard 
          title="Solicitações" 
          value={data.solicitacoes_pendentes.toString()} 
          description={data.solicitacoes_pendentes > 0 ? "Aguardando aprovação" : "Fluxo normal"}
          icon={<AlertCircle className={data.solicitacoes_pendentes > 0 ? "text-warning" : ""} />}
          delay={0.5}
          className={data.solicitacoes_pendentes > 0 ? "bg-warning/10 border-warning/40 animate-pulse-subtle" : "opacity-60"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <BankingCharts />
        </div>
        <div className="glass-card-elite rounded-[2.5rem] p-8 border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white italic tracking-tighter mb-2">Relatório de Elite</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-8">Health Score & Credit Data</p>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-primary/30 to-black flex items-center justify-center text-primary border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Índice Pagador</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Confiança do Cofre</p>
                  </div>
                </div>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Performance Global</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Excelente</span>
                </div>
                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-white/5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary/40 to-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-5 rounded-[1.5rem] bg-black/40 border border-white/5 backdrop-blur-sm group-hover:border-primary/20 transition-colors">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 text-center">Recomendação Bancária</p>
            <p className="text-sm text-center text-white font-black italic tracking-tighter">LIMITE DE EXPANSÃO: <span className="text-success text-glow">C$ 5.0M</span></p>
          </div>
        </div>
      </div>

      {membrosBloqueados.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-[2.5rem] bg-destructive/10 border-2 border-destructive/40 flex items-center gap-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
          <div className="w-20 h-20 rounded-[1.5rem] bg-destructive/20 flex items-center justify-center flex-shrink-0 relative z-10 border border-destructive/30 shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-destructive/40 to-transparent" />
             <ShieldAlert className="w-10 h-10 text-destructive drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase">Congelamento de Alta Prioridade</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
              {membrosBloqueados.length} membros atingiram o limite crítico de 3 meses sem devolução. 
              As contas foram <span className="text-white font-black">BLOQUEADAS</span> via Cloud Sec. Todas as solicitações de saque foram revogadas.
            </p>
          </div>
        </motion.div>
      )}

      <section className="pt-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-display font-black text-white italic tracking-tighter mb-1">
              Mapa de <span className="text-primary underline decoration-primary/20 underline-offset-8">Risco</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Acompanhamento Dinâmico de Prazos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {emprestimosStatus.map((emp, i) => {
            const s = emp.autoFreezeStatus;
            const faseColors = {
              1: "border-success/20 bg-success/5 hover:border-success/40 shadow-success/5",
              2: "border-warning/20 bg-warning/5 hover:border-warning/40 shadow-warning/5",
              3: "border-destructive/20 bg-destructive/5 hover:border-destructive/40 shadow-destructive/5",
              VENCIDO: "border-destructive bg-destructive/20 hover:border-destructive animate-pulse-subtle",
            };
            const faseIcons = {
              1: <span className="text-[10px] font-black px-2 py-1 bg-success/10 text-success border border-success/20 rounded-lg uppercase">SAFE • 10%</span>,
              2: <span className="text-[10px] font-black px-2 py-1 bg-warning/10 text-warning border border-warning/20 rounded-lg uppercase">ALERT • 20%</span>,
              3: <span className="text-[10px] font-black px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg uppercase">CRITICAL • 50%</span>,
              VENCIDO: <span className="text-[10px] font-black px-3 py-1 bg-destructive text-white rounded-lg uppercase tracking-wider">LOCKED</span>,
            };

            return (
              <Link key={emp.id} href={`/emprestimos/${emp.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className={cn(
                    "glass-card-elite rounded-[2.5rem] p-8 cursor-pointer hover:-translate-y-3 transition-all duration-500 border-2 overflow-hidden relative group",
                    faseColors[s.fase as keyof typeof faseColors]
                  )}
                >
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-white text-xl border border-white/5 shadow-2xl group-hover:rotate-12 transition-transform">
                        {emp.tomador_foto}
                      </div>
                      <div>
                        <h4 className="font-black text-white italic tracking-tighter text-lg">{emp.tomador_nome}</h4>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">DÍVIDA BÁSICA: {formatMT(emp.valor_original)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10 p-5 rounded-3xl bg-black/40 border border-white/5 space-y-4 mb-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Juro Acumulado</span>
                        <span className="font-mono text-primary font-black text-xl text-glow">{formatMT(s.juro)}</span>
                     </div>
                     <div className="flex justify-between items-center group-hover:scale-105 transition-transform origin-right">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Total Devido</span>
                        <span className="font-mono text-white font-black text-2xl tracking-tighter">{formatMT(s.totalDevido)}</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    {faseIcons[s.fase as keyof typeof faseIcons]}
                    {s.diasRestantes > 0 ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={cn("text-xs font-black uppercase italic tracking-widest", s.diasRestantes <= 5 ? "text-destructive" : "text-muted-foreground")}>
                          {s.diasRestantes} dias left
                        </span>
                      </div>
                    ) : s.fase === "VENCIDO" ? null : (
                       <span className="text-[10px] font-black text-destructive uppercase tracking-widest">Expirado</span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="glass-card-elite rounded-[3rem] p-10 relative overflow-hidden border-primary/10 mt-12">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
           <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-2xl">
              <Shield className="w-12 h-12" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-display font-black text-white italic tracking-tighter mb-2">Protocolos de Liquidação</h3>
              <p className="text-muted-foreground font-medium max-w-2xl">Regras fixas para garantir a saúde do sistema. A escalada de juros ocorre a cada ciclo de 30 dias para proteger o capital dos investidores.</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-success/30 transition-all group">
            <div className="text-success font-black text-2xl italic mb-2 tracking-tighter group-hover:scale-110 transition-transform origin-left">Ciclo 01 • 10%</div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">Janela padrão para devolução do capital com juros bonificados.</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-warning/30 transition-all group">
            <div className="text-warning font-black text-2xl italic mb-2 tracking-tighter group-hover:scale-110 transition-transform origin-left">Ciclo 02 • 20%</div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">Fase de alerta. O custo do capital aumenta para compensar o atraso inicial.</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-destructive/30 transition-all group">
            <div className="text-destructive font-black text-2xl italic mb-2 tracking-tighter group-hover:scale-110 transition-transform origin-left">Vencimento • 50%</div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">Limite de segurança. Após este ponto, as contas são congeladas via Cloud Sec.</p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-16"
        >
          <div className="glass-card-elite rounded-[2.5rem] p-10 border-destructive/20 bg-gradient-to-r from-destructive/10 to-transparent">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/20 shadow-2xl animate-pulse">
                  <Settings className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Terminal de Comando</h3>
                  <p className="text-sm text-muted-foreground font-medium">Controle de protocolos críticos e redefinição de core capital.</p>
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
