import { useLoans } from "@/hooks/use-loans";
import { formatMT, formatDate } from "@/lib/utils";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Search, Calendar, ChevronRight, ShieldAlert } from "lucide-react";
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
        <p className="text-muted-foreground">Acompanhe os empréstimos, juros por fase e congelamentos automáticos.</p>
      </div>

      {/* Regras resumidas */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full font-medium">Mês 1 → 10%</span>
        <span className="text-xs px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full font-medium">Mês 2 → 20%</span>
        <span className="text-xs px-3 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full font-medium">Mês 3 → 50% ⚠️</span>
        <span className="text-xs px-3 py-1 bg-destructive/30 text-white border border-destructive rounded-full font-medium">Não pagou → 🔒 Bloqueio</span>
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
                <th className="p-4 font-medium text-muted-foreground">Base (fixa)</th>
                <th className="p-4 font-medium text-muted-foreground">Fase / Juro</th>
                <th className="p-4 font-medium text-muted-foreground">Total a Devolver</th>
                <th className="p-4 font-medium text-muted-foreground">Prazo</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((loan, i) => {
                const s = calcularStatusEmprestimo(loan.valor_original, loan.data_inicio);
                const faseClass = {
                  1: "text-success",
                  2: "text-warning", 
                  3: "text-destructive",
                  VENCIDO: "text-destructive font-bold",
                };
                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={loan.id} 
                    className={`hover:bg-white/5 transition-colors group ${s.deveBloqueiar ? "bg-destructive/5" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                          {loan.tomador_foto?.startsWith('data:image') || loan.tomador_foto?.startsWith('http') ? (
                            <img src={loan.tomador_foto} className="w-full h-full object-cover" alt={loan.tomador_nome} />
                          ) : (
                            loan.tomador_foto
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-white">{loan.tomador_nome}</span>
                          {s.deveBloqueiar && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <ShieldAlert className="w-3 h-3 text-destructive" />
                              <span className="text-[10px] text-destructive font-bold">CONTA BLOQUEADA</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-white">{formatMT(loan.valor_original)}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={`font-medium ${faseClass[s.fase]}`}>
                          {s.fase === "VENCIDO" ? "🔒 VENCIDO" : `Mês ${s.fase} — ${s.taxaAtual}%`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Juro: {formatMT(s.juro)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-white font-bold">{formatMT(s.totalDevido)}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        {s.diasRestantes > 0 ? (
                          <>
                            <span className={`text-sm font-bold ${s.diasRestantes <= 5 ? "text-destructive" : s.diasRestantes <= 10 ? "text-warning" : "text-success"}`}>
                              {s.diasRestantes} dias
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {loan.dias} dias corridos
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-destructive">Expirado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {s.deveBloqueiar ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-destructive text-white animate-pulse">🔒 Bloqueado</span>
                      ) : (
                        <StatusBadge status={loan.status} />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/emprestimos/${loan.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
