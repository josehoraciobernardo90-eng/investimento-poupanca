import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, traceabilityTable, loansTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { calcJuros, calcTaxaAtual, distribuirJuro, addAuditEntry } from "../lib/capitalEngine.js";

const router = Router();

router.get("/", async (_req, res) => {
  const users = await db.select().from(usersTable);
  res.json(users);
});

router.post("/", async (req, res) => {
  const { nome, foto, status, saldo_base } = req.body;
  const id = `u_${randomUUID().slice(0, 8)}`;
  const [user] = await db.insert(usersTable).values({
    id, nome, foto: foto || nome.slice(0, 2).toUpperCase(),
    status: status || "Ativo",
    saldo_base: saldo_base || 0,
    lucro_acumulado: 0,
  }).returning();
  await addAuditEntry("NOVO_MEMBRO", `${nome} foi adicionado como membro`, saldo_base || 0, id);
  res.status(201).json(user);
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) return res.status(404).json({ error: "User not found" });

  const emCaixa = user.saldo_base;

  const traces = await db.select().from(traceabilityTable).where(eq(traceabilityTable.owner_id, userId));
  const activeLoanIds = [...new Set(traces.map(t => t.loan_id))];

  let emCirculacao: any[] = [];

  if (activeLoanIds.length > 0) {
    const activeLoans = await db.select().from(loansTable)
      .where(inArray(loansTable.id, activeLoanIds));

    const activeLoanFiltered = activeLoans.filter(l => ["Ativo", "Atrasado"].includes(l.status));

    for (const loan of activeLoanFiltered) {
      const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, loan.user_id) });
      const allTraces = await db.select().from(traceabilityTable).where(eq(traceabilityTable.loan_id, loan.id));
      const taxa = calcTaxaAtual(loan.data_inicio);
      const { juroTotal } = calcJuros(loan.valor_original, taxa);
      const jPool = juroTotal - Math.round(juroTotal * 0.5);
      const distrib = distribuirJuro(jPool, allTraces);
      const minha = distrib.find(d => d.owner_id === userId);
      const meuJuro = minha ? minha.juro : 0;
      const myTrace = traces.find(t => t.loan_id === loan.id);
      const totalContrib = allTraces.reduce((s, x) => s + x.valor_contribuido, 0);
      const dias = Math.floor((Date.now() - loan.data_inicio) / 86400000);

      emCirculacao.push({
        loan_id: loan.id,
        tomador_id: loan.user_id,
        tomador_nome: tomador?.nome || "—",
        tomador_foto: tomador?.foto || "??",
        valor_contribuido: myTrace?.valor_contribuido || 0,
        pctDoEmprestimo: totalContrib > 0 ? ((myTrace?.valor_contribuido || 0) / totalContrib * 100) : 0,
        taxa_atual: taxa,
        dias,
        data_inicio: loan.data_inicio,
        status: loan.status,
        juro_esperado: meuJuro,
        total_esperado: (myTrace?.valor_contribuido || 0) + meuJuro,
      });
    }
  }

  const totalEmCirculacao = emCirculacao.reduce((s, x) => s + x.valor_contribuido, 0);
  const totalJuroEsperado = emCirculacao.reduce((s, x) => s + x.juro_esperado, 0);
  const patrimonioTotal = emCaixa + totalEmCirculacao + totalJuroEsperado + user.lucro_acumulado;

  return res.json({ user, emCaixa, emCirculacao, totalEmCirculacao, totalJuroEsperado, patrimonioTotal });
});

router.patch("/:userId", async (req, res) => {
  const { userId } = req.params;
  const { nome, status, saldo_base } = req.body;
  const updates: any = {};
  if (nome !== undefined) updates.nome = nome;
  if (status !== undefined) updates.status = status;
  if (saldo_base !== undefined) updates.saldo_base = saldo_base;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  res.json(updated);
});

export default router;
