import { mockDashboard, mockLoanRequests, mockDepositRequests, mockMembershipRequests } from "@/data/mock-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

export function useDashboard() {
  useMockDataSync();
  
  const pendentes = 
    mockLoanRequests.filter(r => r.status === "Pendente").length +
    mockDepositRequests.filter(r => r.status === "Pendente").length +
    mockMembershipRequests.filter(r => r.status === "Pendente").length;
    
  return {
    data: {
      ...mockDashboard,
      solicitacoes_pendentes: pendentes
    },
    isLoading: false,
    isError: false,
  };
}
