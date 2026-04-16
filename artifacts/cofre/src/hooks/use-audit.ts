import { useState } from "react";
import { ref, update, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { dbStore } from "@/data/firebase-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

// Hook para BUSCAR os logs de auditoria
export function useAudit() {
  useMockDataSync();
  const rawAudit = dbStore.audit || {};
  const auditArray = Object.values(rawAudit).sort((a: any, b: any) => b.ts - a.ts);
  
  return {
    data: auditArray,
    isLoading: false,
    isError: false
  };
}

// Hook para EXECUTAR a auditoria fiscal (Blindado)
export function useSystemAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // 1. Puxar dados com segurança
      const [usersSnap, loansSnap, dashboardSnap] = await Promise.all([
        get(ref(rtdb, "userDetails")),
        get(ref(rtdb, "loans")),
        get(ref(rtdb, "dashboard"))
      ]);

      const users = usersSnap.exists() ? usersSnap.val() : {};
      const loans = loansSnap.exists() ? loansSnap.val() : {};
      const dashboard = dashboardSnap.exists() ? dashboardSnap.val() : { caixa: 0, naRua: 0, total: 0, membros_ativos: 0, emprestimos_ativos: 0 };

      let realCaixa = 0;
      let realNaRua = 0;
      let realMembros = 0;
      let realLoansAtivos = 0;

      // 2. Loop Seguro pelos Membros
      Object.keys(users).forEach(uid => {
        if (users[uid]) {
          realCaixa += (users[uid].emCaixa || 0);
          realMembros++;
        }
      });

      // 3. Loop Seguro pelos Empréstimos
      Object.keys(loans).forEach(lid => {
        if (loans[lid] && loans[lid].status === "Ativo") {
          realNaRua += (loans[lid].total_devido || 0);
          realLoansAtivos++;
        }
      });

      const totalHistorico = realCaixa + realNaRua;

      // 4. Cálculo de Divergência com proteção contra Nulos
      const dashCaixa = dashboard.caixa || 0;
      const dashNaRua = dashboard.naRua || 0;

      const diffCaixa = realCaixa - dashCaixa;
      const diffNaRua = realNaRua - dashNaRua;

      // 5. Sincronização se houver diferença (Mesmo que seja de 1 centavo)
      if (Math.abs(diffCaixa) > 0.01 || Math.abs(diffNaRua) > 0.01) {
        const updates: any = {};
        updates["dashboard/caixa"] = realCaixa;
        updates["dashboard/naRua"] = realNaRua;
        updates["dashboard/total"] = totalHistorico;
        updates["dashboard/membros_ativos"] = realMembros;
        updates["dashboard/emprestimos_ativos"] = realLoansAtivos;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "AUDITORIA",
          desc: "AUDITORIA DE ELITE: Divergências corrigidas. O sistema agora está síncrono.",
          valor: totalHistorico,
          user: "Sistema (Auto)"
        };

        await update(ref(rtdb), updates);
        toast({ title: "Auditoria Concluída", description: "Valores do painel foram corrigidos conforme a realidade." });
      } else {
        toast({ title: "Sistema Íntegro", description: "Auditória finalizada. Não foram encontradas falhas nos cálculos." });
      }

      return { membros: realMembros, emprestimos: realLoansAtivos, total: totalHistorico };
    } catch (err) {
      console.error("[runAudit] Falha Crítica:", err);
      toast({ title: "Erro na Auditoria", description: "Falha ao conectar com o banco de dados principal.", variant: "destructive" });
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  return { runAudit, isAuditing };
}
