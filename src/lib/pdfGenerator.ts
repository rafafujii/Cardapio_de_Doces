import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, getProductUnitPrice } from './utils';
import type { CartItem, OrderDetails } from '../types';

interface GeneratePdfOptions {
  orderDetails?: OrderDetails;
  items: CartItem[];
  total: number;
  pixKey?: string;
  pickupAddress?: string;
  contactPhone?: string;
  orderNumber?: string;
  isFormalProposal?: boolean;
}

export function generateOrderPdf({
  orderDetails,
  items,
  total,
  pixKey = "03972289960",
  pickupAddress = "Avenida Padre Jose Stefanello, n°340",
  contactPhone = "(44) 99854-2446",
  orderNumber,
  isFormalProposal = true
}: GeneratePdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [128, 0, 32]; // #800020 Brand Wine
  const goldColor = [212, 175, 55]; // #D4AF37 Gold
  const darkNeutral = [40, 40, 40];
  const lightBg = [253, 248, 245];

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const proposalId = orderNumber || `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Header Banner Background
  doc.setFillColor(128, 0, 32);
  doc.rect(0, 0, 210, 38, 'F');

  // Gold accent line
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 38, 210, 2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('S.E DOCES GOURMET', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(243, 229, 171); // Soft gold
  doc.text('ALTA CONFEITARIA ARTESANAL • CASAMENTOS & EVENTOS', 14, 25);
  doc.text(`Contato: ${contactPhone} | Instagram: @se.docesgourmet`, 14, 31);

  // Proposal Badge / Status (Right Side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(isFormalProposal ? 'ORÇAMENTO FORMAL' : 'PEDIDO DE ENCOMENDA', 196, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(243, 229, 171);
  doc.text(`Nº: ${proposalId}`, 196, 25, { align: 'right' });
  doc.text(`Data de Emissão: ${dateFormatted}`, 196, 31, { align: 'right' });

  let currentY = 48;

  // Customer & Event Details Box
  doc.setFillColor(248, 246, 242);
  doc.roundedRect(14, currentY, 182, 34, 3, 3, 'F');
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(14, currentY, 182, 34, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('DADOS DO CLIENTE & AGENDAMENTO DO EVENTO', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const customerName = orderDetails?.name || 'Cliente';
  const eventDate = orderDetails?.date ? orderDetails.date.split('-').reverse().join('/') : 'A combinar';
  const eventTime = orderDetails?.time || 'A combinar';
  const paymentMethod = orderDetails?.paymentMethod || 'PIX';

  doc.text(`Cliente / Responsável: `, 18, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${customerName}`, 55, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.text(`Data do Evento / Retirada: `, 18, currentY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eventDate} às ${eventTime}`, 58, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.text(`Local de Retirada: `, 18, currentY + 26);
  doc.text(`${pickupAddress}`, 46, currentY + 26);

  doc.text(`Forma de Pagamento: `, 115, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${paymentMethod}`, 150, currentY + 14);

  if (orderDetails?.notes) {
    doc.setFont('helvetica', 'italic');
    doc.text(`Observações: ${orderDetails.notes.slice(0, 50)}`, 115, currentY + 20);
  }

  currentY += 40;

  // Table of Items
  const tableData = items.map((item, index) => {
    const unitPrice = getProductUnitPrice(item);
    const centoPrice = item.priceCento || (unitPrice * 100);
    const itemTotal = unitPrice * item.quantity;
    const centosEquiv = (item.quantity / 100).toFixed(2);

    return [
      String(index + 1).padStart(2, '0'),
      item.name,
      `${item.quantity} un (${centosEquiv} cento)`,
      formatCurrency(centoPrice),
      formatCurrency(unitPrice),
      formatCurrency(itemTotal)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Item', 'Descrição do Doce Gourmet', 'Quantidade', 'Valor / Cento', 'Unitário', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 23, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [252, 250, 248]
    },
    margin: { left: 14, right: 14 }
  });

  // Position after table
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Totals Box (Right Side)
  const totalBoxWidth = 85;
  const totalBoxX = 196 - totalBoxWidth;
  
  doc.setFillColor(253, 248, 245);
  doc.roundedRect(totalBoxX, finalY, totalBoxWidth, 32, 2, 2, 'F');
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalBoxX, finalY, totalBoxWidth, 32, 2, 2, 'D');

  const totalSweets = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalCentos = (totalSweets / 100).toFixed(1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total de Doces:`, totalBoxX + 6, finalY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalSweets} un (${totalCentos} centos)`, totalBoxX + totalBoxWidth - 6, finalY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Forminhas Padrão:`, totalBoxX + 6, finalY + 15);
  doc.text(`Inclusas (Acetato)`, totalBoxX + totalBoxWidth - 6, finalY + 15, { align: 'right' });

  // Divider inside total box
  doc.setDrawColor(220, 200, 200);
  doc.line(totalBoxX + 4, finalY + 19, totalBoxX + totalBoxWidth - 4, finalY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(128, 0, 32);
  doc.text(`VALOR TOTAL:`, totalBoxX + 6, finalY + 27);
  doc.text(`${formatCurrency(total)}`, totalBoxX + totalBoxWidth - 6, finalY + 27, { align: 'right' });

  // Payment Terms & Conditions Box (Left Side)
  const termsBoxWidth = 90;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, finalY, termsBoxWidth, 44, 2, 2, 'F');
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(14, finalY, termsBoxWidth, 44, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(128, 0, 32);
  doc.text('CONDIÇÕES DE RESERVA & PAGAMENTO', 18, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`• Reserva mediante sinal de 50% ou pagamento integral.`, 18, finalY + 13);
  doc.text(`• Saldo restante a ser quitado até a data da retirada.`, 18, finalY + 18);
  doc.text(`• Chave PIX Oficial (CPF): ${pixKey}`, 18, finalY + 23);
  doc.text(`• Produção fresca e 100% artesanal com ingredientes nobres.`, 18, finalY + 28);
  doc.text(`• Validade desta proposta: 7 dias a contar da emissão.`, 18, finalY + 33);
  doc.text(`• Retirada no endereço informado ou frete a combinar.`, 18, finalY + 38);

  // Footer Signature Section
  const pageHeight = doc.internal.pageSize.height;
  
  // Footer Decorative Line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(128, 0, 32);
  doc.text('S.E DOCES GOURMET • Confeitaria Fina & Doces para Eventos Especiais', 105, pageHeight - 15, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Agradecemos a preferência! Torne seu momento inesquecível com o sabor inconfundível dos nossos doces.', 105, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const safeCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Orcamento_Doces_Gourmet_${safeCustomerName}_${proposalId}.pdf`;
  doc.save(filename);
}
