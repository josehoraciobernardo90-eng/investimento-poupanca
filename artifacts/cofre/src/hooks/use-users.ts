import { useQueryClient } from "@tanstack/react-query";
import { 
  useListUsers, 
  useGetUser, 
  useCreateUser as useGeneratedCreateUser,
  useUpdateUser as useGeneratedUpdateUser
} from "@workspace/api-client-react";
import type { CreateUserBody, UpdateUserBody } from "@workspace/api-client-react/src/generated/api.schemas";

export function useUsers() {
  return useListUsers();
}

export function useUser(id: string) {
  return useGetUser(id);
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useGeneratedCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateUser({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${variables.userId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    }
  });
}
