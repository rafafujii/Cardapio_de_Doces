import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, calculateProductCost } from './utils';

export interface ExportReportData {
  orders: any[];
  productCosts: Record<string, number>;
  ingredients: any[];
  recipes: Record<string, any[]>;
  periodName: string;
  globalSettings?: any;
}

/**
 * Exporta os dados de vendas para arquivo Excel (.csv formatado em PT-BR)
 */
export function exportSalesToCsv({
  orders,
  productCosts,
  ingredients,
  recipes,
  periodName = 'Geral'
}: ExportReportData) {
  const activeOrders = orders.filter(o => o.status !== 'deleted');

  const headers = [
    'ID Pedido',
    'Data do Evento',
    'Horário',
    'Nome do Cliente',
    'Telefone/Contato',
    'Status',
    'Forma de Pagamento',
    'Faturamento Bruto (R$)',
    'Custo Estimado (R$)',
    'Lucro Líquido (R$)',
    'Margem de Lucro (%)',
    'Quantidade Total de Doces',
    'Itens do Pedido',
    'Observações'
  ];

  const rows = activeOrders.map(order => {
    let orderCost = 0;
    let totalItemsCount = 0;
    const itemsDescription = (order.items || []).map((item: any) => {
      const costPerUnit = calculateProductCost(item.name, productCosts, ingredients, recipes);
      const qty = item.quantity || 1;
      orderCost += (costPerUnit * qty);
      totalItemsCount += qty;
      return `${qty}x ${item.name} (${item.isUnitItem ? 'unidade' : 'cento/porção'})`;
    }).join(' | ');

    const revenue = order.total || 0;
    const profit = revenue - orderCost;
    const marginPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    const formattedDate = order.date ? order.date.split('-').reverse().join('/') : '-';
    const statusLabel = 
      order.status === 'completed' ? 'Concluído' :
      order.status === 'ready' ? 'Pronto para Retirada' :
      order.status === 'confirmed' ? 'Confirmado' : 'Pendente';

    return [
      `#${order.id ? order.id.slice(-6).toUpperCase() : 'PED'}`,
      formattedDate,
      order.time || '-',
      `"${(order.customerName || 'Cliente').replace(/"/g, '""')}"`,
      `"${(order.customerPhone || order.phone || '-').replace(/"/g, '""')}"`,
      statusLabel,
      order.paymentMethod || 'Pix',
      revenue.toFixed(2).replace('.', ','),
      orderCost.toFixed(2).replace('.', ','),
      profit.toFixed(2).replace('.', ','),
      `${marginPercent}%`,
      totalItemsCount,
      `"${itemsDescription.replace(/"/g, '""')}"`,
      `"${(order.notes || '').replace(/"/g, '""')}"`
    ];
  });

  // UTF-8 BOM para garantir acentos corretos no Excel brasileiro
  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_vendas_se_doces_${periodName.toLowerCase()}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera um Relatório Executivo de Vendas & Faturamento em PDF de Alto Padrão
 */
export function exportSalesToPdf({
  orders,
  productCosts,
  ingredients,
  recipes,
  periodName = 'Geral',
  globalSettings
}: ExportReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const activeOrders = orders.filter(o => o.status !== 'deleted');
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Cálculos Gerais
  let totalRevenue = 0;
  let totalCost = 0;
  let totalSweetsCount = 0;
  const paymentStats: Record<string, number> = { Pix: 0, Dinheiro: 0, Outro: 0 };

  activeOrders.forEach(order => {
    totalRevenue += (order.total || 0);
    const method = order.paymentMethod === 'Dinheiro' ? 'Dinheiro' : 'Pix';
    paymentStats[method] = (paymentStats[method] || 0) + (order.total || 0);

    (order.items || []).forEach((item: any) => {
      const costPerUnit = calculateProductCost(item.name, productCosts, ingredients, recipes);
      const qty = item.quantity || 1;
      totalCost += (costPerUnit * qty);
      totalSweetsCount += qty;
    });
  });

  const netProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const averageTicket = activeOrders.length > 0 ? (totalRevenue / activeOrders.length) : 0;

  // Header Banner
  doc.setFillColor(128, 0, 32); // #800020
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(212, 175, 55); // #D4AF37 Gold
  doc.rect(0, 36, 210, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('S.E DOCES GOURMET', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(243, 229, 171);
  doc.text('RELATÓRIO FINANCEIRO & DESEMPENHO DE VENDAS', 14, 23);
  doc.text(`Período de Análise: ${periodName.toUpperCase()} | Emitido em: ${dateFormatted} às ${timeFormatted}`, 14, 29);

  // Top Metrics Cards (4 Colunas)
  let yPos = 46;
  const cardWidth = 43;
  const cardHeight = 22;
  const cardGap = 3;

  const metrics = [
    { title: 'FATURAMENTO BRUTO', value: formatCurrency(totalRevenue), color: [128, 0, 32] },
    { title: 'CUSTO ESTIMADO', value: formatCurrency(totalCost), color: [160, 60, 60] },
    { title: 'LUCRO LÍQUIDO', value: formatCurrency(netProfit), color: [16, 140, 80] },
    { title: 'MARGEM MÉDIA', value: `${overallMargin}%`, color: [180, 130, 20] }
  ];

  metrics.forEach((m, idx) => {
    const xPos = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 246, 242);
    doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(225, 220, 210);
    doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(m.title, xPos + cardWidth / 2, yPos + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, xPos + cardWidth / 2, yPos + 15, { align: 'center' });
  });

  yPos += 28;

  // Secundary Summary Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total de Pedidos: ${activeOrders.length}  |  Doces Comercializados: ${totalSweetsCount} un  |  Ticket Médio: ${formatCurrency(averageTicket)}  |  Pix: ${formatCurrency(paymentStats.Pix || 0)}  |  Dinheiro: ${formatCurrency(paymentStats.Dinheiro || 0)}`, 14, yPos);

  yPos += 5;

  // Table of Orders
  const tableData = activeOrders.map(order => {
    let orderCost = 0;
    (order.items || []).forEach((item: any) => {
      const cost = calculateProductCost(item.name, productCosts, ingredients, recipes);
      orderCost += (cost * (item.quantity || 1));
    });
    const revenue = order.total || 0;
    const profit = revenue - orderCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    const dateFormatted = order.date ? order.date.split('-').reverse().join('/') : '-';

    const itemsSummary = (order.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

    return [
      `#${order.id ? order.id.slice(-6).toUpperCase() : '-'}`,
      order.customerName || 'Cliente',
      dateFormatted,
      order.paymentMethod || 'Pix',
      itemsSummary,
      formatCurrency(revenue),
      formatCurrency(orderCost),
      formatCurrency(profit),
      `${margin}%`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Nº', 'Cliente', 'Data', 'Pag.', 'Itens do Pedido', 'Bruto', 'Custo', 'Lucro', 'Margem']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [40, 40, 40],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 48 },
      5: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 16, halign: 'right', textColor: [16, 140, 80], fontStyle: 'bold' },
      8: { cellWidth: 14, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `S.E Doces Gourmet • Relatório Administrativo Confidencial • Página ${data.pageNumber} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_vendas_se_doces_${periodName.toLowerCase()}_${dateStr}.pdf`);
}

/**
 * Gera a Comanda / Folha de Produção da Cozinha para um Dia ou Semana específica
 */
export function exportKitchenProductionPdf({
  selectedDateLabel,
  orders,
  consolidatedItems,
  totalUnits
}: {
  selectedDateLabel: string;
  orders: any[];
  consolidatedItems: { name: string; category?: string; totalQuantity: number; orderCount: number }[];
  totalUnits: number;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Header Banner
  doc.setFillColor(128, 0, 32);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('S.E DOCES GOURMET • COZINHA', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(243, 229, 171);
  doc.text(`COMANDA DE PRODUÇÃO & ENROLAMENTO • ${selectedDateLabel.toUpperCase()}`, 14, 22);
  doc.text(`Total a Produzir: ${totalUnits} doces (${orders.length} pedidos) • Emitido em ${dateFormatted} às ${timeFormatted}`, 14, 27);

  let currentY = 40;

  // 1. Tabela de Consolidação de Doces a Enrolar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('1. TOTAL DE DOCES A PRODUZIR / ENROLAR (CONSOLIDADO)', 14, currentY);

  currentY += 4;

  const tableRows = consolidatedItems.map(item => {
    const centos = Math.floor(item.totalQuantity / 100);
    const un = item.totalQuantity % 100;
    const displayQty = centos > 0 ? (un > 0 ? `${centos} cento(s) + ${un} un` : `${centos} cento(s)`) : `${un} un`;

    return [
      '[  ]',
      item.name,
      item.category || 'Gourmet',
      `${item.totalQuantity} un`,
      displayQty,
      `${item.orderCount} pedido(s)`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Check', 'Sabor / Produto', 'Categoria', 'Qtd Total', 'Em Centos', 'Em Pedidos']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: [128, 0, 32] },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 21, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // 2. Detalhamento dos Pedidos da Data
  const lastY = (doc as any).lastAutoTable?.finalY || currentY + 50;
  let orderY = lastY + 10;

  if (orderY > 240) {
    doc.addPage();
    orderY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('2. DETALHAMENTO DE CADA ENCOMENDA & HORÁRIOS', 14, orderY);

  orderY += 4;

  const orderRows = orders.map(order => {
    const formattedDate = order.date ? order.date.split('-').reverse().join('/') : '-';
    const itemsList = (order.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(' | ');

    return [
      `#${order.id ? order.id.slice(-6).toUpperCase() : '-'}`,
      order.customerName || 'Cliente',
      `${formattedDate} ${order.time || ''}`,
      order.customerPhone || '-',
      itemsList,
      order.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: orderY,
    head: [['Nº Pedido', 'Cliente', 'Data & Hora', 'Contato', 'Itens Solicitados', 'Observações']],
    body: orderRows,
    theme: 'grid',
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [40, 40, 40],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247]
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 54 },
      5: { cellWidth: 36 }
    },
    margin: { left: 14, right: 14 }
  });

  const dateSlug = selectedDateLabel.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`comanda_producao_cozinha_${dateSlug}.pdf`);
}

/**
 * Grupo 4 - Item 3: Exportação de Fechamento Consolidado & Demonstrativo DRE Executivo (PDF)
 */
export function exportConsolidatedDREClosingReportPdf({
  orders,
  productCosts,
  ingredients,
  recipes,
  periodName = 'Mês Atual'
}: ExportReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const activeOrders = orders.filter(o => o.status !== 'deleted');
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Cálculos do DRE
  let grossProductRevenue = 0;
  let totalDeliveryFees = 0;
  let totalDiscountsGiven = 0;
  let totalCostOfGoods = 0; // CMV - Custo das Mercadorias Vendidas
  let totalUnitsSold = 0;
  const paymentMethods: Record<string, number> = { Pix: 0, Dinheiro: 0 };
  const productsSoldMap: Record<string, { qty: number; revenue: number; cost: number; profit: number }> = {};

  activeOrders.forEach(order => {
    const finalTotal = order.total || 0;
    const deliveryFee = Number(order.deliveryFee || 0);
    const discount = Number(order.discountAmount || 0) + Number(order.couponDiscount || 0);

    totalDeliveryFees += deliveryFee;
    totalDiscountsGiven += discount;
    grossProductRevenue += (finalTotal - deliveryFee + discount);

    const pay = order.paymentMethod === 'Dinheiro' ? 'Dinheiro' : 'Pix';
    paymentMethods[pay] = (paymentMethods[pay] || 0) + finalTotal;

    (order.items || []).forEach((item: any) => {
      const name = item.name || 'Doce';
      const qty = Number(item.quantity || 1);
      const unitCost = calculateProductCost(name, productCosts, ingredients, recipes);
      const lineCost = unitCost * qty;
      const unitPrice = item.priceCento ? (item.priceCento / 100) : (item.unitPrice || 0);
      const lineRevenue = unitPrice * qty;

      totalCostOfGoods += lineCost;
      totalUnitsSold += qty;

      if (!productsSoldMap[name]) {
        productsSoldMap[name] = { qty: 0, revenue: 0, cost: 0, profit: 0 };
      }
      productsSoldMap[name].qty += qty;
      productsSoldMap[name].revenue += lineRevenue;
      productsSoldMap[name].cost += lineCost;
      productsSoldMap[name].profit += (lineRevenue - lineCost);
    });
  });

  const netRevenue = grossProductRevenue - totalDiscountsGiven + totalDeliveryFees;
  const grossProfit = netRevenue - totalCostOfGoods;
  const grossMarginPercent = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : '0';

  // Header Banner
  doc.setFillColor(128, 0, 32); // #800020
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(212, 175, 55); // #D4AF37 Gold
  doc.rect(0, 38, 210, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('S.E DOCES GOURMET', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(243, 229, 171);
  doc.text('DEMONSTRATIVO DE RESULTADO & FECHAMENTO EXECUTIVO (DRE)', 14, 23);
  doc.text(`Período de Competência: ${periodName.toUpperCase()} | Emitido em: ${dateFormatted} às ${timeFormatted}`, 14, 30);

  let curY = 48;

  // DRE Financial Breakdown Box
  doc.setFillColor(252, 250, 246);
  doc.roundedRect(14, curY, 182, 60, 3, 3, 'F');
  doc.setDrawColor(220, 210, 195);
  doc.roundedRect(14, curY, 182, 60, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(128, 0, 32);
  doc.text('ESTRUTURA DRE CONSOLIDADA', 20, curY + 8);

  const dreLines = [
    { label: '(+) Receita Bruta de Produtos', value: formatCurrency(grossProductRevenue), isBold: false, color: [40, 40, 40] },
    { label: '(-) Deduções & Descontos Comerciais', value: `- ${formatCurrency(totalDiscountsGiven)}`, isBold: false, color: [180, 50, 50] },
    { label: '(+) Taxas de Entrega / Fretes Recebidos', value: `+ ${formatCurrency(totalDeliveryFees)}`, isBold: false, color: [60, 60, 60] },
    { label: '(=) RECEITA OPERACIONAL LÍQUIDA', value: formatCurrency(netRevenue), isBold: true, color: [128, 0, 32] },
    { label: '(-) Custo dos Insumos & Matéria-Prima (CMV)', value: `- ${formatCurrency(totalCostOfGoods)}`, isBold: false, color: [180, 50, 50] },
    { label: '(=) LUCRO OPERACIONAL BRUTO LÍQUIDO', value: `${formatCurrency(grossProfit)} (${grossMarginPercent}%)`, isBold: true, color: [16, 140, 80] }
  ];

  let dreLineY = curY + 16;
  dreLines.forEach(line => {
    doc.setFont('helvetica', line.isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(line.color[0], line.color[1], line.color[2]);
    doc.text(line.label, 20, dreLineY);
    doc.text(line.value, 188, dreLineY, { align: 'right' });
    dreLineY += 7;
  });

  curY += 68;

  // Key KPI Cards (3 Colunas)
  const kpiWidth = 58;
  const kpiHeight = 18;
  const kpis = [
    { label: 'PEDIDOS ATENDIDOS', val: `${activeOrders.length} encomendas` },
    { label: 'DOCES VENDIDOS', val: `${totalUnitsSold.toLocaleString('pt-BR')} un` },
    { label: 'TICKET MÉDIO', val: formatCurrency(activeOrders.length > 0 ? netRevenue / activeOrders.length : 0) }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (kpiWidth + 4);
    doc.setFillColor(248, 246, 240);
    doc.roundedRect(x, curY, kpiWidth, kpiHeight, 2, 2, 'F');
    doc.setDrawColor(225, 220, 210);
    doc.roundedRect(x, curY, kpiWidth, kpiHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text(kpi.label, x + kpiWidth / 2, curY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(128, 0, 32);
    doc.text(kpi.val, x + kpiWidth / 2, curY + 14, { align: 'center' });
  });

  curY += 24;

  // Top Products Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('DESEMPENHO & MARGEM POR SABOR DE DOCE', 14, curY);
  curY += 3;

  const topProducts = Object.entries(productsSoldMap)
    .map(([name, data]) => ({
      name,
      ...data,
      margin: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0
    }))
    .sort((a, b) => b.qty - a.qty);

  const productRows = topProducts.map(p => [
    p.name,
    `${p.qty} un`,
    formatCurrency(p.revenue),
    formatCurrency(p.cost),
    formatCurrency(p.profit),
    `${p.margin}%`
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Sabor do Doce', 'Qtd Vendida', 'Faturamento', 'Custo Total', 'Lucro Bruto', 'Margem (%)']],
    body: productRows.length > 0 ? productRows : [['Nenhum doce vendido no período', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
      cellPadding: 2.2
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247]
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [16, 140, 80] },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `S.E Doces Gourmet • Fechamento DRE Oficial • Página ${data.pageNumber} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`fechamento_dre_se_doces_${periodName.toLowerCase()}_${dateStr}.pdf`);
}

/**
 * Exporta a lista preditiva de reposição / compras em PDF
 */
export function exportShoppingListPdf({
  shoppingItems,
  totalEstimatedCost,
  periodDays = 7
}: {
  shoppingItems: { name: string; unit: string; currentStock: number; neededQuantity: number; missingQuantity: number; estimatedCost: number }[];
  totalEstimatedCost: number;
  periodDays?: number;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Header Banner
  doc.setFillColor(128, 0, 32);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('S.E DOCES GOURMET • SUPRIMENTOS', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(243, 229, 171);
  doc.text(`LISTA PREDITIVA DE REPOSIÇÃO & COMPRAS (PRÓXIMOS ${periodDays} DIAS)`, 14, 22);
  doc.text(`Custo Estimado de Compras: ${formatCurrency(totalEstimatedCost)} • Emitido em ${dateFormatted} às ${timeFormatted}`, 14, 27);

  let currentY = 40;

  const tableRows = shoppingItems.map(item => [
    '[  ]',
    item.name,
    `${item.currentStock} ${item.unit}`,
    `${item.neededQuantity.toFixed(2)} ${item.unit}`,
    `${item.missingQuantity.toFixed(2)} ${item.unit}`,
    formatCurrency(item.estimatedCost)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Comprado?', 'Ingrediente / Insumo', 'Estoque Atual', 'Demanda das Encomendas', 'Falta Comprar', 'Custo Estimado']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247]
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: [180, 40, 40] },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`lista_compras_insumos_se_doces_${dateStr}.pdf`);
}

