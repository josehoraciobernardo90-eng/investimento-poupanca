import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, loansTable, traceabilityTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { calcTaxaAtual, calcJuros, getEnrichedLoan, distribuirJuro, addAuditEntry } from "../lib/capitalEngine.js";

const router = Router();

router.get("/", async (_req, res) => {
  const loans = await db.select().from(loansTable);
  const result = [];

  for (const loan of loans) {
    const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, loan.user_id) });
    const taxa = calcTaxaAtual(loan.data_inicio);
    const { juroTotal, totalDevido } = calcJuros(loan.valor_original, taxa);
    const dias = Math.floor((Date.now() - loan.data_inicio) / 86400000);
    result.push({
      ...loan,
      tomador_nome: tomador?.nome || "—",
      tomador_foto: tomador?.foto || "??",
      taxa_atual: taxa,
      dias,
      juro_total: juroTotal,
      total_devido: totalDevido,
    });
  }

  res.json(result);
});

router.get("/:loanId", async (req, res) => {
  const detail = await getEnrichedLoan(req.params.loanId);
  if (!detail) return res.status(404).json({ error: "Loan not found" });
  return res.json(detail);
});

router.patch("/:loanId", async (req, res) => {
  const { loanId } = req.params;
  const { status, valor_pago } = req.body;
  const updates: any = {};
  if (status !== undefined) updates.status = status;
  if (valor_pago !== undefined) updates.valor_pago = valor_pago;

  const [updated] = await db.update(loansTable).set(updates).where(eq(loansTable.id, loanId)).returning();
  const taxa = calcTaxaAtual(updated.data_inicio);
  const { juroTotal, totalDevido } = calcJuros(updated.valor_original, taxa);
  const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.user_id) });

  res.json({
    ...updated,
    tomador_nome: tomador?.nome || "—",
    tomador_foto: tomador?.foto || "??",
    taxa_atual: taxa,
    dias: Math.floor((Date.now() - updated.data_inicio) / 86400000),
    juro_total: juroTotal,
    total_devido: totalDevido,
  });
});

router.post("/:loanId/liquidate", async (req, res) => {
  const { loanId } = req.params;
  const { valor_pago } = req.body;

  const loan = await db.query.loansTable.findFirst({ where: eq(loansTable.id, loanId) });
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  const taxa = calcTaxaAtual(loan.data_inicio);
  const { juroTotal } = calcJuros(loan.valor_original, taxa);
  const juroTomador = Math.round(juroTotal * 0.5);
  const juroPool = juroTotal - juroTomador;

  const traces = await db.select().from(traceabilityTable).where(eq(traceabilityTable.loan_id, loanId));
  const distribuicao = distribuirJuro(juroPool, traces);

  for (const d of distribuicao) {
    const owner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, d.owner_id) });
    if (owner) {
      await db.update(usersTable).set({
        saldo_base: owner.saldo_base + d.total,
        lucro_acumulado: owner.lucro_acumulado + d.juro,
      }).where(eq(usersTable.id, d.owner_id));
    }
  }

  const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, loan.user_id) });
  if (tomador) {
    await db.update(usersTable).set({
      lucro_acumulado: tomador.lucro_acumulado + juroTomador,
    }).where(eq(usersTable.id, loan.user_id));
  }

  const [updatedLoan] = await db.update(loansTable).set({
    status: "Liquidado",
    valor_pago: valor_pago,
  }).where(eq(loansTable.id, loanId)).returning();

  const ownerIds = [...new Set(distribuicao.map(d => d.owner_id))];
  const owners = ownerIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];

  const enrichedDistrib = distribuicao.map(d => ({
    ...d,
    owner_nome: owners.find(o => o.id === d.owner_id)?.nome || "—",
    owner_foto: owners.find(o => o.id === d.owner_id)?.foto || "??",
  }));

  const totalDevido = loan.valor_original + juroTotal;
  await addAuditEntry(
    "LIQUIDACAO",
    `${tomador?.nome || loan.user_id} liquidou empréstimo de ${(loan.valor_original / 100).toFixed(2)} MT. Juro distribuído: ${(juroPool / 100).toFixed(2)} MT`,
    valor_pago,
    loan.user_id
  );

  return res.json({
    loan: {
      ...updatedLoan,
      tomador_nome: tomador?.nome || "—",
      tomador_foto: tomador?.foto || "??",
      taxa_atual: taxa,
      dias: Math.floor((Date.now() - updatedLoan.data_inicio) / 86400000),
      juro_total: juroTotal,
      total_devido: totalDevido,
    },
    distribuicao: enrichedDistrib,
    juroPool,
    juroTomador,
  });
});

export default router;
