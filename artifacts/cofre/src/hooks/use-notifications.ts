import { useMember } from "@/hooks/use-member";
import { dbStore, storeEmitter } from "@/data/firebase-data";
import { useState, useEffect, useMemo } from "react";
import { formatDateTime } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  ts: number;
  read: boolean;
  deletionReqId?: string;
  details?: any;
}

export function useNotifications() {
  const { memberUser } = useMember();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    storeEmitter.addEventListener("change", handler);
    return () => storeEmitter.removeEventListener("change", handler);
  }, []);

  const notifications = useMemo(() => {
    if (!memberUser) return [];

    const list: Notification[] = [];

    // 1. From Audit Logs (General events)
    dbStore.audit.forEach(a => {
      // If the audit description mentions the member's name, it's relevant
      if (a.user === memberUser.nome || a.desc.includes(memberUser.nome)) {
        list.push({
          id: a.id,
          type: a.tipo === "LIQUIDACAO" ? "success" : "info",
          title: a.tipo,
          message: a.desc,
          ts: a.ts,
          read: false
        });
      }
    });

    // 2. From Loan Requests (Status changes)
    dbStore.loanRequests.forEach(r => {
      if (r.user_id === memberUser.id) {
        list.push({
          id: `lr-${r.id}-${r.status}`,
          type: r.status === "Aprovado" ? "success" : r.status === "Rejeitado" ? "error" : "warning",
          title: `Empréstimo ${r.status}`,
          message: `O seu pedido de ${r.valor / 100} MTn está ${r.status.toLowerCase()}.`,
          ts: r.ts,
          read: false
        });
      }
    });

    // 3. From Deposit Requests
    dbStore.depositRequests.forEach(r => {
      if (r.user_id === memberUser.id) {
        list.push({
          id: `dr-${r.id}-${r.status}`,
          type: r.status === "Aprovado" ? "success" : r.status === "Rejeitado" ? "error" : "warning",
          title: `Aporte ${r.status}`,
          message: `O seu pedido de aporte de ${r.valor / 100} MTn está ${r.status.toLowerCase()}.`,
          ts: r.ts,
          read: false
        });
      }
    });

    // 4. From Deletion Requests (New!)
    dbStore.deletionRequests.forEach(r => {
      if (r.user_id === memberUser.id && r.status === "Pendente") {
        list.push({
          id: `del-${r.id}`,
          type: "warning",
          title: "Exclusão Pendente",
          message: `O Administrador solicitou a exclusão de um registro de ${r.details.valor / 100} MTn de ${formatDateTime(r.details.ts)}. Precisa do seu testemunho.`,
          ts: r.ts,
          read: false,
          deletionReqId: r.id,
          details: r.details
        });
      }
    });

    return list.sort((a, b) => b.ts - a.ts).slice(0, 20); // Last 20
  }, [memberUser, version]);

  return { notifications };
}
