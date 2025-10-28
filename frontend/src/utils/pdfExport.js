import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Company branding
const COMPANY_NAME = 'WindPOS';
const COMPANY_TAGLINE = 'for restaurants';
const POWERED_BY = 'Powered by CodesWind';
const COMPANY_CONTACT = '📱 0722440666 | 🌐 codeswind.cloud';

// PDF styling constants
const COLORS = {
  primary: [59, 130, 246],    // Blue
  secondary: [100, 116, 139], // Gray
  success: [34, 197, 94],     // Green
  danger: [239, 68, 68],      // Red
  warning: [251, 146, 60],    // Orange
  header: [30, 41, 59],       // Dark blue
  text: [51, 65, 85]          // Gray text
};

/**
 * Add header with company branding to PDF
 */
const addHeader = (doc, title) => {
  const pageWidth = doc.internal.pageSize.width;

  // Company name and tagline
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'italic');
  doc.text(COMPANY_TAGLINE, pageWidth / 2, 27, { align: 'center' });

  // Report title
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.header);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 38, { align: 'center' });

  // Date range (if applicable)
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${currentDate}`, pageWidth / 2, 45, { align: 'center' });

  // Separator line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 48, pageWidth - 14, 48);

  return 52; // Return Y position for content start
};

/**
 * Add footer with company details to each page
 */
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer separator line
    doc.setDrawColor(...COLORS.secondary);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    // Company branding
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(POWERED_BY, 14, pageHeight - 13);

    // Contact info
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.text(COMPANY_CONTACT, pageWidth / 2, pageHeight - 13, { align: 'center' });

    // Page number
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 13, { align: 'right' });
  }
};

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount || 0).replace('LKR', 'Rs.');
};

/**
 * Format number with thousand separators
 */
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

/**
 * Export Sales Report to PDF
 */
export const exportSalesPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Sales Report');

  // Date range
  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Summary metrics
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('Summary', 14, yPos);
  yPos += 6;

  const summary = reportData.summary || reportData;
  const summaryData = [
    ['Total Sales', formatCurrency(summary.total_sales || 0)],
    ['Total Orders', formatNumber(summary.total_orders || 0)],
    ['Average Order Value', formatCurrency(summary.average_order_value || 0)],
    ['Completed Orders', formatNumber(summary.completed_orders || 0)],
    ['Cancelled Orders', formatNumber(summary.cancelled_orders || 0)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold' }
    },
    margin: { left: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Sales by Order Type
  const salesByType = reportData.by_type || reportData.sales_by_type || [];
  if (salesByType.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Sales by Order Type', 14, yPos);
    yPos += 6;

    const typeHeaders = [['Order Type', 'Orders', 'Total Sales', 'Avg Order']];
    const typeBody = salesByType.map(item => [
      item.order_type,
      formatNumber(item.count),
      formatCurrency(item.total),
      formatCurrency(item.total / item.count)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: typeHeaders,
      body: typeBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Top Selling Items
  const topItems = reportData.top_items || [];
  if (topItems.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Top Selling Items', 14, yPos);
    yPos += 6;

    const itemHeaders = [['Item', 'Quantity', 'Revenue']];
    const itemBody = topItems.slice(0, 10).map(item => [
      item.name,
      formatNumber(item.total_quantity),
      formatCurrency(item.total_revenue)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: itemHeaders,
      body: itemBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    });
  }

  addFooter(doc);
  doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export Orders Report to PDF
 */
export const exportOrdersPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Orders Report');

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Summary
  const summaryData = [
    ['Total Orders', formatNumber(reportData.total_orders || 0)],
    ['Completed', formatNumber(reportData.completed_orders || 0)],
    ['On Hold', formatNumber(reportData.hold_orders || 0)],
    ['Cancelled', formatNumber(reportData.cancelled_orders || 0)],
    ['Completion Rate', `${(reportData.completion_rate || 0).toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Orders by Status breakdown
  const totalOrders = reportData.total_orders || 0;
  if (totalOrders > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Orders by Status', 14, yPos);
    yPos += 6;

    const headers = [['Status', 'Count', 'Percentage']];
    const body = [
      ['Completed', formatNumber(reportData.completed_orders || 0), `${((reportData.completed_orders / totalOrders) * 100).toFixed(1)}%`],
      ['On Hold', formatNumber(reportData.hold_orders || 0), `${((reportData.hold_orders / totalOrders) * 100).toFixed(1)}%`],
      ['Cancelled', formatNumber(reportData.cancelled_orders || 0), `${((reportData.cancelled_orders / totalOrders) * 100).toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
    });
  }

  addFooter(doc);
  doc.save(`Orders_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export Expenses Report to PDF
 */
export const exportExpensesPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Expenses Report');

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Calculate largest expense
  const expenses = reportData.expenses || [];
  const largestExpense = expenses.length > 0
    ? Math.max(...expenses.map(e => parseFloat(e.amount || 0)))
    : 0;

  // Summary
  const summaryData = [
    ['Total Expenses', formatCurrency(reportData.total_expenses || 0)],
    ['Number of Expenses', formatNumber(reportData.total_items || 0)],
    ['Average Expense', formatCurrency(reportData.average_expense || 0)],
    ['Largest Expense', formatCurrency(largestExpense)]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', textColor: COLORS.danger, fontStyle: 'bold' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Expense details
  if (expenses.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Expense Details', 14, yPos);
    yPos += 6;

    const headers = [['Date', 'Description', 'Amount']];
    const body = expenses.map(expense => [
      new Date(expense.date || expense.created_at).toLocaleDateString(),
      expense.description || expense.note || 'N/A',
      formatCurrency(expense.amount)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: COLORS.danger, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 2: { halign: 'right' } }
    });
  }

  addFooter(doc);
  doc.save(`Expenses_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export Profit Report to PDF
 */
export const exportProfitPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Profit & Loss Report');

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Summary
  const summaryData = [
    ['Total Revenue', formatCurrency(reportData.total_sales || 0)],
    ['Total Expenses', formatCurrency(reportData.total_expenses || 0)],
    ['Net Profit', formatCurrency(reportData.net_profit || 0)],
    ['Profit Margin', `${(reportData.profit_margin || 0).toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      if (data.row.index === 2) { // Net Profit row
        data.cell.styles.textColor = (reportData.net_profit || 0) >= 0 ? COLORS.success : COLORS.danger;
      }
    }
  });

  addFooter(doc);
  doc.save(`Profit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export Menu Performance Report to PDF
 */
export const exportMenuPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Menu Performance Report');

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Menu Summary
  const summaryData = [
    ['Total Menu Items', formatNumber(reportData.total_items || 0)],
    ['Active Items', formatNumber(reportData.active_items || 0)],
    ['Inactive Items', formatNumber(reportData.inactive_items || 0)],
    ['Average Price', formatCurrency(reportData.avg_price || 0)]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Category Breakdown
  if (reportData.category_breakdown && reportData.category_breakdown.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Category Breakdown', 14, yPos);
    yPos += 6;

    const headers = [['Category', 'Items', 'Avg Price']];
    const body = reportData.category_breakdown.map(cat => [
      cat.name,
      formatNumber(cat.count),
      formatCurrency(cat.avgPrice || cat.avg_price || 0)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
    });
  }

  addFooter(doc);
  doc.save(`Menu_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export Customer Analytics Report to PDF
 */
export const exportCustomersPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Customer Analytics Report');

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Summary
  const summaryData = [
    ['Total Customers', formatNumber(reportData.total_customers || 0)],
    ['New Customers', formatNumber(reportData.new_customers || 0)],
    ['Repeat Customers', formatNumber(reportData.repeat_customers || 0)],
    ['Loyal Customers (5+ orders)', formatNumber(reportData.loyal_customers || 0)],
    ['Average Orders per Customer', (reportData.avg_orders_per_customer || 0).toFixed(1)],
    ['Average Customer Value', formatCurrency(reportData.avg_customer_value || 0)]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text },
      1: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Top Customer (Best Customer)
  if (reportData.top_customer && reportData.top_customer.name) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text('Top Customer', 14, yPos);
    yPos += 6;

    const topCust = reportData.top_customer;
    const topCustomerData = [
      ['Name', topCust.name || 'N/A'],
      ['Mobile', topCust.mobile || 'N/A'],
      ['Total Orders', formatNumber(topCust.orderCount || 0)],
      ['Total Spent', formatCurrency(topCust.totalSpent || 0)],
      ['Average Order Value', formatCurrency(topCust.avgOrderValue || 0)]
    ];

    autoTable(doc, {
      startY: yPos,
      body: topCustomerData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: COLORS.text },
        1: { halign: 'right', textColor: [0, 188, 212], fontStyle: 'bold' }
      }
    });
  }

  addFooter(doc);
  doc.save(`Customer_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generic export function for other report types
 */
export const exportGenericPDF = (title, reportData, dateRange) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, title);

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    yPos += 10;
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, yPos);
    yPos += 8;
  }

  // Add data as table if it's an array
  if (Array.isArray(reportData) && reportData.length > 0) {
    const headers = [Object.keys(reportData[0])];
    const body = reportData.map(row => Object.values(row));

    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });
  } else {
    // Display as key-value pairs
    const data = Object.entries(reportData).map(([key, value]) => [
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      typeof value === 'number' ? formatNumber(value) : value
    ]);

    autoTable(doc, {
      startY: yPos,
      body: data,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: COLORS.text },
        1: { halign: 'right', textColor: COLORS.primary }
      }
    });
  }

  addFooter(doc);
  const filename = `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
