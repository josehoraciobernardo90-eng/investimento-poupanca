import { mockAudit } from "@/data/mock-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

export function useAudit() {
  useMockDataSync();
  return {
    data: mockAudit,
    isLoading: false,
    isError: false,
  };
}
