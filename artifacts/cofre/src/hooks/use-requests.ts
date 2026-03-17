import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLoanRequests,
  useListDepositRequests,
  useCreateLoanRequest as useGenCreateLoanReq,
  useCreateDepositRequest as useGenCreateDepReq,
  useApproveLoanRequest as useGenApproveLoanReq,
  useRejectLoanRequest as useGenRejectLoanReq,
  useApproveDepositRequest as useGenApproveDepReq,
  useRejectDepositRequest as useGenRejectDepReq
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useRequests() {
  const loans = useListLoanRequests();
  const deposits = useListDepositRequests();
  
  return {
    loans: loans.data || [],
    deposits: deposits.data || [],
    isLoading: loans.isLoading || deposits.isLoading,
    isError: loans.isError || deposits.isError
  };
}

export function useCreateLoanRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenCreateLoanReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] });
        toast({ title: "Solicitação criada", description: "O pedido de empréstimo foi registado com sucesso." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao criar solicitação.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    }
  });
}

export function useApproveLoanRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenApproveLoanReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] });
        queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audit'] });
        toast({
          title: "Empréstimo aprovado",
          description: "O capital foi alocado automaticamente conforme o algoritmo do cofre.",
        });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao aprovar empréstimo.";
        toast({ title: "Não foi possível aprovar", description: msg, variant: "destructive" });
      }
    }
  });
}

export function useRejectLoanRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenRejectLoanReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] });
        toast({ title: "Solicitação rejeitada", description: "O pedido de empréstimo foi rejeitado." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao rejeitar.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    }
  });
}

export function useCreateDepositRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenCreateDepReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] });
        toast({ title: "Aporte registado", description: "O pedido de aporte foi submetido para aprovação." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao criar pedido de aporte.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    }
  });
}

export function useApproveDepositRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenApproveDepReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audit'] });
        toast({ title: "Aporte aprovado", description: "O saldo do membro foi actualizado no cofre." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao aprovar aporte.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    }
  });
}

export function useRejectDepositRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useGenRejectDepReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] });
        toast({ title: "Aporte rejeitado", description: "O pedido de aporte foi rejeitado." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Erro ao rejeitar.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    }
  });
}
