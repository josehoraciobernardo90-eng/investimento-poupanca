// ============================================================================
// Auto-Freeze Engine — Cofre Capital
// 
// REGRAS DE NEGÓCIO:
// 1. O membro leva um empréstimo numa data fixa (ex: dia 20)
// 2. Mês 1: Pode devolver na mesma data do próximo mês → juro = 10% da base
// 3. Mês 2: Se não devolveu → juro sobe para 20% da base  
// 4. Mês 3: Se não devolveu → juro sobe para 50% da base
// 5. Se não pagar até a data do 3º mês, às 00:00 do dia seguinte → CONTA CONGELADA
// 6. Somente o Admin pode descongelar
//
// A base nunca muda. Apenas o juro muda conforme o mês.
// ============================================================================

export interface LoanStatus {
  fase: 1 | 2 | 3 | "VENCIDO";
  taxaAtual: 10 | 20 | 50;
  juro: number;        // juros fixos da fase
  multaAtraso: number; // multas acumuladas por dia (1% ao dia após 3 meses)
  totalDevido: number;  // base + juro + multa
  diasRestantes: number;
  proximaData: Date;
  dataLimite: Date;     // data final do 3º mês
  deveBloqueiar: boolean;
  label: string;
}

/**
 * Calcula o status de um empréstimo com base na data de início e a data actual.
 * 
 * @param valorBase - Valor original do empréstimo em centavos
 * @param valorPago - Quanto o membro já pagou neste contrato
 * @param dataInicio - Timestamp Unix (seconds) da data de início
 * @param agora - Data actual (opcional, default = new Date())
 * @returns LoanStatus com fase, taxa, juros e se deve bloquear
 */
export function calcularStatusEmprestimo(
  valorBase: number,
  dataInicio: number,
  valorPago: number = 0,
  agora: Date = new Date()
): LoanStatus {
  const inicio = new Date(dataInicio > 1e11 ? dataInicio : dataInicio * 1000);
  const diaFixo = inicio.getDate(); // dia do mês em que levou o empréstimo

  // Calcular as 3 datas de vencimento (mesmo dia, meses seguintes)
  const data1 = getProximaData(inicio, 1, diaFixo); // mês 1
  const data2 = getProximaData(inicio, 2, diaFixo); // mês 2
  const data3 = getProximaData(inicio, 3, diaFixo); // mês 3
  
  // Data limite = início do dia seguinte ao 3º vencimento (00:00)
  const dataLimite = new Date(data3);
  dataLimite.setDate(dataLimite.getDate() + 1);
  dataLimite.setHours(0, 0, 0, 0);

  // Determinar em que fase estamos
  if (agora < data1) {
    // Estamos antes da 1ª data de vencimento → Fase 1 (10%)
    const juro = Math.round(valorBase * 0.10);
    const diasRestantes = Math.ceil((data1.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    return {
      fase: 1,
      taxaAtual: 10,
      juro,
      multaAtraso: 0,
      totalDevido: Math.max(0, valorBase + juro - valorPago),
      diasRestantes,
      proximaData: data1,
      dataLimite,
      deveBloqueiar: false,
      label: `Mês 1 — Juro 10% | Vence ${formatarData(data1)} (${diasRestantes} dias)`,
    };
  } else if (agora < data2) {
    // Passou a 1ª data sem pagar → Fase 2 (20%)
    const juro = Math.round(valorBase * 0.20);
    const diasRestantes = Math.ceil((data2.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    return {
      fase: 2,
      taxaAtual: 20,
      juro,
      multaAtraso: 0,
      totalDevido: Math.max(0, valorBase + juro - valorPago),
      diasRestantes,
      proximaData: data2,
      dataLimite,
      deveBloqueiar: false,
      label: `Mês 2 — Juro 20% | Vence ${formatarData(data2)} (${diasRestantes} dias)`,
    };
  } else if (agora < dataLimite) {
    // Passou a 2ª data sem pagar → Fase 3 (50%)
    const juro = Math.round(valorBase * 0.50);
    const diasRestantes = Math.ceil((dataLimite.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    return {
      fase: 3,
      taxaAtual: 50,
      juro,
      multaAtraso: 0,
      totalDevido: Math.max(0, valorBase + juro - valorPago),
      diasRestantes,
      proximaData: data3,
      dataLimite,
      deveBloqueiar: false,
      label: `Mês 3 — Juro 50% ⚠️ | Limite ${formatarData(dataLimite)} (${diasRestantes} dias)`,
    };
  } else {
    // Passou a data limite do 3º mês → VENCIDO, APLICAR MULTA DIÁRIA 1%
    const juro = Math.round(valorBase * 0.50);
    const diasEmAtraso = Math.floor((agora.getTime() - dataLimite.getTime()) / (1000 * 60 * 60 * 24));
    const multaAtraso = Math.max(0, Math.round(valorBase * 0.01 * diasEmAtraso)); // 1% ao dia

    return {
      fase: "VENCIDO",
      taxaAtual: 50,
      juro,
      multaAtraso,
      totalDevido: Math.max(0, valorBase + juro + multaAtraso - valorPago),
      diasRestantes: 0,
      proximaData: data3,
      dataLimite,
      deveBloqueiar: true,
      label: `VENCIDO — Multa acumulada: ${multaAtraso} (1% dia)`,
    };
  }
}

/**
 * Verifica todos os empréstimos activos e retorna quais membros devem ser bloqueados.
 */
export function verificarCongelamentos(
  emprestimos: Array<{ user_id: string; valor_original: number; valor_pago?: number; data_inicio: number; status: string }>,
  agora: Date = new Date()
): string[] {
  const membrosBloqueados: string[] = [];

  for (const emp of emprestimos) {
    if (emp.status === "Liquidado") continue; // já pagou
    
    const status = calcularStatusEmprestimo(emp.valor_original, emp.data_inicio, emp.valor_pago || 0, agora);
    if (status.deveBloqueiar) {
      membrosBloqueados.push(emp.user_id);
    }
  }

  return [...new Set(membrosBloqueados)]; // sem duplicados
}

// --- Helpers ---

function getProximaData(inicio: Date, mesesAFrente: number, diaFixo: number): Date {
  const data = new Date(inicio);
  data.setMonth(data.getMonth() + mesesAFrente);
  
  // Lidar com meses que não têm o dia fixo (ex: dia 31 em fevereiro)
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  data.setDate(Math.min(diaFixo, ultimoDia));
  data.setHours(23, 59, 59, 999); // fim do dia
  
  return data;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
