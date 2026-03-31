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
  const primaryColor = [135, 206, 235]; // Sky Blue (Approx Co-fre Primary)

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("COFRE CAPITAL - RELATÓRIO", 15, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${formatDateTime(Math.floor(Date.now() / 1000))}`, 15, 30);

  // User Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.text("INFORMAÇÕES DO MEMBRO", 15, 55);
  doc.setLineWidth(0.5);
  doc.line(15, 58, 195, 58);

  doc.setFontSize(11);
  doc.text(`Nome: ${memberUser.nome}`, 15, 68);
  doc.text(`ID: ${memberUser.id}`, 15, 75);
  doc.text(`Telefone: ${memberUser.telefone || "N/A"}`, 15, 82);
  doc.text(`Profissão: ${memberUser.profissao}`, 15, 89);
  doc.text(`Localização: ${memberUser.cidade}, ${memberUser.bairro}`, 15, 96);

  // Financial Status
  doc.setFontSize(14);
  doc.text("SITUAÇÃO FINANCEIRA", 15, 115);
  doc.line(15, 118, 195, 118);

  doc.setFontSize(12);
  doc.text(`Património Total: ${formatMT(memberDetails.patrimonioTotal)}`, 15, 128);
  doc.text(`Saldo em Caixa: ${formatMT(memberDetails.emCaixa)}`, 15, 136);
  doc.text(`Total em Investimentos: ${formatMT(memberDetails.totalEmCirculacao)}`, 15, 144);
  doc.setTextColor(0, 150, 0);
  doc.text(`Lucros Brutos Esperados: ${formatMT(memberDetails.totalJuroEsperado)}`, 15, 152);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerText = "Protocolo de Segurança Cloud • Chimoio • Este documento é para fins informativos.";
  doc.text(footerText, 105, 285, { align: "center" });

  // Save
  doc.save(`Relatorio_Cofre_${memberUser.nome.replace(/\s+/g, '_')}.pdf`);
}
