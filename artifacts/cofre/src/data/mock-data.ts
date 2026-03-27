// ============================================================================
// Real-Time Sync Proxy — Cofre Capital
// Substitui os dados locais pela store baseada em Firebase OnValue
// Isto garante que todos os hooks que importavam daqui passam a ler da Cloud
// ============================================================================

export * from './firebase-data';


// --- USERS (Membros) ---
export const mockUsers = [
  { id: "u1", nome: "Carlos Macuácua", foto: "CM", status: "Ativo" as const, saldo_base: 2500000, lucro_acumulado: 187500 },
  { id: "u2", nome: "Ana Berta Sitoe", foto: "AS", status: "Ativo" as const, saldo_base: 1800000, lucro_acumulado: 135000 },
  { id: "u3", nome: "João Tembe", foto: "JT", status: "Ativo" as const, saldo_base: 3200000, lucro_acumulado: 240000 },
  { id: "u4", nome: "Maria Dzimba", foto: "MD", status: "Congelado" as const, saldo_base: 500000, lucro_acumulado: 37500 },
  { id: "u5", nome: "Pedro Nhantumbo", foto: "PN", status: "Ativo" as const, saldo_base: 2000000, lucro_acumulado: 150000 },
];

// --- DASHBOARD ---
export const mockDashboard = {
  caixa: 6800000,    // 68,000 MT
  lucros: 750000,    // 7,500 MT
  naRua: 3200000,    // 32,000 MT em empréstimos
  total: 10000000,   // 100,000 MT
  membros_ativos: 4,
  emprestimos_ativos: 3,
  solicitacoes_pendentes: 2,
};

// --- LOANS (Empréstimos) ---
// Usamos timestamps fixos para demonstrar as 3 fases + vencido
const now = Math.floor(Date.now() / 1000);
const day = 86400;

// Empréstimo no Mês 1 (menos de 30 dias) — Ana levou dia 5 deste mês
const diaFixo1 = new Date();
diaFixo1.setDate(5);
diaFixo1.setMonth(diaFixo1.getMonth()); // este mês
if (diaFixo1.getTime() > Date.now()) diaFixo1.setMonth(diaFixo1.getMonth() - 1);
const ts1 = Math.floor(diaFixo1.getTime() / 1000);

// Empréstimo no Mês 2 (35-55 dias) — Pedro levou dia 10 há 2 meses
const diaFixo2 = new Date();
diaFixo2.setDate(10);
diaFixo2.setMonth(diaFixo2.getMonth() - 1); // mês passado
const ts2 = Math.floor(diaFixo2.getTime() / 1000);

// Empréstimo no Mês 3 (65+ dias) — Carlos levou dia 15 há 3 meses  
const diaFixo3 = new Date();
diaFixo3.setDate(15);
diaFixo3.setMonth(diaFixo3.getMonth() - 2); // há 2 meses
const ts3 = Math.floor(diaFixo3.getTime() / 1000);

export const mockLoans: Array<{
  id: string;
  user_id: string;
  tomador_nome: string;
  tomador_foto: string;
  valor_original: number;
  data_inicio: number;
  taxa_atual: number;
  status: "Ativo" | "Atrasado" | "Liquidado";
  valor_pago: number;
  dias: number;
  juro_total: number;
  total_devido: number;
}> = [
  {
    id: "l1",
    user_id: "u2",
    tomador_nome: "Ana Berta Sitoe",
    tomador_foto: "AS",
    valor_original: 1000000, // 10,000 MT — base fixa
    data_inicio: ts1,
    taxa_atual: 10,
    status: "Ativo" as const,
    valor_pago: 0,
    dias: Math.floor((Date.now() / 1000 - ts1) / day),
    juro_total: 100000,   // 10% de 10,000 = 1,000 MT
    total_devido: 1100000, // 11,000 MT
  },
  {
    id: "l2",
    user_id: "u5",
    tomador_nome: "Pedro Nhantumbo",
    tomador_foto: "PN",
    valor_original: 500000, // 5,000 MT — base fixa
    data_inicio: ts2,
    taxa_atual: 20,
    status: "Atrasado" as const,
    valor_pago: 0,
    dias: Math.floor((Date.now() / 1000 - ts2) / day),
    juro_total: 100000,    // 20% de 5,000 = 1,000 MT
    total_devido: 600000,  // 6,000 MT
  },
  {
    id: "l3",
    user_id: "u1",
    tomador_nome: "Carlos Macuácua",
    tomador_foto: "CM",
    valor_original: 2000000, // 20,000 MT — base fixa
    data_inicio: ts3,
    taxa_atual: 50,
    status: "Atrasado" as const,
    valor_pago: 0,
    dias: Math.floor((Date.now() / 1000 - ts3) / day),
    juro_total: 1000000,    // 50% de 20,000 = 10,000 MT
    total_devido: 3000000,  // 30,000 MT
  },
];

// --- LOAN DETAILS (Rastreabilidade) ---
export const mockLoanDetails: Record<string, {
  loan: typeof mockLoans[0];
  traces: Array<{ owner_id: string; owner_nome: string; owner_foto: string; valor_contribuido: number; pctReal: number; juro: number; total: number }>;
  projecoes: Array<{ taxa: number; label: string; juroTotal: number; totalDevido: number; cor: string }>;
}> = {
  l1: {
    loan: mockLoans[0],
    traces: [
      { owner_id: "u3", owner_nome: "João Tembe", owner_foto: "JT", valor_contribuido: 500000, pctReal: 50, juro: 50000, total: 550000 },
      { owner_id: "u1", owner_nome: "Carlos Macuácua", owner_foto: "CM", valor_contribuido: 250000, pctReal: 25, juro: 25000, total: 275000 },
      { owner_id: "u5", owner_nome: "Pedro Nhantumbo", owner_foto: "PN", valor_contribuido: 250000, pctReal: 25, juro: 25000, total: 275000 },
    ],
    projecoes: [
      { taxa: 10, label: "Mês 1 — Juro 10%", juroTotal: 100000, totalDevido: 1100000, cor: "#22c55e" },
      { taxa: 20, label: "Mês 2 — Juro 20%", juroTotal: 200000, totalDevido: 1200000, cor: "#eab308" },
      { taxa: 50, label: "Mês 3 — Juro 50% ⚠️", juroTotal: 500000, totalDevido: 1500000, cor: "#ef4444" },
    ],
  },
  l2: {
    loan: mockLoans[1],
    traces: [
      { owner_id: "u3", owner_nome: "João Tembe", owner_foto: "JT", valor_contribuido: 250000, pctReal: 50, juro: 50000, total: 300000 },
      { owner_id: "u1", owner_nome: "Carlos Macuácua", owner_foto: "CM", valor_contribuido: 250000, pctReal: 50, juro: 50000, total: 300000 },
    ],
    projecoes: [
      { taxa: 10, label: "Mês 1 — Juro 10%", juroTotal: 50000, totalDevido: 550000, cor: "#22c55e" },
      { taxa: 20, label: "Mês 2 — Juro 20%", juroTotal: 100000, totalDevido: 600000, cor: "#eab308" },
      { taxa: 50, label: "Mês 3 — Juro 50% ⚠️", juroTotal: 250000, totalDevido: 750000, cor: "#ef4444" },
    ],
  },
  l3: {
    loan: mockLoans[2],
    traces: [
      { owner_id: "u3", owner_nome: "João Tembe", owner_foto: "JT", valor_contribuido: 1000000, pctReal: 50, juro: 500000, total: 1500000 },
      { owner_id: "u2", owner_nome: "Ana Berta Sitoe", owner_foto: "AS", valor_contribuido: 1000000, pctReal: 50, juro: 500000, total: 1500000 },
    ],
    projecoes: [
      { taxa: 10, label: "Mês 1 — Juro 10%", juroTotal: 200000, totalDevido: 2200000, cor: "#22c55e" },
      { taxa: 20, label: "Mês 2 — Juro 20%", juroTotal: 400000, totalDevido: 2400000, cor: "#eab308" },
      { taxa: 50, label: "Mês 3 — Juro 50% ⚠️", juroTotal: 1000000, totalDevido: 3000000, cor: "#ef4444" },
    ],
  },
};

// --- USER DETAILS (Mapa de Capital) ---
export const mockUserDetails: Record<string, {
  user: typeof mockUsers[0];
  emCaixa: number;
  emCirculacao: Array<{ loan_id: string; tomador_id: string; tomador_nome: string; tomador_foto: string; valor_contribuido: number; pctDoEmprestimo: number; taxa_atual: number; dias: number; data_inicio: number; status: string; juro_esperado: number; total_esperado: number }>;
  totalEmCirculacao: number;
  totalJuroEsperado: number;
  patrimonioTotal: number;
}> = {
  u1: {
    user: mockUsers[0],
    emCaixa: 1750000,
    emCirculacao: [
      { loan_id: "l1", tomador_id: "u2", tomador_nome: "Ana Berta Sitoe", tomador_foto: "AS", valor_contribuido: 250000, pctDoEmprestimo: 25, taxa_atual: 10, dias: mockLoans[0].dias, data_inicio: ts1, status: "Ativo", juro_esperado: 25000, total_esperado: 275000 },
      { loan_id: "l2", tomador_id: "u5", tomador_nome: "Pedro Nhantumbo", tomador_foto: "PN", valor_contribuido: 250000, pctDoEmprestimo: 50, taxa_atual: 20, dias: mockLoans[1].dias, data_inicio: ts2, status: "Atrasado", juro_esperado: 50000, total_esperado: 300000 },
    ],
    totalEmCirculacao: 500000,
    totalJuroEsperado: 75000,
    patrimonioTotal: 2325000,
  },
  u2: {
    user: mockUsers[1],
    emCaixa: 800000,
    emCirculacao: [
      { loan_id: "l3", tomador_id: "u1", tomador_nome: "Carlos Macuácua", tomador_foto: "CM", valor_contribuido: 1000000, pctDoEmprestimo: 50, taxa_atual: 50, dias: mockLoans[2].dias, data_inicio: ts3, status: "Atrasado", juro_esperado: 500000, total_esperado: 1500000 },
    ],
    totalEmCirculacao: 1000000,
    totalJuroEsperado: 500000,
    patrimonioTotal: 2300000,
  },
  u3: {
    user: mockUsers[2],
    emCaixa: 1450000,
    emCirculacao: [
      { loan_id: "l1", tomador_id: "u2", tomador_nome: "Ana Berta Sitoe", tomador_foto: "AS", valor_contribuido: 500000, pctDoEmprestimo: 50, taxa_atual: 10, dias: mockLoans[0].dias, data_inicio: ts1, status: "Ativo", juro_esperado: 50000, total_esperado: 550000 },
      { loan_id: "l2", tomador_id: "u5", tomador_nome: "Pedro Nhantumbo", tomador_foto: "PN", valor_contribuido: 250000, pctDoEmprestimo: 50, taxa_atual: 20, dias: mockLoans[1].dias, data_inicio: ts2, status: "Atrasado", juro_esperado: 50000, total_esperado: 300000 },
      { loan_id: "l3", tomador_id: "u1", tomador_nome: "Carlos Macuácua", tomador_foto: "CM", valor_contribuido: 1000000, pctDoEmprestimo: 50, taxa_atual: 50, dias: mockLoans[2].dias, data_inicio: ts3, status: "Atrasado", juro_esperado: 500000, total_esperado: 1500000 },
    ],
    totalEmCirculacao: 1750000,
    totalJuroEsperado: 600000,
    patrimonioTotal: 3800000,
  },
  u4: {
    user: mockUsers[3],
    emCaixa: 500000,
    emCirculacao: [],
    totalEmCirculacao: 0,
    totalJuroEsperado: 0,
    patrimonioTotal: 500000,
  },
  u5: {
    user: mockUsers[4],
    emCaixa: 2000000,
    emCirculacao: [],
    totalEmCirculacao: 0,
    totalJuroEsperado: 0,
    patrimonioTotal: 2000000,
  },
};

// --- LOAN REQUESTS ---
export const mockLoanRequests = [
  { id: "lr1", user_id: "u2", user_nome: "Ana Berta Sitoe", user_foto: "AS", valor: 500000, motivo: "Compra de material escolar para filhos", status: "Pendente" as const, ts: now - 2 * day },
  { id: "lr2", user_id: "u5", user_nome: "Pedro Nhantumbo", user_foto: "PN", valor: 1200000, motivo: "Investimento em negócio de venda de carvão", status: "Pendente" as const, ts: now - 1 * day },
  { id: "lr3", user_id: "u1", user_nome: "Carlos Macuácua", user_foto: "CM", valor: 300000, motivo: "Pagamento de propinas na universidade", status: "Aprovado" as const, ts: now - 15 * day },
  { id: "lr4", user_id: "u3", user_nome: "João Tembe", user_foto: "JT", valor: 200000, motivo: "Reparação do telhado de casa", status: "Rejeitado" as const, ts: now - 20 * day },
];

// --- DEPOSIT REQUESTS ---
export const mockDepositRequests = [
  { id: "dr1", user_id: "u3", user_nome: "João Tembe", user_foto: "JT", valor: 800000, status: "Pendente" as const, ts: now - 3 * day },
  { id: "dr2", user_id: "u1", user_nome: "Carlos Macuácua", user_foto: "CM", valor: 500000, status: "Aprovado" as const, ts: now - 10 * day },
  { id: "dr3", user_id: "u5", user_nome: "Pedro Nhantumbo", user_foto: "PN", valor: 300000, status: "Aprovado" as const, ts: now - 12 * day },
];

// --- MEMBERSHIP REQUESTS ---
export const mockMembershipRequests = [
  { id: "mr1", nome: "Mário Fernandes", foto: "MF", saldo_base: 1500000, status: "Pendente" as const, ts: now - 1 * day },
];

// --- AUDIT LOG ---
export const mockAudit = [
  { id: "a1", ts: now - 1 * day, tipo: "EMPRESTIMO", desc: "Empréstimo de 10.000 MT aprovado para Ana Berta Sitoe — Vence dia 5 do próximo mês (juro 10%)", valor: 1000000, user: "Admin" },
  { id: "a2", ts: now - 3 * day, tipo: "DEPOSITO", desc: "Aporte de 8.000 MT aprovado de João Tembe", valor: 800000, user: "Admin" },
  { id: "a3", ts: now - 5 * day, tipo: "CONGELAMENTO", desc: "Conta de Maria Dzimba CONGELADA automaticamente — não pagou juro de 50% no prazo", valor: 0, user: "Sistema (Auto-Freeze)" },
  { id: "a4", ts: now - 10 * day, tipo: "EMPRESTIMO", desc: "Empréstimo de 20.000 MT aprovado para Carlos Macuácua — Vence dia 15", valor: 2000000, user: "Admin" },
  { id: "a5", ts: now - 12 * day, tipo: "DEPOSITO", desc: "Aporte de 5.000 MT aprovado de Carlos Macuácua", valor: 500000, user: "Admin" },
  { id: "a6", ts: now - 15 * day, tipo: "LIQUIDACAO", desc: "Empréstimo de 5.000 MT liquidado por João Tembe com juro de 500 MT (10%)", valor: 550000, user: "Admin" },
  { id: "a7", ts: now - 20 * day, tipo: "EMPRESTIMO", desc: "Empréstimo de 5.000 MT aprovado para Pedro Nhantumbo — Vence dia 10", valor: 500000, user: "Admin" },
  { id: "a8", ts: now - 30 * day, tipo: "MEMBRO", desc: "Novo membro Pedro Nhantumbo registado com aporte de 20.000 MT", valor: 2000000, user: "Admin" },
  { id: "a9", ts: now - 35 * day, tipo: "DEPOSITO", desc: "Aporte de 3.000 MT aprovado de Pedro Nhantumbo", valor: 300000, user: "Admin" },
  { id: "a10", ts: now - 40 * day, tipo: "MEMBRO", desc: "Cofre Capital criado com 5 membros fundadores", valor: 10000000, user: "Sistema" },
];
