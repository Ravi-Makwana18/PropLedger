import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Build and download a deal PDF (same layout as Deal Details “Download Report”).
 *
 * @param {object} input
 * @param {object} input.deal — Mongoose/API deal document
 * @param {Array} [input.payments]
 * @param {number} input.totalPaid
 * @param {number} input.remainingAmount
 * @param {number} input.bankPaid
 * @param {number} input.otherPaid
 * @param {number} input.jantriAmount
 * @param {number} input.otherAmount
 * @param {number} input.jantriRemaining
 * @param {number} input.otherRemaining
 * @param {number} input.buyBrokeringPercent
 * @param {number} input.sellCpIncentiveRate
 * @param {number} input.planpassRatePerSqMtr
 * @param {number} input.naRatePerSqMtr
 * @param {number} input.buyBrokeringTotal
 * @param {number} input.sellCpIncentiveTotal
 * @param {number} input.planpassTotal
 * @param {number} input.naTotal
 */
export function generateDealPdf({
  deal,
  payments = [],
  totalPaid,
  remainingAmount,
  bankPaid,
  otherPaid,
  jantriAmount,
  otherAmount,
  jantriRemaining,
  otherRemaining,
  buyBrokeringPercent,
  sellCpIncentiveRate,
  planpassRatePerSqMtr,
  naRatePerSqMtr,
  buyBrokeringTotal,
  sellCpIncentiveTotal,
  planpassTotal,
  naTotal,
}) {
  const bPaid = bankPaid;
  const oPaid = otherPaid;
  const jRem = jantriRemaining;
  const oRem = otherRemaining;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatShortDate = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const formatPDFCurrency = (amount) => {
    const rounded = Math.round(amount);
    const str = rounded.toString();
    let result = '';
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) result = ',' + result;
      result = str[i] + result;
      count++;
    }
    return 'Rs. ' + result;
  };

  const formatNumber = (num) => {
    const str = num.toString();
    let result = '';
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) result = ',' + result;
      result = str[i] + result;
      count++;
    }
    return result;
  };

  const drawPageBorder = (d) => {
    const pw = d.internal.pageSize.width;
    const ph = d.internal.pageSize.height;
    const margin = 5;

    d.setDrawColor(120, 120, 120);
    d.setLineWidth(0.6);
    d.roundedRect(margin, margin, pw - 2 * margin, ph - 2 * margin, 2, 2);
  };

  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${deal.villageName} - ${'Survey No.'}${deal.newSurveyNo || deal.surveyNumber}`, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(200, 160, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Broker Name: ' + deal.brokerName, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text('Deal Details', pageWidth / 2, 44, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  let yPos = 55;

  const printRow = (label1, value1, label2, value2, y) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label1, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value1.toString(), 55, y);
    if (label2 && value2) {
      doc.setFont('helvetica', 'bold');
      doc.text(label2, 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value2.toString(), 155, y);
    }
  };

  printRow('District:', deal.district || 'N/A', 'Sub-District:', deal.subDistrict || 'N/A', yPos);
  yPos += 8;

  printRow('Village:', deal.villageName, 'Deal Type:', deal.dealType || 'Buy', yPos);
  yPos += 8;

  printRow('NA Type:', deal.naType || 'N/A', 'Deal Date:', deal.dealDate ? formatDate(deal.dealDate) : 'N/A', yPos);
  yPos += 8;

  printRow('Old Survey No.:', deal.oldSurveyNo || 'N/A', 'New Survey No.:', deal.newSurveyNo || deal.surveyNumber || 'N/A', yPos);
  yPos += 8;

  printRow('Unit Price:', formatPDFCurrency(deal.pricePerSqYard), 'Total Area (sq. yds):', formatNumber(deal.totalSqYard), yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatPDFCurrency(deal.totalAmount), 55, yPos);
  yPos += 8;

  printRow(
    'Jantri (per sq. mtr):',
    deal.jantri > 0 ? formatPDFCurrency(deal.jantri) : 'N/A',
    'Total Area (sq. mtr):',
    deal.totalSqMeter > 0 ? formatNumber(deal.totalSqMeter) : 'N/A',
    yPos
  );
  yPos += 8;

  if (deal.tdsAmount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('JR Amount (Before):', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatPDFCurrency(deal.whitePaymentBeforeTDS || 0), 55, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('TDS (1%):', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatPDFCurrency(deal.tdsAmount), 55, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('JR Amount (After):', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatPDFCurrency(deal.whitePayment || 0), 55, yPos);
    yPos += 8;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('JR Amount:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(deal.whitePayment > 0 ? formatPDFCurrency(deal.whitePayment) : 'N/A', 55, yPos);
    yPos += 8;
  }

  const amount25 = deal.totalAmount * 0.25;
  const amount75 = deal.totalAmount * 0.75;
  printRow('25% Amount:', formatPDFCurrency(amount25), '75% Amount:', formatPDFCurrency(amount75), yPos);
  yPos += 8;

  printRow(
    '25% Deadline:',
    deal.deadlineStartDate ? formatDate(deal.deadlineStartDate) : 'N/A',
    '75% Deadline:',
    deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : 'N/A',
    yPos
  );
  yPos += 8;

  if (deal.addMoreEntries && deal.addMoreEntries.length > 0) {
    yPos += 6;
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('Milestone Schedule', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    const addMoreRows = deal.addMoreEntries.map((entry, index) => [
      index + 1,
      `${entry.percentage || 0}%`,
      formatShortDate(entry.date),
      formatPDFCurrency(entry.amount || 0),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Sr.', 'Percentage', 'Date', 'Amount']],
      body: addMoreRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      tableWidth: 146,
      margin: { left: (pageWidth - 146) / 2 },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 38, halign: 'center' },
        2: { cellWidth: 44, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 6;
  }

  yPos += 18;
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Total Amount', 'JR Amount', 'Other Amount']],
    body: [
      ['Deal Amount', formatPDFCurrency(deal.totalAmount), formatPDFCurrency(jantriAmount || 0), formatPDFCurrency(otherAmount || 0)],
      ['Total Paid Amount', formatPDFCurrency(totalPaid), formatPDFCurrency(bPaid || 0), formatPDFCurrency(oPaid || 0)],
      ['Remaining Amount', formatPDFCurrency(remainingAmount), formatPDFCurrency(jRem), formatPDFCurrency(oRem)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 42 },
      2: { cellWidth: 42 },
      3: { cellWidth: 42 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fillColor = [255, 240, 100];
        data.cell.styles.textColor = [60, 40, 0];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  if (payments && payments.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment History', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    const paymentRows = payments.map((payment, index) => [
      index + 1,
      formatShortDate(payment.date),
      payment.modeOfPayment === 'Bank' ? formatPDFCurrency(payment.amount) : ' ',
      payment.modeOfPayment === 'Other' ? formatPDFCurrency(payment.amount) : ' ',
      payment.remarks || ' ',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Sr.', 'Date', 'Bank', 'Other', 'Remarks']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 64, overflow: 'linebreak' },
      },
      styles: { overflow: 'linebreak', cellPadding: 3, fontSize: 9 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: [['PAID AMOUNT', formatPDFCurrency(totalPaid)]],
      theme: 'grid',
      head: [],
      margin: { left: 42, right: 42 },
      tableWidth: 126,
      styles: {
        fontStyle: 'bold',
        fontSize: 11,
        textColor: [6, 95, 70],
        fillColor: [220, 252, 231],
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [187, 247, 208],
        lineWidth: 0.4,
      },
      columnStyles: {
        0: { cellWidth: 56, halign: 'left' },
        1: { cellWidth: 70, halign: 'right' },
      },
    });

    let sectionY = doc.lastAutoTable.finalY + 16;
    if (deal.notes) {
      let notesStartY = sectionY;
      const notesX = 14;
      const notesWidth = pageWidth - 28;
      const notePaddingX = 4;
      const notePaddingY = 4;

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      const noteLines = doc.splitTextToSize(deal.notes, notesWidth - notePaddingX * 2);
      const lineHeight = 6;
      const textBlockHeight = noteLines.length * lineHeight;
      const boxHeight = textBlockHeight + notePaddingY * 2;
      const requiredHeight = 4 + boxHeight + 8;

      if (notesStartY + requiredHeight > pageHeight - 14) {
        doc.addPage();
        notesStartY = 20;
      }

      doc.text('Notes:', notesX, notesStartY);

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 245);
      doc.roundedRect(notesX, notesStartY + 4, notesWidth, boxHeight, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(noteLines, notesX + notePaddingX, notesStartY + 4 + notePaddingY + 1);
      sectionY = notesStartY + boxHeight + 20;
    }

    const additionalExpenseRows = [
      ['Payable - Brokering Expense', `${buyBrokeringPercent}%`, formatPDFCurrency(buyBrokeringTotal)],
      ['C. P. Incentive Expense', formatPDFCurrency(sellCpIncentiveRate), formatPDFCurrency(sellCpIncentiveTotal)],
      ['Plan Pass Expense', formatPDFCurrency(planpassRatePerSqMtr), formatPDFCurrency(planpassTotal)],
      ['NA Expense', formatPDFCurrency(naRatePerSqMtr), formatPDFCurrency(naTotal)],
    ];

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Expenses', pageWidth / 2, sectionY, { align: 'center' });
    sectionY += 6;

    autoTable(doc, {
      startY: sectionY,
      head: [['Expense Head', 'Rate or %', 'Total Value']],
      body: additionalExpenseRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 62, halign: 'right' },
      },
    });
  } else {
    let sectionY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 16 : yPos + 14;
    const additionalExpenseRowsNoPayments = [
      ['Buy - Brokering expenses', `${buyBrokeringPercent}%`, formatPDFCurrency(buyBrokeringTotal)],
      ['Sell - C. P. Incentive expenses', formatPDFCurrency(sellCpIncentiveRate), formatPDFCurrency(sellCpIncentiveTotal)],
      ['Planpass Expenses', formatPDFCurrency(planpassRatePerSqMtr), formatPDFCurrency(planpassTotal)],
      ['NA expenses', formatPDFCurrency(naRatePerSqMtr), formatPDFCurrency(naTotal)],
    ];

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Expenses', pageWidth / 2, sectionY, { align: 'center' });
    sectionY += 6;

    autoTable(doc, {
      startY: sectionY,
      head: [['Expense Head', 'Rate / %', 'Total Value']],
      body: additionalExpenseRowsNoPayments,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 62, halign: 'right' },
      },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    drawPageBorder(doc);

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Powered by PropLedger', pageWidth - 10, pageHeight - 8, { align: 'right' });
  }

  doc.save(`${deal.villageName}_${deal.surveyNumber}_${deal.dealType}.pdf`);
}
