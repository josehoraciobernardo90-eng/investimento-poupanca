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
  return useGenCreateLoanReq({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] })
    }
  });
}

export function useApproveLoanRequest() {
  const queryClient = useQueryClient();
  return useGenApproveLoanReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] });
        queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useRejectLoanRequest() {
  const queryClient = useQueryClient();
  return useGenRejectLoanReq({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/requests/loan'] })
    }
  });
}

export function useCreateDepositRequest() {
  const queryClient = useQueryClient();
  return useGenCreateDepReq({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] })
    }
  });
}

export function useApproveDepositRequest() {
  const queryClient = useQueryClient();
  return useGenApproveDepReq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useRejectDepositRequest() {
  const queryClient = useQueryClient();
  return useGenRejectDepReq({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/requests/deposit'] })
    }
  });
}
