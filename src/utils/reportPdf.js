import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2)}`

function addHeader(doc, title, dateRange) {
  doc.setFontSize(16)
  doc.text('Varejix - Relatórios', 14, 18)
  doc.setFontSize(12)
  doc.text(title, 14, 26)
  if (dateRange) {
    doc.setFontSize(10)
    doc.text(`Período: ${dateRange}`, 14, 33)
  }
  doc.setDrawColor(66, 153, 225)
  doc.line(14, 36, 196, 36)
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(130)
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' })
  }
}

function salesTable(doc, sales = []) {
  autoTable(doc, {
    startY: 42,
    head: [['ID', 'Data', 'Produto', 'Qtd', 'Preço Unit.', 'Total']],
    body: sales.map((s) => [
      s.id,
      s.date,
      s.product,
      s.quantity,
      formatCurrency(s.unitPrice),
      formatCurrency(s.total)
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 153, 225] }
  })
}

function inventoryTable(doc, items = []) {
  autoTable(doc, {
    startY: 42,
    head: [['ID', 'SKU', 'Produto', 'Estoque', 'Preço', 'Total']],
    body: items.map((i) => [
      i.id,
      i.sku,
      i.name,
      i.stock,
      formatCurrency(i.price),
      formatCurrency((i.stock || 0) * (i.price || 0))
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [72, 187, 120] }
  })
}

function productsTable(doc, products = []) {
  autoTable(doc, {
    startY: 42,
    head: [['ID', 'Produto', 'SKU', 'Preço']],
    body: products.map((p) => [p.id, p.name, p.sku, formatCurrency(p.price)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [159, 122, 234] }
  })
}

function overview(doc, { stats = {}, sales = [], inventory = [] }) {
  const startY = 42
  const metrics = [
    ['Receita Total', formatCurrency(stats.totalSales)],
    ['Vendas (mês)', stats.monthlySales || 0],
    ['Ticket Médio', formatCurrency(stats.averageTicket)],
    ['Produtos', stats.totalProducts || 0],
    ['Clientes', stats.totalCustomers || 0],
    ['Estoque Baixo', stats.lowStockItems || 0]
  ]

  autoTable(doc, {
    startY,
    head: [['Métrica', 'Valor']],
    body: metrics,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [66, 153, 225] }
  })

  const nextY = doc.lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: nextY,
    head: [['Top Vendas', 'Qtd', 'Total']],
    body: sales.slice(0, 8).map((s) => [s.product, s.quantity, formatCurrency(s.total)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [72, 187, 120] }
  })

  const nextY2 = doc.lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: nextY2,
    head: [['Estoque', 'Qtd']],
    body: inventory.slice(0, 8).map((i) => [i.name, i.stock]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [237, 137, 54] }
  })
}

export function generateReportPdf({ type, dateRange, sales = [], inventory = [], products = [], stats = {} }) {
  const doc = new jsPDF()

  const titles = {
    sales: 'Relatório de Vendas',
    inventory: 'Relatório de Estoque',
    products: 'Relatório de Produtos',
    overview: 'Relatório Executivo'
  }

  const title = titles[type] || 'Relatório'
  addHeader(doc, title, dateRange)

  if (type === 'sales') {
    salesTable(doc, sales)
  } else if (type === 'inventory') {
    inventoryTable(doc, inventory)
  } else if (type === 'products') {
    productsTable(doc, products)
  } else {
    overview(doc, { stats, sales, inventory })
  }

  addFooter(doc)
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`)
}
