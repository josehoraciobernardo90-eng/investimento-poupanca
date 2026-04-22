import { dbStore } from "@/data/firebase-data";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { calcularStatusEmprestimo } from "@/lib/auto-freeze";

export function useDashboard() {
  useMockDataSync();
  
  const pendentes = 
    (dbStore.loanRequests || []).filter(r => r.status === "Pendente").length +
    (dbStore.depositRequests || []).filter(r => r.status === "Pendente").length +
    (dbStore.membershipRequests || []).filter(r => r.status === "Pendente").length;

  // --- CÁLCULO MASTER SYNC (IGUAL AO ADMIN) ---
  let globalCaixa = 0;
  Object.values(dbStore.userDetails || {}).forEach((ud: any) => {
    globalCaixa += ud.emCaixa || 0;
  });

  let globalNaRua = 0;
  let jurosProjectados = 0;
  let activeContracts = 0;
  (dbStore.loans || []).forEach((l: any) => {
    if (l.status === "Aprovado" || l.status === "Ativo" || l.status === "Atrasado" || l.status === "Auditoria" || l.status === "Em Processo") {
      globalNaRua += l.valor_original || 0;
      const status = calcularStatusEmprestimo(l.valor_original, l.data_inicio);
      jurosProjectados += status.juro;
      activeContracts++;
    }
  });

  const globalLucro = (dbStore.dashboard?.lucros || 0) + jurosProjectados;
  const patrimonyGlobal = globalCaixa + globalNaRua + jurosProjectados;
    
  return {
    data: {
      ...dbStore.dashboard,
      caixa: globalCaixa,
      lucros: globalLucro,
      naRua: globalNaRua,
      total: patrimonyGlobal,
      membros_ativos: (dbStore.users || []).filter(u => u.status === "Ativo").length,
      emprestimos_ativos: activeContracts,
      contasNoVermelho: globalNaRua,
      contagemContratos: activeContracts,
      patrimonyGlobal,
      solicitacoes_pendentes: pendentes
    },
    isLoading: false,
    isError: false,
  };
}
