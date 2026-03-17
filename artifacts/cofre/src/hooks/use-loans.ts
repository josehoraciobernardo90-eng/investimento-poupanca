import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLoans, 
  useGetLoan,
  useUpdateLoan as useGeneratedUpdateLoan,
  useLiquidateLoan as useGeneratedLiquidateLoan
} from "@workspace/api-client-react";

export function useLoans() {
  return useListLoans();
}

export function useLoan(id: string) {
  return useGetLoan(id);
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateLoan({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
        queryClient.invalidateQueries({ queryKey: [`/api/loans/${variables.loanId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useLiquidateLoan() {
  const queryClient = useQueryClient();
  return useGeneratedLiquidateLoan({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
        queryClient.invalidateQueries({ queryKey: [`/api/loans/${variables.loanId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}
