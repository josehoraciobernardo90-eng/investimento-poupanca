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

  await db.insert(usersTable).values([
    { id: "u1", nome: "João Silva",   foto: "JS", status: "Ativo",    saldo_base: 15000, lucro_acumulado: 3200 },
    { id: "u2", nome: "Maria Santos", foto: "MS", status: "Ativo",    saldo_base: 0,     lucro_acumulado: 0    },
    { id: "u3", nome: "Jorge Nunes",  foto: "JN", status: "Ativo",    saldo_base: 15000, lucro_acumulado: 1800 },
    { id: "u4", nome: "Lucas Rocha",  foto: "LR", status: "Ativo",    saldo_base: 0,     lucro_acumulado: 0    },
    { id: "u5", nome: "Eva Marques",  foto: "EM", status: "Ativo",    saldo_base: 20000, lucro_acumulado: 8400 },
    { id: "u6", nome: "Ana Ferreira", foto: "AF", status: "Ativo",    saldo_base: 25000, lucro_acumulado: 5100 },
    { id: "u7", nome: "Felipe Costa", foto: "FC", status: "Ativo",    saldo_base: 0,     lucro_acumulado: 0    },
    { id: "u8", nome: "Bruno Mateus", foto: "BM", status: "Congelado",saldo_base: 18000, lucro_acumulado: 900  },
  ]);

  await db.insert(loansTable).values([
    { id: "l1", user_id: "u4", valor_original: 70000, data_inicio: NOW - 40 * DAY, taxa_atual: 20, status: "Ativo",    valor_pago: 0 },
    { id: "l2", user_id: "u7", valor_original: 30000, data_inicio: NOW - 15 * DAY, taxa_atual: 10, status: "Ativo",    valor_pago: 0 },
  ]);

  await db.insert(traceabilityTable).values([
    { id: "t1", loan_id: "l1", owner_id: "u2", valor_contribuido: 40000 },
    { id: "t2", loan_id: "l1", owner_id: "u1", valor_contribuido: 15000 },
    { id: "t3", loan_id: "l1", owner_id: "u3", valor_contribuido: 15000 },
    { id: "t4", loan_id: "l2", owner_id: "u5", valor_contribuido: 30000 },
  ]);

  await db.insert(auditLogTable).values([
    { id: "a1", ts: NOW - 40 * DAY, tipo: "EMPRESTIMO", desc: "Lucas Rocha recebeu 700,00 MT | Maria perdeu TODO (400 MT) | João 150 MT | Jorge 150 MT — algoritmo: maior primeiro, resto dividido igualmente", valor: 70000, user: "u4" },
    { id: "a2", ts: NOW - 15 * DAY, tipo: "EMPRESTIMO", desc: "Felipe Costa recebeu 300,00 MT | Eva cobre sozinha (maior investidora com 500 MT) — sobra 200 MT de Eva em caixa", valor: 30000, user: "u7" },
    { id: "a3", ts: NOW - 5  * DAY, tipo: "DEPOSITO",   desc: "João Silva depositou 50,00 MT — capital novo em caixa", valor: 5000, user: "u1" },
  ]);

  await db.insert(loanRequestsTable).values([
    { id: "lr1", user_id: "u8", valor: 50000, motivo: "Reparação de carro urgente", status: "Pendente", ts: NOW - 2 * DAY },
  ]);

  await db.insert(depositRequestsTable).values([
    { id: "dr1", user_id: "u3", valor: 10000, status: "Pendente", ts: NOW - 1 * DAY },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
