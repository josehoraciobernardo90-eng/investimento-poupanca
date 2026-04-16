import { useState } from "react";
import { ref, update, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useSystemAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // 1. Puxar todos os dados brutos do Firebase (Real e nada fictício)
      const usersSnap = await get(ref(rtdb, "userDetails"));
      const loansSnap = await get(ref(rtdb, "loans"));
      const dashboardSnap = await get(ref(rtdb, "dashboard"));

      if (!usersSnap.exists()) throw new Error("Falha ao ler usuários.");

      const users = usersSnap.val();
      const loans = loansSnap.exists() ? loansSnap.val() : {};
      const dashboard = dashboardSnap.val();

      let realCaixa = 0;
      let realNaRua = 0;
      let realMembros = 0;
      let realLoansAtivos = 0;

      // 2. Somar saldos reais de todos os membros
      Object.keys(users).forEach(uid => {
        realCaixa += users[uid].emCaixa || 0;
        realMembros++;
      });

      // 3. Somar dívidas reais na rua
      Object.keys(loans).forEach(lid => {
        if (loans[lid].status === "Ativo") {
          realNaRua += loans[lid].total_devido || 0;
          realLoansAtivos++;
        }
      });

      const totalHistorico = realCaixa + realNaRua;

      // 4. Verificar divergências
      const diffCaixa = realCaixa - dashboard.caixa;
      const diffNaRua = realNaRua - dashboard.naRua;

      if (Math.abs(diffCaixa) > 0 || Math.abs(diffNaRua) > 0) {
        console.warn(`[AUDITORIA] Divergência detectada! Caixa: ${diffCaixa}, NaRua: ${diffNaRua}`);
        
        // 5. CORREÇÃO REAL: Sincronizar painel com a realidade dos membros
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
          desc: `AUDITORIA REALIZADA: Sincronização forçada aplicada. Membros: ${realMembros}, Ativos: ${realLoansAtivos}.`,
          valor: totalHistorico,
          user: "Sistema (Auto)"
        };

        await update(ref(rtdb), updates);
        
        toast({ 
          title: "Auditoria: Erros Corrigidos", 
          description: `Foram detectadas e corrigidas divergências nos totais. O sistema agora reflete 100% da realidade.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "Sistema Íntegro", 
          description: "A auditoria confirmou que todos os saldos e dívidas batem 100% com o painel central.",
          variant: "default"
        });
      }

      return {
        membros: realMembros,
        emprestimos: realLoansAtivos,
        total: totalHistorico,
        integridade: 100
      };

    } catch (err) {
      console.error("[runAudit] Erro Crítico:", err);
      toast({ title: "Erro na Auditoria", description: "Não foi possível validar os dados do Firebase.", variant: "destructive" });
      return null; // Garante que a função sempre retorna algo, mesmo em caso de erro
    } finally {
      setIsAuditing(false);
    }
  };

  return { runAudit, isAuditing };
}
