import { dbStore } from "@/data/firebase-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

export function useAudit() {
  useMockDataSync();
  return {
    data: dbStore.audit,
    isLoading: false,
    isError: false,
  };
}
