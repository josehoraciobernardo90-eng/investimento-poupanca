import { dbStore } from "@/data/firebase-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

export function useDashboard() {
  useMockDataSync();
  
  const pendentes = 
    (dbStore.loanRequests || []).filter(r => r.status === "Pendente").length +
    (dbStore.depositRequests || []).filter(r => r.status === "Pendente").length +
    (dbStore.membershipRequests || []).filter(r => r.status === "Pendente").length;
    
  return {
    data: {
      caixa: 0,
      lucros: 0,
      naRua: 0,
      total: 0,
      membros_ativos: 0,
      emprestimos_ativos: 0,
      ...dbStore.dashboard,
      solicitacoes_pendentes: pendentes
    },
    isLoading: false,
    isError: false,
  };
}
