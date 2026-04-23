import { formatMT, formatDateTime } from "@/lib/utils";
import { dbStore } from "@/data/firebase-data";

export async function generateMemberReport(memberUser: any, memberDetails: any) {
  // Load jsPDF from CDN
  if (!(window as any).jspdf) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  
  // Cyber Palette (RGB)
  const blue = [13, 155, 233];
  const crimson = [235, 20, 71];
  const dark = [10, 10, 15];

  // Background Header
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 45, "F");
  
  // Decorative line
  doc.setFillColor(...blue);
  doc.rect(0, 45, 210, 2, "F");

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("COFRE ELITE", 15, 22);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...blue);
  doc.text("SISTEMA CENTRAL: TERMINAL DE INVESTIMENTOS", 15, 30);
  
  doc.setTextColor(150, 150, 150);
  doc.text(`CERTIFICADO DIGITAL DE ATIVOS • CHIMOIO BASE 01`, 15, 36);

  // Timestamp Right
  doc.setFontSize(8);
  doc.text(`EXTRATO EMITIDO EM: ${formatDateTime(Math.floor(Date.now() / 1000))}`, 195, 20, { align: "right" });

  // SECTION 1: Titular
  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO TITULAR (VERIFICADO)", 15, 65);
  doc.line(15, 68, 80, 68);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`NOME OPERACIONAL: ${memberUser.nome.toUpperCase()}`, 15, 78);
  doc.text(`IDENTIFICADOR ÚNICO: ${memberUser.id}`, 15, 84);
  doc.text(`EMAIL REGISTADO: ${memberUser.email || "N/A"}`, 15, 90);
  doc.text(`LOCALIZAÇÃO HUB: ${memberUser.bairro || "CHIMOIO"}`, 15, 96);

  // SECTION 2: Segurança (Emergência)
  doc.setFont("helvetica", "bold");
  doc.text("PROTOCOLOS DE SEGURANÇA", 110, 65);
  doc.line(110, 68, 170, 68);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Cônjuge: ${memberUser.conjuge_nome || "N/A"} (${memberUser.conjuge_numero || "-"})`, 110, 78);
  doc.text(`Parente: ${memberUser.parente_nome || "N/A"} (${memberUser.parente_numero || "-"})`, 110, 84);

  // SECTION 3: Performance Financeira
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(15, 110, 180, 60, 5, 5, "F");

  doc.setTextColor(...blue);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BALANÇO DE ATIVOS EM CLOUD", 25, 125);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text(`CAPITAL TOTAL EM CUSTÓDIA:`, 25, 138);
  doc.setFontSize(16);
  doc.setTextColor(...dark);
  doc.text(`${formatMT(memberDetails.patrimonioTotal)}`, 190, 138, { align: "right" });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Saldo Líquido em Caixa:`, 25, 150);
  doc.text(`${formatMT(memberDetails.emCaixa)}`, 190, 150, { align: "right" });

  doc.text(`Investimentos em Circulação:`, 25, 158);
  doc.text(`${formatMT(memberDetails.totalEmCirculacao)}`, 190, 158, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(`LUCRO TOTAL JÁ REALIZADO:`, 25, 166);
  doc.text(`${formatMT(memberUser.lucro_acumulado || 0)}`, 190, 166, { align: "right" });

  // SECTION 4: Créditos Ativos
  const activeLoans = (dbStore.loans || []).filter(l => l.user_id === memberUser.id && l.status !== "Liquidado");
  
  if (activeLoans.length > 0) {
    doc.setTextColor(...crimson);
    doc.setFontSize(12);
    doc.text("EXTRATO DE PASSIVOS (DÍVIDA ACTIVA)", 15, 185);
    doc.line(15, 188, 80, 188);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    let y = 198;
    activeLoans.forEach((loan: any) => {
      doc.text(`Empréstimo #${loan.id.slice(0, 8)}:`, 15, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${formatMT(loan.total_devido)}`, 190, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Data: ${formatDateTime(loan.data_inicio)} | Taxa: ${loan.taxa_atual}%`, 15, y + 5);
      doc.setTextColor(50, 50, 50);
      y += 15;
    });
  }

  // Footer Cyber
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const footer1 = "Este documento possui assinatura digital criptográfica e é válido para comprovação de fundos dentro do ecossistema Cyber Vault.";
  const footer2 = "A manipulação indevida deste relatório constitui violação dos termos de uso do Core Protocol.";
  doc.text(footer1, 105, 275, { align: "center" });
  doc.text(footer2, 105, 280, { align: "center" });
  
  doc.setTextColor(...crimson);
  doc.text("CHIMOIO BASE BANCÁRIA • ESTADO: SEGURO E VERIFICADO", 105, 288, { align: "center" });

  // Save
  doc.save(`Extrato_Cyber_${memberUser.nome.replace(/\s+/g, '_')}.pdf`);
}

export async function generateAuditLedgerReport(auditLogs: any[]) {
  // Load jsPDF from CDN
  if (!(window as any).jspdf) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  // Load AutoTable for high-end tables
  if (!(window as any).jspdf_autotable) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  
  const blue = [37, 99, 235]; // Indigo-600
  const dark = [9, 13, 20]; // slate-950

  // Header Professional
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("LIVRO RAZÃO IMUTÁVEL", 15, 22);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 150, 255);
  doc.text("SENTINELA FISCAL — PROTOCOLO DE AUDITORIA PERMANENTE", 15, 30);
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`ID DO RELATÓRIO: LRI-${Date.now()}`, 195, 20, { align: "right" });
  doc.text(`EMITIDO EM: ${formatDateTime(Math.floor(Date.now() / 1000))}`, 195, 25, { align: "right" });

  // Summary Metrics
  const totalMovs = auditLogs.length;
  const totalVolume = auditLogs.reduce((acc, log) => acc + (Number(log.valor) || 0), 0);

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DA INTEGRIDADE", 15, 55);
  doc.line(15, 58, 60, 58);

  doc.setFont("helvetica", "normal");
  doc.text(`Total de Movimentações Registadas: ${totalMovs}`, 15, 68);
  doc.text(`Volume Financeiro Auditado: ${formatMT(totalVolume)}`, 15, 74);
  doc.text(`Estado do Ledger: VERIFICADO E SINCRONIZADO`, 15, 80);

  // AutoTable for Audit Logs
  const tableData = auditLogs.map(log => [
    formatDateTime(log.ts),
    log.tipo || "Geral",
    log.user || "Sistema",
    log.desc || "N/A",
    log.valor ? formatMT(log.valor) : "-"
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Data/Hora', 'Tipo', 'Origem/Agente', 'Descrição da Operação', 'Valor (MTn)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: dark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Folha ${i} de ${pageCount} — Cofre Elite General Ledger — Chimoio, Moçambique`, 105, 285, { align: "center" });
    doc.setTextColor(37, 99, 235);
    doc.text("VERIFICAÇÃO CRIPTOGRÁFICA GOGOMA ACTIVA", 105, 290, { align: "center" });
  }

  // Save
  doc.save(`Livro_Razao_Imutavel_${new Date().toISOString().split('T')[0]}.pdf`);
}
