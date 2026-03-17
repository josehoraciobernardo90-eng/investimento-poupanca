import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useLoan, useLiquidateLoan } from "@/hooks/use-loans";
import { formatMT, parseInputMoney } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Coins, CheckCircle, Percent, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";

export default function LoanDetailPage() {
  const [, params] = useRoute("/emprestimos/:id");
  const id = params?.id || "";
  const { data, isLoading } = useLoan(id);
  const liquidateMutation = useLiquidateLoan();
  
  const [isLiquidateOpen, setIsLiquidateOpen] = useState(false);
  const [valorPago, setValorPago] = useState("");

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Empréstimo não encontrado.</div>;

  const handleLiquidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInputMoney(valorPago);
    if (val <= 0) return;
    
    await liquidateMutation.mutateAsync({
      loanId: id,
      data: { valor_pago: val }
    });
    setIsLiquidateOpen(false);
  };

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
            <StatusBadge status={data.loan.status} />
          </div>
          <p className="text-muted-foreground">Mutuário: {data.loan.tomador_nome}</p>
        </div>
        {!isLiquidado && (
          <button 
            onClick={() => {
              setValorPago((data.loan.total_devido / 100).toFixed(2));
              setIsLiquidateOpen(true);
            }}
            className="flex items-center gap-2 bg-success/20 text-success border border-success/30 px-5 py-2.5 rounded-xl font-bold hover:bg-success hover:text-white transition-all shadow-lg"
          >
            <CheckCircle className="w-5 h-5" /> Liquidar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Valor Original" value={formatMT(data.loan.valor_original)} icon={<Coins />} className="md:col-span-2" />
        <StatCard title="Total Devido" value={formatMT(data.loan.total_devido)} icon={<AlertTriangle className="text-warning" />} className="md:col-span-2 bg-warning/5 border-warning/20" />
        <StatCard title="Taxa Atual" value={`${data.loan.taxa_atual}%`} icon={<Percent />} />
        <StatCard title="Dias Corridos" value={data.loan.dias.toString()} />
        <StatCard title="Juro Total" value={formatMT(data.loan.juro_total)} className="md:col-span-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Rastreabilidade (Investidores)</h2>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-sm">
                  <th className="p-4 font-medium text-muted-foreground">Investidor</th>
                  <th className="p-4 font-medium text-muted-foreground">Participação</th>
                  <th className="p-4 font-medium text-muted-foreground">Capital</th>
                  <th className="p-4 font-medium text-muted-foreground">Juro Aferido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.traces.map((trace, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-4 font-medium text-white">{trace.owner_nome}</td>
                    <td className="p-4 text-primary">{trace.pctReal.toFixed(1)}%</td>
                    <td className="p-4 font-mono text-white">{formatMT(trace.valor_contribuido)}</td>
                    <td className="p-4 font-mono text-success">+{formatMT(trace.juro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Projeção de Taxas</h2>
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            {data.projecoes.map((proj, i) => (
              <div key={i} className="relative">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-white">{proj.label} ({proj.taxa}%)</span>
                  <span className="text-sm font-mono font-bold text-primary">{formatMT(proj.totalDevido)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: '100%', backgroundColor: proj.cor || 'hsl(var(--primary))', opacity: data.loan.taxa_atual >= proj.taxa ? 1 : 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liquidate Dialog */}
      {isLiquidateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md rounded-2xl p-6 relative"
          >
            <button onClick={() => setIsLiquidateOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Liquidar Empréstimo</h2>
            <p className="text-sm text-muted-foreground mb-6">Confirme o valor exato recebido. O lucro será distribuído de acordo com a regra 50/50.</p>
            
            <form onSubmit={handleLiquidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Valor Pago (MT)</label>
                <input 
                  required 
                  type="text" 
                  value={valorPago} 
                  onChange={e=>setValorPago(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-success focus:ring-1 focus:ring-success" 
                />
              </div>
              
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl mt-4">
                <p className="text-xs text-warning mb-1">Valor sugerido pelo sistema:</p>
                <p className="text-lg font-bold font-mono text-white">{formatMT(data.loan.total_devido)}</p>
              </div>
              
              <button 
                type="submit" 
                disabled={liquidateMutation.isPending}
                className="w-full bg-success text-success-foreground py-3 rounded-xl font-bold mt-6 hover:bg-success/90 disabled:opacity-50"
              >
                {liquidateMutation.isPending ? "Processando..." : "Confirmar Recebimento"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
