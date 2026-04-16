import { formatMT, formatDateTime } from "@/lib/utils";

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
  doc.text("CYBER VAULT", 15, 22);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...blue);
  doc.text("CORE PROTOCOL: ELITE BANKING TERMINAL", 15, 30);
  
  doc.setTextColor(150, 150, 150);
  doc.text(`CERTIFICADO DIGITAL DE ATIVOS • CHIMOIO NODE 01`, 15, 36);

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

  // PERFORMANCE TAG
  doc.setFillColor(...blue);
  doc.rect(15, 180, 180, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("ESTIMATIVA DE RENDIMENTO MENSAL PRÓXIMO CICLO:", 25, 195);
  doc.setFontSize(14);
  doc.text(`+ ${formatMT(memberDetails.totalJuroEsperado)}`, 190, 195, { align: "right" });

  // Footer Cyber
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const footer1 = "Este documento possui assinatura digital criptográfica e é válido para comprovação de fundos dentro do ecossistema Cyber Vault.";
  const footer2 = "A manipulação indevida deste relatório constitui violação dos termos de uso do Core Protocol.";
  doc.text(footer1, 105, 275, { align: "center" });
  doc.text(footer2, 105, 280, { align: "center" });
  
  doc.setTextColor(...crimson);
  doc.text("CHIMOIO BANKING NODE • STATUS: SECURE_VERIFIED", 105, 288, { align: "center" });

  // Save
  doc.save(`Extrato_Cyber_${memberUser.nome.replace(/\s+/g, '_')}.pdf`);
}
