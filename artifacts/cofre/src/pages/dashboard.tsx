import { useDashboard } from "@/hooks/use-dashboard";
import { useLoans } from "@/hooks/use-loans";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatMT } from "@/lib/utils";
import { calcularStatusEmprestimo, verificarCongelamentos } from "@/lib/auto-freeze";
import { PageLoader } from "@/components/ui/page-loader";
import { Wallet, TrendingUp, AlertCircle, RefreshCw, ShieldAlert, Clock, Settings, Award, Shield, Cpu, Activity, Zap, Globe } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAdmin } from "@/hooks/use-admin";
import { ResetAppModal } from "@/components/admin/ResetAppModal";
import { BankingCharts } from "@/components/dashboard/BankingCharts";
import { TechSlideshow } from "@/components/dashboard/TechSlideshow";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: loans } = useLoans();
  const { isAdmin } = useAdmin();

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Erro ao carregar terminal de dados.</div>;

  const membrosBloqueados = loans ? verificarCongelamentos(loans) : [];

  const emprestimosStatus = (loans || [])
    .filter(l => l.status !== "Liquidado")
    .map(l => ({
      ...l,
      autoFreezeStatus: calcularStatusEmprestimo(l.valor_original, l.data_inicio),
    }));

  return (
    <div className="space-y-10 pb-20 selection:bg-primary/30">
      {/* Top Tech Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative">
        <div className="relative">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-md bg-primary/5 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.3em] mb-6">
            <Activity className="w-3 h-3 animate-pulse" />
             Core Network: Active • Chimoio Node 01
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none text-glow-blue uppercase italic">
            Cyber<span className="text-secondary not-italic">Vault</span>
          </h1>
          <p className="text-white/40 mt-4 max-w-md font-mono text-[10px] uppercase tracking-widest leading-relaxed">
             [Protocolo Quantum Banking] • Terminal de Gestão de Ativos em Tempo Real. Integridade do Capital: 100%.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-xl border-l-primary border-l-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,212,255,0.2)]">
              <Cpu className="w-7 h-7" />
            </div>
            <div className="pr-4">
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">Master Controller</p>
              <h4 className="text-sm font-bold text-white font-mono tracking-tighter">ID: ADMIN_JH_026</h4>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="neo-badge text-success">Uptime: 99.9%</div>
             <div className="neo-badge text-primary">Latency: 14ms</div>
          </div>
        </div>
      </header>

      {/* Main Stats Grid Cyber */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Liquidez em Rede" 
          value={formatMT(data.caixa)} 
          description="Fundo de Saque Ativo"
          icon={<Globe className="w-6 h-6" />}
          delay={0.1}
          className="border-primary/20"
        />
        <StatCard 
          title="Capital em Operação" 
          value={formatMT(data.naRua)} 
          description="Ativos Externos"
          icon={<Zap className="w-6 h-6" />}
          delay={0.2}
          className="border-primary/10"
        />
        <StatCard 
          title="ROI Total" 
          value={formatMT(data.lucros)} 
          description="Rendimento de Rede"
          icon={<TrendingUp className="w-6 h-6" />}
          delay={0.3}
          trend={{ value: 14.2, isPositive: true }}
          className="border-secondary/20 shadow-[0_10px_40px_rgba(255,0,85,0.1)]"
        />
        <StatCard 
          title="Alertas de Sistema" 
          value={data.solicitacoes_pendentes.toString()} 
          description={data.solicitacoes_pendentes > 0 ? "Requisições em Fila" : "Status Nominal"}
          icon={<AlertCircle className={cn("w-6 h-6", data.solicitacoes_pendentes > 0 ? "text-secondary animate-pulse" : "text-white/20")} />}
          delay={0.4}
          className={cn(data.solicitacoes_pendentes > 0 ? "border-secondary/40 bg-secondary/5" : "opacity-60")}
        />
      </div>

      {/* Quantum Slide Hero Selection */}
      <TechSlideshow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card-elite rounded-[2rem] p-8 tech-grid-bg relative border-primary/10">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Activity className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Fluxo Dinâmico de Capital</h3>
              </div>
              <div className="flex gap-2">
                 <span className="neo-badge">REAL-TIME FEED</span>
              </div>
           </div>
           <BankingCharts />
        </div>

        <div className="space-y-8">
          <div className="glass-card-elite rounded-[2rem] p-8 border-secondary/10 relative group">
             {/* 3D Scanline Animation Pulse */}
             <div className="scanline-overlay group-hover:opacity-60 transition-opacity" />
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all">
                <Shield className="w-32 h-32" />
             </div>
             <h3 className="text-lg font-black text-white italic tracking-tighter mb-6 uppercase">Escudo de Auditoria</h3>
             
             <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
                   <div>
                      <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Health Score</p>
                      <p className="text-2xl font-black text-white font-mono">98.4<span className="text-xs text-primary">%</span></p>
                   </div>
                   <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span>Network Load</span>
                      <span className="text-primary">Safe State</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(0,212,255,1)]"
                      />
                   </div>
                </div>
             </div>

             <div className="mt-8">
                <button className="btn-elite w-full group">
                   <ShieldAlert className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                   Protocolo Auditoria
                </button>
             </div>
          </div>

          <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20 flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <Globe className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] font-black text-secondary uppercase tracking-[.2em]">Sede Operacional</p>
                <p className="text-xs font-bold text-white uppercase italic tracking-tighter">CHIMOIO HUB • NOD_A</p>
             </div>
          </div>
        </div>
      </div>

      <section className="pt-8">
        <div className="flex items-center gap-4 mb-10">
           <div className="h-[2px] w-12 bg-secondary/40" />
           <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">
             Monitor de <span className="text-secondary">Risco Ativo</span>
           </h2>
           <div className="h-[2px] flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {emprestimosStatus.map((emp, i) => {
            const s = emp.autoFreezeStatus;
            const isCritical = s.fase === 3 || s.fase === "VENCIDO";
            
            return (
              <Link key={emp.id} href={`/emprestimos/${emp.id}`}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "glass-card-elite rounded-[1.5rem] p-7 border-l-4 group cursor-pointer transition-all duration-500",
                    isCritical ? "border-l-secondary" : "border-l-primary"
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-white font-mono text-xl group-hover:border-primary/40 transition-colors">
                        {emp.tomador_foto || emp.tomador_nome[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase italic tracking-tighter">{emp.tomador_nome}</h4>
                        <span className="text-[9px] text-white/40 font-black tracking-widest uppercase">ID_TX: {emp.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className={cn("neo-badge font-mono", isCritical ? "text-secondary border-secondary/30" : "text-primary border-primary/30")}>
                       {emp.status}
                    </div>
                  </div>

                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3 mb-4 font-mono">
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white/40 uppercase font-black">Montante Principal</span>
                        <span className="text-white font-bold">{formatMT(emp.valor_original)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white/40 uppercase font-black">Juro Acumulado</span>
                        <span className="text-primary font-bold text-glow-blue">{formatMT(s.juro)}</span>
                     </div>
                     <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] text-white/60 uppercase font-black">Débito Total</span>
                        <span className="text-lg font-black text-white">{formatMT(s.totalDevido)}</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/20" />
                        <span className="text-[9px] font-black text-white/40 uppercase uppercase tracking-widest">{s.diasRestantes}D RESTANTES</span>
                     </div>
                     <button className="text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4">Ver Detalhes</button>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      {isAdmin && (
        <div className="pt-16">
          <div className="glass-card-elite rounded-[2rem] p-10 border-secondary/20 relative overflow-hidden">
             <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" />
             <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shadow-[0_0_30px_rgba(255,0,85,0.2)]">
                      <Settings className="w-10 h-10 animate-spin-slow" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Terminal Root</h3>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mt-1">Acesso Restrito • Gestão de Segurança Cloud</p>
                   </div>
                </div>
                <ResetAppModal />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
