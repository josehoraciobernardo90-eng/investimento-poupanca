import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, loansTable, loanRequestsTable, depositRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { calcTaxaAtual, calcJuros } from "../lib/capitalEngine.js";

const router = Router();

router.get("/", async (_req, res) => {
  const users = await db.select().from(usersTable);
  const loans = await db.select().from(loansTable);
  const loanReqs = await db.select().from(loanRequestsTable).where(eq(loanRequestsTable.status, "Pendente"));
  const depReqs = await db.select().from(depositRequestsTable).where(eq(depositRequestsTable.status, "Pendente"));

  const caixa = users.reduce((s, u) => s + u.saldo_base, 0);
  const lucros = users.reduce((s, u) => s + u.lucro_acumulado, 0);
  const activeLoans = loans.filter(l => ["Ativo", "Atrasado"].includes(l.status));
  const naRua = activeLoans.reduce((s, l) => {
    const taxa = calcTaxaAtual(l.data_inicio);
    const { totalDevido } = calcJuros(l.valor_original, taxa);
    return s + totalDevido;
  }, 0);

  res.json({
    caixa,
    lucros,
    naRua,
    total: caixa + lucros + naRua,
    membros_ativos: users.filter(u => u.status === "Ativo").length,
    emprestimos_ativos: activeLoans.length,
    solicitacoes_pendentes: loanReqs.length + depReqs.length,
  });
});

export default router;
