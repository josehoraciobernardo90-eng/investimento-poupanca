import { pgTable, text, integer, bigint, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userStatusEnum = pgEnum("user_status", ["Ativo", "Congelado"]);
export const loanStatusEnum = pgEnum("loan_status", ["Ativo", "Atrasado", "Liquidado"]);
export const requestStatusEnum = pgEnum("request_status", ["Pendente", "Aprovado", "Rejeitado"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  foto: text("foto").notNull(),
  status: userStatusEnum("status").notNull().default("Ativo"),
  saldo_base: integer("saldo_base").notNull().default(0),
  lucro_acumulado: integer("lucro_acumulado").notNull().default(0),
});

export const loansTable = pgTable("loans", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  valor_original: integer("valor_original").notNull(),
  data_inicio: bigint("data_inicio", { mode: "number" }).notNull(),
  taxa_atual: integer("taxa_atual").notNull().default(10),
  status: loanStatusEnum("status").notNull().default("Ativo"),
  valor_pago: integer("valor_pago").notNull().default(0),
});

export const traceabilityTable = pgTable("traceability", {
  id: text("id").primaryKey(),
  loan_id: text("loan_id").notNull(),
  owner_id: text("owner_id").notNull(),
  valor_contribuido: integer("valor_contribuido").notNull(),
});

export const loanRequestsTable = pgTable("loan_requests", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  valor: integer("valor").notNull(),
  motivo: text("motivo").notNull(),
  status: requestStatusEnum("status").notNull().default("Pendente"),
  ts: bigint("ts", { mode: "number" }).notNull(),
});

export const depositRequestsTable = pgTable("deposit_requests", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  valor: integer("valor").notNull(),
  status: requestStatusEnum("status").notNull().default("Pendente"),
  ts: bigint("ts", { mode: "number" }).notNull(),
});

export const auditLogTable = pgTable("audit_log", {
  id: text("id").primaryKey(),
  ts: bigint("ts", { mode: "number" }).notNull(),
  tipo: text("tipo").notNull(),
  desc: text("desc").notNull(),
  valor: integer("valor").notNull(),
  user: text("user").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const insertLoanSchema = createInsertSchema(loansTable);
export const insertTraceSchema = createInsertSchema(traceabilityTable);
export const insertLoanRequestSchema = createInsertSchema(loanRequestsTable);
export const insertDepositRequestSchema = createInsertSchema(depositRequestsTable);
export const insertAuditSchema = createInsertSchema(auditLogTable);

export type User = typeof usersTable.$inferSelect;
export type Loan = typeof loansTable.$inferSelect;
export type TraceRecord = typeof traceabilityTable.$inferSelect;
export type LoanRequest = typeof loanRequestsTable.$inferSelect;
export type DepositRequest = typeof depositRequestsTable.$inferSelect;
export type AuditEntry = typeof auditLogTable.$inferSelect;
