import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, loansTable, traceabilityTable, loanRequestsTable, depositRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { alocarCapital, addAuditEntry } from "../lib/capitalEngine.js";

const router = Router();

router.get("/loan", async (_req, res) => {
  const reqs = await db.select().from(loanRequestsTable);
  const result = [];
  for (const r of reqs) {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, r.user_id) });
    result.push({ ...r, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
  }
  res.json(result);
});

router.post("/loan", async (req, res) => {
  const { user_id, valor, motivo } = req.body;
  const id = `lr_${randomUUID().slice(0, 8)}`;
  const [created] = await db.insert(loanRequestsTable).values({
    id, user_id, valor, motivo, status: "Pendente", ts: Date.now(),
  }).returning();
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, user_id) });
  res.status(201).json({ ...created, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
});

router.post("/loan/:requestId/approve", async (req, res) => {
  const { requestId } = req.params;
  const loanReq = await db.query.loanRequestsTable.findFirst({
    where: eq(loanRequestsTable.id, requestId)
  });
  if (!loanReq) return res.status(404).json({ error: "Request not found" });
  if (loanReq.status !== "Pendente") return res.status(400).json({ error: "Request already processed" });

  const membrosAtivos = await db.select().from(usersTable).where(eq(usersTable.status, "Ativo"));
  const membrosComSaldo = membrosAtivos.filter(m => m.saldo_base > 0 && m.id !== loanReq.user_id);

  const totalDisponivel = membrosComSaldo.reduce((s, m) => s + m.saldo_base, 0);
  if (totalDisponivel < loanReq.valor) {
    return res.status(400).json({ error: "Saldo insuficiente no cofre para este empréstimo" });
  }

  const contribuicoes = alocarCapital(loanReq.valor, membrosComSaldo);

  for (const c of contribuicoes) {
    const membro = membrosComSaldo.find(m => m.id === c.owner_id);
    if (membro) {
      await db.update(usersTable).set({
        saldo_base: membro.saldo_base - c.valor_contribuido,
      }).where(eq(usersTable.id, c.owner_id));
    }
  }

  const loanId = `l_${randomUUID().slice(0, 8)}`;
  const [loan] = await db.insert(loansTable).values({
    id: loanId,
    user_id: loanReq.user_id,
    valor_original: loanReq.valor,
    data_inicio: Date.now(),
    taxa_atual: 10,
    status: "Ativo",
    valor_pago: 0,
  }).returning();

  for (const c of contribuicoes) {
    await db.insert(traceabilityTable).values({
      id: `t_${randomUUID().slice(0, 8)}`,
      loan_id: loanId,
      owner_id: c.owner_id,
      valor_contribuido: c.valor_contribuido,
    });
  }

  await db.update(loanRequestsTable).set({ status: "Aprovado" }).where(eq(loanRequestsTable.id, requestId));

  const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, loanReq.user_id) });
  const contribDesc = contribuicoes.map(c => {
    const m = membrosComSaldo.find(x => x.id === c.owner_id);
    return `${m?.nome || c.owner_id}: ${(c.valor_contribuido / 100).toFixed(2)} MT`;
  }).join(", ");

  await addAuditEntry(
    "EMPRESTIMO",
    `${tomador?.nome || loanReq.user_id} recebeu ${(loanReq.valor / 100).toFixed(2)} MT. Alocação: ${contribDesc}`,
    loanReq.valor,
    loanReq.user_id
  );

  const { getEnrichedLoan } = await import("../lib/capitalEngine.js");
  const detail = await getEnrichedLoan(loanId);
  return res.json(detail);
});

router.post("/loan/:requestId/reject", async (req, res) => {
  const { requestId } = req.params;
  const [updated] = await db.update(loanRequestsTable).set({ status: "Rejeitado" })
    .where(eq(loanRequestsTable.id, requestId)).returning();
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.user_id) });
  res.json({ ...updated, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
});

router.get("/deposit", async (_req, res) => {
  const reqs = await db.select().from(depositRequestsTable);
  const result = [];
  for (const r of reqs) {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, r.user_id) });
    result.push({ ...r, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
  }
  res.json(result);
});

router.post("/deposit", async (req, res) => {
  const { user_id, valor } = req.body;
  const id = `dr_${randomUUID().slice(0, 8)}`;
  const [created] = await db.insert(depositRequestsTable).values({
    id, user_id, valor, status: "Pendente", ts: Date.now(),
  }).returning();
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, user_id) });
  res.status(201).json({ ...created, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
});

router.post("/deposit/:requestId/approve", async (req, res) => {
  const { requestId } = req.params;
  const depReq = await db.query.depositRequestsTable.findFirst({
    where: eq(depositRequestsTable.id, requestId)
  });
  if (!depReq) return res.status(404).json({ error: "Request not found" });
  if (depReq.status !== "Pendente") return res.status(400).json({ error: "Already processed" });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, depReq.user_id) });
  if (user) {
    await db.update(usersTable).set({
      saldo_base: user.saldo_base + depReq.valor,
    }).where(eq(usersTable.id, depReq.user_id));
  }

  const [updated] = await db.update(depositRequestsTable).set({ status: "Aprovado" })
    .where(eq(depositRequestsTable.id, requestId)).returning();

  await addAuditEntry(
    "DEPOSITO",
    `${user?.nome || depReq.user_id} depositou ${(depReq.valor / 100).toFixed(2)} MT no cofre`,
    depReq.valor,
    depReq.user_id
  );

  return res.json({ ...updated, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
});

router.post("/deposit/:requestId/reject", async (req, res) => {
  const { requestId } = req.params;
  const [updated] = await db.update(depositRequestsTable).set({ status: "Rejeitado" })
    .where(eq(depositRequestsTable.id, requestId)).returning();
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.user_id) });
  return res.json({ ...updated, user_nome: user?.nome || "—", user_foto: user?.foto || "??" });
});

export default router;
