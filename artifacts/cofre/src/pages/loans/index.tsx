import { useLoans } from "@/hooks/use-loans";
import { formatMT, formatDate } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Search, Calendar, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();
  const [search, setSearch] = useState("");

  if (isLoading) return <PageLoader />;

  const filtered = loans?.filter(l => l.tomador_nome.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Empréstimos</h1>
        <p className="text-muted-foreground">Acompanhe os empréstimos ativos, atrasos e liquidações.</p>
      </div>

      <div className="glass-panel rounded-2xl p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <input 
          type="text"
          placeholder="Buscar por mutuário..."
          className="bg-transparent border-none focus:outline-none text-white w-full py-2 placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-sm">
                <th className="p-4 font-medium text-muted-foreground">Mutuário</th>
                <th className="p-4 font-medium text-muted-foreground">Valor Original</th>
                <th className="p-4 font-medium text-muted-foreground">Taxa/Dias</th>
                <th className="p-4 font-medium text-muted-foreground">Devido Total</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((loan, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={loan.id} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-white">
                        {loan.tomador_foto}
                      </div>
                      <span className="font-medium text-white">{loan.tomador_nome}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-white">{formatMT(loan.valor_original)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-primary font-medium">{loan.taxa_atual}%</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {loan.dias} dias
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-white font-bold">{formatMT(loan.total_devido)}</td>
                  <td className="p-4"><StatusBadge status={loan.status} /></td>
                  <td className="p-4 text-right">
                    <Link href={`/emprestimos/${loan.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum empréstimo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
