import { db } from "@workspace/db";
import {
  usersTable, loansTable, traceabilityTable,
  auditLogTable, loanRequestsTable, depositRequestsTable
} from "@workspace/db";

const NOW = Date.now();
const DAY = 86400000;

async function seed() {
  console.log("Seeding database...");

  await db.delete(auditLogTable);
  await db.delete(traceabilityTable);
  await db.delete(loansTable);
  await db.delete(loanRequestsTable);
  await db.delete(depositRequestsTable);
  await db.delete(usersTable);

  // Members — balances already reflect capital that's been deployed in active loans
  await db.insert(usersTable).values([
    { id: "u1", nome: "João Silva",    foto: "JS", status: "Ativo",     saldo_base: 30000,  lucro_acumulado: 3200 },
    { id: "u2", nome: "Maria Santos",  foto: "MS", status: "Ativo",     saldo_base: 25000,  lucro_acumulado: 1500 },
    { id: "u3", nome: "Jorge Nunes",   foto: "JN", status: "Ativo",     saldo_base: 30000,  lucro_acumulado: 1800 },
    { id: "u4", nome: "Lucas Rocha",   foto: "LR", status: "Ativo",     saldo_base: 0,      lucro_acumulado: 0    },
    { id: "u5", nome: "Eva Marques",   foto: "EM", status: "Ativo",     saldo_base: 45000,  lucro_acumulado: 8400 },
    { id: "u6", nome: "Ana Ferreira",  foto: "AF", status: "Ativo",     saldo_base: 50000,  lucro_acumulado: 5100 },
    { id: "u7", nome: "Felipe Costa",  foto: "FC", status: "Ativo",     saldo_base: 0,      lucro_acumulado: 0    },
    { id: "u8", nome: "Bruno Mateus",  foto: "BM", status: "Congelado", saldo_base: 20000,  lucro_acumulado: 900  },
  ]);

  // Active loans
  await db.insert(loansTable).values([
    { id: "l1", user_id: "u4", valor_original: 70000,  data_inicio: NOW - 40 * DAY, taxa_atual: 20, status: "Ativo", valor_pago: 0 },
    { id: "l2", user_id: "u7", valor_original: 30000,  data_inicio: NOW - 15 * DAY, taxa_atual: 10, status: "Ativo", valor_pago: 0 },
    { id: "l3", user_id: "u2", valor_original: 50000,  data_inicio: NOW - 62 * DAY, taxa_atual: 50, status: "Liquidado", valor_pago: 75000 },
  ]);

  // Traceability — who funded each loan
  await db.insert(traceabilityTable).values([
    // l1: Lucas 700 MT — Ana cobre maior parte, resto dividido
    { id: "t1", loan_id: "l1", owner_id: "u6", valor_contribuido: 40000 },
    { id: "t2", loan_id: "l1", owner_id: "u1", valor_contribuido: 15000 },
    { id: "t3", loan_id: "l1", owner_id: "u3", valor_contribuido: 15000 },
    // l2: Felipe 300 MT — Eva cobre sozinha
    { id: "t4", loan_id: "l2", owner_id: "u5", valor_contribuido: 30000 },
    // l3: Maria 500 MT (já pago) — João e Jorge cobriram
    { id: "t5", loan_id: "l3", owner_id: "u1", valor_contribuido: 25000 },
    { id: "t6", loan_id: "l3", owner_id: "u3", valor_contribuido: 25000 },
  ]);

  // Audit log
  await db.insert(auditLogTable).values([
    { id: "a1", ts: NOW - 62 * DAY, tipo: "EMPRESTIMO", desc: "Maria Santos recebeu 500,00 MT. Alocação: João Silva: 250,00 MT, Jorge Nunes: 250,00 MT", valor: 50000, user: "u2" },
    { id: "a2", ts: NOW - 40 * DAY, tipo: "EMPRESTIMO", desc: "Lucas Rocha recebeu 700,00 MT. Alocação: Ana Ferreira: 400,00 MT, João Silva: 150,00 MT, Jorge Nunes: 150,00 MT", valor: 70000, user: "u4" },
    { id: "a3", ts: NOW - 15 * DAY, tipo: "EMPRESTIMO", desc: "Felipe Costa recebeu 300,00 MT. Alocação: Eva Marques: 300,00 MT", valor: 30000, user: "u7" },
    { id: "a4", ts: NOW - 5  * DAY, tipo: "DEPOSITO",   desc: "João Silva depositou 300,00 MT — capital novo em caixa", valor: 30000, user: "u1" },
    { id: "a5", ts: NOW - 3  * DAY, tipo: "PAGAMENTO",  desc: "Maria Santos liquidou empréstimo de 500,00 MT + 250,00 MT de juro (50%)", valor: 75000, user: "u2" },
  ]);

  // Pending requests — sized to be approvable with the current pool
  // Pool (Ativo, excl. borrower): João(30k) + Maria(25k) + Jorge(30k) + Eva(45k) + Ana(50k) = 180,000c total
  // lr_pending: Bruno 800 MT (80,000c) — pool excl. Bruno (Congelado, not in Ativo) = 180,000c ✓ approvable
  await db.insert(loanRequestsTable).values([
    { id: "lr1", user_id: "u8", valor: 80000,  motivo: "Reparação de carro urgente",           status: "Pendente", ts: NOW - 2 * DAY },
    { id: "lr2", user_id: "u4", valor: 50000,  motivo: "Capital de giro para pequeno negócio", status: "Pendente", ts: NOW - 1 * DAY },
    { id: "lr3", user_id: "u7", valor: 200000, motivo: "Compra de equipamentos",               status: "Rejeitado", ts: NOW - 10 * DAY },
  ]);

  await db.insert(depositRequestsTable).values([
    { id: "dr1", user_id: "u3", valor: 10000, status: "Pendente",  ts: NOW - 1 * DAY },
    { id: "dr2", user_id: "u1", valor: 5000,  status: "Aprovado",  ts: NOW - 8 * DAY },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
