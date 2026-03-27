import { useState } from "react";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { mockLoans, mockLoanDetails, mockUserDetails, mockDashboard, mockUsers } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useLoans() {
  useMockDataSync();
  return {
    data: mockLoans,
    isLoading: false,
    isError: false,
  };
}

export function useLoan(id: string) {
  useMockDataSync();
  return {
    data: mockLoanDetails[id] || null,
    isLoading: false,
    isError: false,
  };
}

export function useUpdateLoan() {
  const [isPending, setIsPending] = useState(false);
  return {
    isPending,
    mutate: () => {
      setIsPending(true);
      setTimeout(() => { setIsPending(false); }, 500);
    },
  };
}

export function useLiquidateLoan() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ loanId, data }: { loanId: string; data: { valor_pago: number } }) => {
      setIsPending(true);
      try {
        const detail = mockLoanDetails[loanId];
        if (!detail || detail.loan.status === "Liquidado") {
          toast({ title: "Aviso", description: "Este empréstimo já foi liquidado.", variant: "destructive" });
          return { loan: detail?.loan };
        }

        const updates: any = {};
        const base = detail.loan.valor_original;
        const juros = Math.max(0, data.valor_pago - base);

        const juroMutuario = juros * 0.5;
        const juroInvestidores = juros * 0.5;

        // Distribute profits to investors
        const updatedTraces = [...detail.traces];
        updatedTraces.forEach((trace: any, index: number) => {
          const juroGanho = juroInvestidores * (trace.pctReal / 100);
          trace.juro = juroGanho;
          trace.total = trace.valor_contribuido + juroGanho;

          const invUser = mockUserDetails[trace.owner_id];
          if (invUser) {
            const novaCaixa = invUser.emCaixa + trace.total;
            updates[`userDetails/${trace.owner_id}/emCaixa`] = novaCaixa;
            
            const baseUser = mockUsers.find(u => u.id === trace.owner_id);
            if (baseUser) {
              updates[`users/${trace.owner_id}/lucro_acumulado`] = baseUser.lucro_acumulado + juroGanho;
              updates[`users/${trace.owner_id}/saldo_base`] = novaCaixa;
            }

            const currentCirc = invUser.emCirculacao || [];
            const circIndex = currentCirc.findIndex((c: any) => c.loan_id === loanId);
            
            if (circIndex >= 0) {
               updates[`userDetails/${trace.owner_id}/emCirculacao/${circIndex}/status`] = "Liquidado";
               updates[`userDetails/${trace.owner_id}/emCirculacao/${circIndex}/total_esperado`] = trace.total;
               updates[`userDetails/${trace.owner_id}/emCirculacao/${circIndex}/juro_esperado`] = juroGanho;
            }

            const newTotalCirc = currentCirc.reduce((acc: number, c: any, i: number) => i !== circIndex && c.status !== "Liquidado" ? acc + c.valor_contribuido : acc, 0);
            const newTotalJuro = currentCirc.reduce((acc: number, c: any, i: number) => i !== circIndex && c.status !== "Liquidado" ? acc + c.juro_esperado : acc, 0);
            
            updates[`userDetails/${trace.owner_id}/totalEmCirculacao`] = newTotalCirc;
            updates[`userDetails/${trace.owner_id}/totalJuroEsperado`] = newTotalJuro;
            updates[`userDetails/${trace.owner_id}/patrimonioTotal`] = novaCaixa + newTotalCirc + newTotalJuro;
          }
        });
        
        updates[`loanDetails/${loanId}/traces`] = updatedTraces;
        updates[`loanDetails/${loanId}/loan/status`] = "Liquidado";
        updates[`loanDetails/${loanId}/loan/valor_pago`] = data.valor_pago;
        
        updates[`loans/${loanId}/status`] = "Liquidado";
        updates[`loans/${loanId}/valor_pago`] = data.valor_pago;

        // Give borrower their 50% profit share
        const tomadorUser = mockUserDetails[detail.loan.user_id];
        if (tomadorUser) {
          const tomadorCaixa = tomadorUser.emCaixa + juroMutuario;
          updates[`userDetails/${detail.loan.user_id}/emCaixa`] = tomadorCaixa;
          updates[`userDetails/${detail.loan.user_id}/patrimonioTotal`] = tomadorCaixa + (tomadorUser.totalEmCirculacao || 0) + (tomadorUser.totalJuroEsperado || 0);

          const baseTomador = mockUsers.find(u => u.id === detail.loan.user_id);
          if (baseTomador) {
            updates[`users/${detail.loan.user_id}/lucro_acumulado`] = baseTomador.lucro_acumulado + juroMutuario;
            updates[`users/${detail.loan.user_id}/saldo_base`] = tomadorCaixa;
          }
        }

        // Update dashboard
        updates[`dashboard/caixa`] = mockDashboard.caixa + data.valor_pago;
        updates[`dashboard/naRua`] = mockDashboard.naRua - base;
        updates[`dashboard/lucros`] = mockDashboard.lucros + juros;
        updates[`dashboard/emprestimos_ativos`] = Math.max(0, mockDashboard.emprestimos_ativos - 1);

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "LIQUIDACAO",
          desc: `Empréstimo #${loanId.slice(0, 6)} liquidado por ${detail.loan.tomador_nome}. Base: ${base / 100} MTn, Juros: ${juros / 100} MTn — distribuídos 50/50.`,
          valor: data.valor_pago,
          user: detail.loan.tomador_nome
        };

        await update(ref(rtdb), updates);

        toast({ title: "✅ Liquidação concluída", description: "Lucros distribuídos automaticamente a todos os investidores via Cloud." });
        return { loan: { ...detail.loan, status: "Liquidado", valor_pago: data.valor_pago } };
      } catch (err) {
        console.error("[useLiquidateLoan] Erro:", err);
        toast({ title: "Erro inesperado", description: "Não foi possível liquidar o empréstimo.", variant: "destructive" });
        return { loan: null };
      } finally {
        setIsPending(false);
      }
    },
  };
}
