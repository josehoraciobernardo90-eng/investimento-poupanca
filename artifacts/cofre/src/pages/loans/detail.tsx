import { useRoute, Link } from "wouter";
import { useLoan } from "@/hooks/use-loans";
import { formatMT } from "@/lib/utils";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Coins, Percent, AlertTriangle, ShieldAlert, Clock, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

export default function LoanDetailPage() {
  const [, params] = useRoute("/emprestimos/:id");
  const id = params?.id || "";
  const { data, isLoading } = useLoan(id);

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Empréstimo não encontrado.</div>;

  const s = calcularStatusEmprestimo(data.loan.valor_original, data.loan.data_inicio);
  const isLiquidado = data.loan.status === "Liquidado";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/emprestimos" className="p-2 glass-panel rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-white">Empréstimo #{data.loan.id.slice(0,6)}</h1>
            {s.deveBloqueiar ? (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-destructive text-white animate-pulse">🔒 VENCIDO</span>
            ) : (
              <StatusBadge status={data.loan.status} />
            )}
          </div>
          <p className="text-muted-foreground">Mutuário: {data.loan.tomador_nome}</p>
        </div>
        {!isLiquidado && !s.deveBloqueiar && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl font-bold text-muted-foreground italic text-xs">
            <Clock className="w-4 h-4" /> Aguardando liquidação pelo membro
          </div>
        )}
      </div>

      {/* Alerta de congelamento */}
      {s.deveBloqueiar && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl bg-destructive/15 border-2 border-destructive/40 flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-destructive">🔒 Conta Congelada Automaticamente</h3>
            <p className="text-sm text-muted-foreground mt-1">
              O mutuário não pagou o juro de 50% ({formatMT(s.juro)}) no prazo limite. 
              A conta foi bloqueada às 00:00. Somente o Admin pode desbloquear.
            </p>
          </div>
        </motion.div>
      )}

      {/* Status da fase actual */}
      {!isLiquidado && (
        <div className={`glass-panel rounded-2xl p-5 border-2 ${
          s.fase === 1 ? "border-success/30" : s.fase === 2 ? "border-warning/30" : "border-destructive/30"
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <CalendarClock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-white">Status do Prazo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Fase actual</span>
              <span className={`text-lg font-bold ${
                s.fase === 1 ? "text-success" : s.fase === 2 ? "text-warning" : "text-destructive"
              }`}>
                {s.fase === "VENCIDO" ? "VENCIDO" : `Mês ${s.fase} — ${s.taxaAtual}%`}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Juro calculado</span>
              <span className="text-lg font-bold font-mono text-primary">{formatMT(s.juro)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Dias restantes</span>
              <span className={`text-lg font-bold ${
                s.diasRestantes <= 5 ? "text-destructive" : s.diasRestantes <= 10 ? "text-warning" : "text-success"
              }`}>
                {s.diasRestantes > 0 ? `${s.diasRestantes} dias` : "Expirado!"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Base (fixa)" value={formatMT(data.loan.valor_original)} icon={<Coins />} className="md:col-span-2" />
        <StatCard title="Total a Devolver" value={formatMT(s.totalDevido)} icon={<AlertTriangle className="text-warning" />} className="md:col-span-2 bg-warning/5 border-warning/20" />
        <StatCard title="Taxa Actual" value={`${s.taxaAtual}%`} icon={<Percent />} />
        <StatCard title="Dias Corridos" value={data.loan.dias.toString()} icon={<Clock />} />
        <StatCard title="Juro Total" value={formatMT(s.juro)} className="md:col-span-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Distribuição de Lucro (Regra 80/20)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 20% Produtor */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-primary bg-primary/5">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">20% para o Produtor (Mutuário)</h3>
              <p className="text-2xl font-bold text-white mb-2">{formatMT(s.juro * 0.2)}</p>
              <p className="text-xs text-muted-foreground">Bonificação por girar o capital no cofre.</p>
            </div>
            
            {/* 80% Investidores */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-success bg-success/5">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">80% para os Investidores</h3>
              <p className="text-2xl font-bold text-success mb-2">{formatMT(s.juro * 0.8)}</p>
              <p className="text-xs text-muted-foreground">Distribuído proporcionalmente ao capital investido.</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden mt-4">
            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white">Detalhamento para Rastreabilidade</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/20 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 font-medium">Membro</th>
                  <th className="p-4 font-medium">Papel</th>
                  <th className="p-4 font-medium">Capital Fixo</th>
                  <th className="p-4 font-medium text-right">Lucro no Fecho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Linha do Mutuário (Produtor) */}
                <tr className="bg-primary/5">
                  <td className="p-4 font-medium text-white">{data.loan.tomador_nome}</td>
                  <td className="p-4"><span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">Produtor</span></td>
                  <td className="p-4 font-mono text-muted-foreground">—</td>
                  <td className="p-4 text-right font-mono text-primary font-bold">+{formatMT(s.juro * 0.2)}</td>
                </tr>

                {/* Linhas dos Investidores */}
                {data.traces.map((trace, i) => {
                  const juroInvestidor = (s.juro * 0.8) * (trace.pctReal / 100);
                  const isMutuario = trace.owner_id === data.loan.user_id;
                  
                  return (
                    <tr key={`inv-${i}`} className={`hover:bg-white/5 ${isMutuario ? "bg-white/5" : ""}`}>
                      <td className="p-4 font-medium text-white">
                        {trace.owner_nome} 
                        {isMutuario && <span className="ml-2 text-[10px] text-muted-foreground">(como investidor)</span>}
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2 py-1 bg-success/20 text-success rounded-full">
                          Investidor ({trace.pctReal.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-4 font-mono text-white">{formatMT(trace.valor_contribuido)}</td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-success font-bold">+{formatMT(juroInvestidor)}</span>
                        {isMutuario && (
                          <div className="text-[10px] text-primary mt-1">
                            Ganho Total: {formatMT(juroInvestidor + (s.juro * 0.2))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Escalação de Juros</h2>
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            {data.projecoes.map((proj, i) => {
              const isActive = s.taxaAtual >= proj.taxa;
              const isCurrent = s.taxaAtual === proj.taxa;
              return (
                <div key={i} className={`relative p-3 rounded-xl transition-all ${isCurrent ? "bg-white/5 border border-white/10" : ""}`}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-white">
                      {proj.label}
                      {isCurrent && <span className="ml-2 text-xs text-primary">← actual</span>}
                    </span>
                    <span className="text-sm font-mono font-bold text-primary">{formatMT(proj.totalDevido)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div  
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: '100%', backgroundColor: proj.cor || 'hsl(var(--primary))', opacity: isActive ? 1 : 0.2 }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Juro: {formatMT(proj.juroTotal)} sobre base de {formatMT(data.loan.valor_original)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
