import { useState } from "react";
import { ref, update, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { dbStore } from "@/data/firebase-data";
import { useMockDataSync } from "@/hooks/use-mock-store";

// ─── Hook para BUSCAR os logs de auditoria ───
export function useAudit() {
  useMockDataSync();

  // dbStore.audit pode ser array OU objecto vazio — normalizar
  const raw = dbStore.audit;
  let auditArray: any[] = [];
  if (Array.isArray(raw)) {
    auditArray = [...raw];
  } else if (raw && typeof raw === "object") {
    auditArray = Object.values(raw);
  }

  auditArray.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));

  return {
    data: auditArray,
    isLoading: false,
    isError: false,
  };
}

// ─── Hook para EXECUTAR a auditoria fiscal profunda ───
export function useSystemAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // 1. Puxar dados da Cloud em paralelo
      const [usersSnap, loansSnap, dashboardSnap] = await Promise.all([
        get(ref(rtdb, "userDetails")),
        get(ref(rtdb, "loans")),
        get(ref(rtdb, "dashboard")),
      ]);

      const users = usersSnap.exists() && usersSnap.val() ? usersSnap.val() : {};
      const loans = loansSnap.exists() && loansSnap.val() ? loansSnap.val() : {};
      const dashboard = dashboardSnap.exists() && dashboardSnap.val()
        ? dashboardSnap.val()
        : { caixa: 0, naRua: 0, total: 0, lucros: 0 };

      let realGlobalCaixa = 0;
      let realGlobalNaRua  = 0;
      let realMembrosCount = 0;
      let realLoansCount   = 0;

      const updates: Record<string, any> = {};
      let correctionsCount = 0;

      // 2. Deep Scan de cada membro
      const userKeys = users && typeof users === "object" ? Object.keys(users) : [];
      for (const uid of userKeys) {
        const u = users[uid];
        if (!u || typeof u !== "object") continue;

        realMembrosCount++;
        const emCaixa = Number(u.emCaixa) || 0;

        // Recalcular circulação e juros a partir dos traces de empréstimos activos
        const emCirculacao: any[] = Array.isArray(u.emCirculacao)
          ? u.emCirculacao
          : u.emCirculacao && typeof u.emCirculacao === "object"
            ? Object.values(u.emCirculacao)
            : [];

        let totalCirculacaoCalculado = 0;
        let totalJurosCalculado = 0;

        for (const item of emCirculacao) {
          if (item && item.status === "Ativo") {
            totalCirculacaoCalculado += Number(item.valor_contribuido) || 0;
            totalJurosCalculado      += Number(item.juro_esperado)     || 0;
          }
        }

        const patrimonioCalculado = emCaixa + totalCirculacaoCalculado + totalJurosCalculado;
        const patrimonioActual    = Number(u.patrimonioTotal) || 0;

        if (Math.abs(patrimonioActual - patrimonioCalculado) > 1) {
          updates[`userDetails/${uid}/totalEmCirculacao`] = totalCirculacaoCalculado;
          updates[`userDetails/${uid}/totalJuroEsperado`] = totalJurosCalculado;
          updates[`userDetails/${uid}/patrimonioTotal`]   = patrimonioCalculado;
          correctionsCount++;
        }

        realGlobalCaixa += emCaixa;
      }

      // 3. Auditoria de Empréstimos
      const loanKeys = loans && typeof loans === "object" ? Object.keys(loans) : [];
      for (const lid of loanKeys) {
        const l = loans[lid];
        if (l && l.status === "Ativo") {
          realLoansCount++;
          realGlobalNaRua += Number(l.valor_original) || 0;
        }
      }

      // 4. Sincronização Global
      const totalSistema = realGlobalCaixa + realGlobalNaRua;
      const diffCaixa    = Math.abs(realGlobalCaixa - (Number(dashboard.caixa) || 0));
      const diffNaRua    = Math.abs(realGlobalNaRua  - (Number(dashboard.naRua)  || 0));

      if (diffCaixa > 1 || diffNaRua > 1 || correctionsCount > 0) {
        updates["dashboard/caixa"]             = realGlobalCaixa;
        updates["dashboard/naRua"]             = realGlobalNaRua;
        updates["dashboard/total"]             = totalSistema;
        updates["dashboard/membros_ativos"]    = realMembrosCount;
        updates["dashboard/emprestimos_ativos"]= realLoansCount;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id:    auditId,
          ts:    Math.floor(Date.now() / 1000),
          tipo:  "AUDITORIA",
          desc:  `SENTINELA FISCAL: ${correctionsCount} perfil(s) corrigido(s). Painel global sincronizado. Integridade restaurada a 100%.`,
          valor: totalSistema,
          user:  "Gogoma (Sentinela)",
        };

        await update(ref(rtdb), updates);
        toast({
          title: "✅ Auditoria Concluída",
          description: `${correctionsCount} correcção(ões) aplicada(s). Sistema 100% íntegro.`,
        });
      } else {
        toast({
          title: "✅ Integridade de 100%",
          description: "Sistema perfeitamente alinhado com a realidade financeira.",
        });
      }

      return { global: totalSistema, correcoes: correctionsCount };
    } catch (err: any) {
      console.error("[Sentinela Audit] Erro:", err);
      toast({
        title: "Erro na Auditoria",
        description: err?.message || "Não foi possível verificar a integridade da Cloud.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  return { runAudit, isAuditing };
}
