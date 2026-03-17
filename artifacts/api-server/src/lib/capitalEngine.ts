import { db } from "@workspace/db";
import { usersTable, loansTable, traceabilityTable, auditLogTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const DAY = 86400000;
const NOW = () => Date.now();

export function calcTaxaAtual(dataInicio: number): number {
  const dias = Math.floor((NOW() - dataInicio) / DAY);
  if (dias < 30) return 10;
  if (dias < 60) return 20;
  return 50;
}

export function calcJuros(valorOriginal: number, taxaAtual: number) {
  const juroTotal = Math.round(valorOriginal * taxaAtual / 100);
  return { juroTotal, totalDevido: valorOriginal + juroTotal };
}

export function calcProjecoes(valorOriginal: number) {
  return [
    { taxa: 10, label: "Mês 1 — 10%", juroTotal: Math.round(valorOriginal * 0.10), totalDevido: valorOriginal + Math.round(valorOriginal * 0.10), cor: "#C9A84C" },
    { taxa: 20, label: "Mês 2 — 20%", juroTotal: Math.round(valorOriginal * 0.20), totalDevido: valorOriginal + Math.round(valorOriginal * 0.20), cor: "#F39C12" },
    { taxa: 50, label: "Mês 3 — 50%", juroTotal: Math.round(valorOriginal * 0.50), totalDevido: valorOriginal + Math.round(valorOriginal * 0.50), cor: "#E74C3C" },
  ];
}

export function alocarCapital(valorEmprestimo: number, membros: Array<{ id: string; saldo_base: number }>) {
  const ordenados = [...membros].sort((a, b) => b.saldo_base - a.saldo_base);
  let restante = valorEmprestimo;
  const contribuicoes: Array<{ owner_id: string; valor_contribuido: number }> = [];

  const maior = ordenados[0];
  if (!maior) return contribuicoes;

  const tirarDoMaior = Math.min(maior.saldo_base, restante);
  if (tirarDoMaior > 0) {
    contribuicoes.push({ owner_id: maior.id, valor_contribuido: tirarDoMaior });
    restante -= tirarDoMaior;
  }

  if (restante > 0 && ordenados.length > 1) {
    const outros = ordenados.slice(1).filter(m => m.saldo_base > 0);
    if (outros.length > 0) {
      const partePorMembro = Math.round(restante / outros.length);
      outros.forEach((m, i) => {
        const isUltimo = i === outros.length - 1;
        const tirar = isUltimo
          ? Math.min(m.saldo_base, restante)
          : Math.min(m.saldo_base, partePorMembro);
        if (tirar > 0) {
          contribuicoes.push({ owner_id: m.id, valor_contribuido: tirar });
          restante -= tirar;
        }
      });
    }
  }

  return contribuicoes;
}

export function distribuirJuro(juroPool: number, traces: Array<{ owner_id: string; valor_contribuido: number }>) {
  if (!traces.length) return [];
  const totalContrib = traces.reduce((s, t) => s + t.valor_contribuido, 0);
  if (totalContrib === 0) return traces.map(t => ({ ...t, juro: 0, pctReal: 0, total: t.valor_contribuido }));
  let soma = 0;
  return traces.map((t, i) => {
    const isUlt = i === traces.length - 1;
    const juro = isUlt ? juroPool - soma : Math.round(juroPool * (t.valor_contribuido / totalContrib));
    soma += juro;
    return {
      owner_id: t.owner_id,
      valor_contribuido: t.valor_contribuido,
      pctReal: (t.valor_contribuido / totalContrib * 100),
      juro,
      total: t.valor_contribuido + juro,
    };
  });
}

export async function getEnrichedLoan(loanId: string) {
  const loan = await db.query.loansTable.findFirst({ where: eq(loansTable.id, loanId) });
  if (!loan) return null;

  const traces = await db.select().from(traceabilityTable).where(eq(traceabilityTable.loan_id, loanId));
  const tomador = await db.query.usersTable.findFirst({ where: eq(usersTable.id, loan.user_id) });

  const taxa = calcTaxaAtual(loan.data_inicio);
  const { juroTotal, totalDevido } = calcJuros(loan.valor_original, taxa);
  const dias = Math.floor((NOW() - loan.data_inicio) / DAY);
  const juroPool = juroTotal - Math.round(juroTotal * 0.5);

  const ownerIds = [...new Set(traces.map(t => t.owner_id))];
  const owners = ownerIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];

  const enrichedTraces = distribuirJuro(juroPool, traces).map(d => {
    const owner = owners.find(o => o.id === d.owner_id);
    return {
      ...d,
      owner_nome: owner?.nome || "—",
      owner_foto: owner?.foto || "??",
    };
  });

  const projecoes = calcProjecoes(loan.valor_original);

  return {
    loan: {
      ...loan,
      tomador_nome: tomador?.nome || "—",
      tomador_foto: tomador?.foto || "??",
      taxa_atual: taxa,
      dias,
      juro_total: juroTotal,
      total_devido: totalDevido,
    },
    traces: enrichedTraces,
    projecoes,
  };
}

export async function addAuditEntry(tipo: string, desc: string, valor: number, user: string) {
  const id = `a_${randomUUID().slice(0, 8)}`;
  await db.insert(auditLogTable).values({ id, ts: NOW(), tipo, desc, valor, user });
}
