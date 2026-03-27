import { useAudit } from "@/hooks/use-audit";
import { formatMT, formatDateTime } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { History, ArrowRightLeft, Landmark, DollarSign, UserPlus, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AuditPage() {
  const { data, isLoading } = useAudit();

  if (isLoading) return <PageLoader />;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "EMPRESTIMO": return <ArrowRightLeft className="w-4 h-4 text-warning" />;
      case "LIQUIDACAO": return <Landmark className="w-4 h-4 text-success" />;
      case "DEPOSITO": return <DollarSign className="w-4 h-4 text-info" />;
      case "MEMBRO": return <UserPlus className="w-4 h-4 text-primary" />;
      case "CONGELAMENTO": return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default: return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Auditoria</h1>
        <p className="text-muted-foreground">Log imutável de todas as movimentações financeiras do cofre.</p>
      </div>

      <div className="relative pl-6 space-y-8 mt-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {data?.map((entry, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={entry.id} 
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-card shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:border-primary/50 transition-colors">
              {getIcon(entry.tipo)}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 text-muted-foreground">{entry.tipo}</span>
                <time className="text-xs text-muted-foreground font-mono">{formatDateTime(entry.ts)}</time>
              </div>
              <p className="text-sm text-white font-medium my-2">{entry.desc}</p>
              <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-muted-foreground">Responsável: {entry.user}</span>
                {entry.valor > 0 && (
                  <span className="font-mono text-primary font-bold">{formatMT(entry.valor)}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {(!data || data.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
