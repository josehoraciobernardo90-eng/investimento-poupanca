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

// Hook para EXECUTAR a auditoria fiscal profunda
export function useSystemAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // 1. Puxar todos os dados brutos da Cloud
      const [usersSnap, loansSnap, dashboardSnap] = await Promise.all([
        get(ref(rtdb, "userDetails")),
        get(ref(rtdb, "loans")),
        get(ref(rtdb, "dashboard"))
      ]);

      const users = usersSnap.exists() ? usersSnap.val() : {};
      const loans = loansSnap.exists() ? loansSnap.val() : {};
      const dashboard = dashboardSnap.exists() ? dashboardSnap.val() : { caixa: 0, naRua: 0, total: 0, lucros: 0 };

      let realGlobalCaixa = 0;
      let realGlobalNaRua = 0;
      let realMembrosCount = 0;
      let realLoansCount = 0;

      const updates: any = {};
      let correctionsCount = 0;

      // 2. Auditoria Individual de Membros (Deep Scan)
      Object.keys(users).forEach(uid => {
        const u = users[uid];
        if (u) {
          realMembrosCount++;
          const emCaixa = u.emCaixa || 0;
          
          // Recalcular o que o membro tem em circulação baseado nos empréstimos ativos
          const emCirculacao = u.emCirculacao || [];
          let totalCirculacaoCalculado = 0;
          let totalJurosCalculado = 0;

          emCirculacao.forEach((item: any) => {
            if (item.status === "Ativo") {
              totalCirculacaoCalculado += (item.valor_contribuido || 0);
              totalJurosCalculado += (item.juro_esperado || 0);
            }
          });

          const patrimonioCalculado = emCaixa + totalCirculacaoCalculado + totalJurosCalculado;
          
          // Verificar se o patrimônio está correto no banco
          if (Math.abs(u.patrimonioTotal - patrimonioCalculado) > 0.01) {
             updates[`userDetails/${uid}/totalEmCirculacao`] = totalCirculacaoCalculado;
             updates[`userDetails/${uid}/totalJuroEsperado`] = totalJurosCalculado;
             updates[`userDetails/${uid}/patrimonioTotal`] = patrimonioCalculado;
             correctionsCount++;
          }

          realGlobalCaixa += emCaixa;
        }
      });

      // 3. Auditoria de Empréstimos Ativos
      Object.keys(loans).forEach(lid => {
        const l = loans[lid];
        if (l && l.status === "Ativo") {
          realLoansCount++;
          realGlobalNaRua += (l.valor_original || 0); // O valor em rua é a BASE original
        }
      });

      // 4. Sincronização Global do Painel
      const totalSistema = realGlobalCaixa + realGlobalNaRua;
      
      const diffCaixa = Math.abs(realGlobalCaixa - (dashboard.caixa || 0));
      const diffNaRua = Math.abs(realGlobalNaRua - (dashboard.naRua || 0));

      if (diffCaixa > 0.1 || diffNaRua > 0.1 || correctionsCount > 0) {
        updates["dashboard/caixa"] = realGlobalCaixa;
        updates["dashboard/naRua"] = realGlobalNaRua;
        updates["dashboard/total"] = totalSistema;
        updates["dashboard/membros_ativos"] = realMembrosCount;
        updates["dashboard/emprestimos_ativos"] = realLoansCount;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "AUDITORIA",
          desc: `AUDITORIA FISCAL: ${correctionsCount} perfis de membros corrigidos e painel global sincronizado. Integridade de 100% restaurada.`,
          valor: totalSistema,
          user: "Gogoma (Sentinela)"
        };

        await update(ref(rtdb), updates);
        toast({ title: "Auditoria Finalizada", description: "O sistema foi sincronizado e inconsistências individuais foram corrigidas." });
      } else {
        toast({ title: "Integridade de 100%", description: "O sistema está perfeitamente alinhado com a realidade financeira." });
      }

      return { global: totalSistema, correcoes: correctionsCount };
    } catch (err) {
      console.error("[Sentinela Audit] Erro:", err);
      toast({ title: "Erro na Auditoria", description: "Não foi possível verificar a integridade da Cloud.", variant: "destructive" });
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  return { runAudit, isAuditing };
}
