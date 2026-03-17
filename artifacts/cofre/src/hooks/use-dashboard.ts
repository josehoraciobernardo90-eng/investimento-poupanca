import { useQueryClient } from "@tanstack/react-query";
import { useGetDashboard } from "@workspace/api-client-react";

export function useDashboard() {
  return useGetDashboard();
}
