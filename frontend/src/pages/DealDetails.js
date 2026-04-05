import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DealDetails.css';

/* ─────────────────────────────────────────────
   Small helper components (no logic change)
───────────────────────────────────────────── */
const InfoPill = ({ label, value, accent }) => (
  <div className={`dd-info-pill${accent ? ' dd-info-pill--accent' : ''}`}>
    <span className="dd-pill-label">{label}</span>
    <span className="dd-pill-value">{value}</span>
  </div>
);

const StatCard = ({ label, value, variant }) => (
  <div className={`dd-stat-card dd-stat-card--${variant}`}>
    <span className="dd-stat-label">{label}</span>
    <span className="dd-stat-value">{value}</span>
  </div>
);

const modeColors = {
  Bank: { bg: '#dbeafe', color: '#1e40af' },
  Other: { bg: '#f3f4f6', color: '#374151' },
};

const PaymentModeBadge = ({ mode }) => {
  const style = modeColors[mode] || modeColors.Other;
  return (
    <span className="dd-mode-badge" style={{ background: style.bg, color: style.color }}>
      {mode}
    </span>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const DealDetails = () => {
  const { id } = useParams();

  const { isAdmin } = useAuth();

  // ── State ────────────────────────────────────────────────────────────────
  const [dealData, setDealData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    modeOfPayment: 'Bank',
    amount: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [confirmDeletePaymentId, setConfirmDeletePaymentId] = useState(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    date: '',
    modeOfPayment: '',
    amount: '',
    remarks: ''
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expandedSections, setExpandedSections] = useState([]); // Default all sections closed for mobile

  // Toggle section expansion for mobile
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // ── On mount / deal-id change: load deal + payments ──────────────────────

  useEffect(() => {
    fetchDealDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── API: fetch full deal + payment history ──────────────────────────────
  const fetchDealDetails = async () => {
    try {
      const { data } = await API.get(`/api/deals/${id}`);
      setDealData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deal details');
    } finally {
      setLoading(false);
    }
  };

  // ── API: add a new payment to this deal ───────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingPayment(true);
    try {
      const { data: newPayment } = await API.post('/api/payments', {
        dealId: id,
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });
      // Update local state — all payments count toward totalPaid
      const newAmount = parseFloat(paymentForm.amount);
      const newMode = paymentForm.modeOfPayment;

      setDealData(prev => ({
        ...prev,
        payments: [newPayment, ...prev.payments],
        totalPaid: prev.totalPaid + newAmount,
        remainingAmount: prev.remainingAmount - newAmount,
        bankPaid: newMode === 'Bank' ? (prev.bankPaid || 0) + newAmount : (prev.bankPaid || 0),
        otherPaid: newMode === 'Other' ? (prev.otherPaid || 0) + newAmount : (prev.otherPaid || 0),
        jantriRemaining: newMode === 'Bank' ? (prev.jantriRemaining || 0) - newAmount : (prev.jantriRemaining || 0),
        otherRemaining: newMode === 'Other' ? (prev.otherRemaining || 0) - newAmount : (prev.otherRemaining || 0)
      }));
      setSuccess('Payment added successfully');
      setShowPaymentForm(false);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        modeOfPayment: 'Bank',
        amount: '',
        remarks: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // ── API: delete payment — 600 ms buffer shows processing spinner ──────────
  const handleDeletePayment = async (paymentId) => {
    setError('');
    setSuccess('');
    setIsDeletingPayment(true);
    setTimeout(async () => {
      try {
        await API.delete(`/api/payments/${paymentId}`);
        const deleted = dealData.payments.find(p => p._id === paymentId);
        const deletedAmount = deleted ? deleted.amount : 0;
        const deletedMode = deleted ? deleted.modeOfPayment : null;

        setDealData(prev => ({
          ...prev,
          payments: prev.payments.filter(p => p._id !== paymentId),
          totalPaid: prev.totalPaid - deletedAmount,
          remainingAmount: prev.remainingAmount + deletedAmount,
          bankPaid: deletedMode === 'Bank' ? (prev.bankPaid || 0) - deletedAmount : (prev.bankPaid || 0),
          otherPaid: deletedMode === 'Other' ? (prev.otherPaid || 0) - deletedAmount : (prev.otherPaid || 0),
          jantriRemaining: deletedMode === 'Bank' ? (prev.jantriRemaining || 0) + deletedAmount : (prev.jantriRemaining || 0),
          otherRemaining: deletedMode === 'Other' ? (prev.otherRemaining || 0) + deletedAmount : (prev.otherRemaining || 0)
        }));
        setConfirmDeletePaymentId(null);
        setSuccess('Payment deleted successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete payment');
      } finally {
        setIsDeletingPayment(false);
      }
    }, 600);
  };

  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment._id);
    setEditPaymentForm({
      date: new Date(payment.date).toISOString().split('T')[0],
      modeOfPayment: payment.modeOfPayment,
      amount: payment.amount,
      remarks: payment.remarks || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditPaymentForm({ date: '', modeOfPayment: '', amount: '', remarks: '' });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (paymentId) => {
    setError('');
    setSuccess('');
    setIsSavingPayment(true);
    try {
      const { data: updatedPayment } = await API.put(`/api/payments/${paymentId}`, {
        ...editPaymentForm,
        amount: parseFloat(editPaymentForm.amount)
      });
      // Update local state — all payments count toward totalPaid
      const oldPayment = dealData.payments.find(p => p._id === paymentId);
      const oldAmount = oldPayment ? oldPayment.amount : 0;
      const oldMode = oldPayment ? oldPayment.modeOfPayment : null;
      const newAmount = updatedPayment.amount;
      const newMode = updatedPayment.modeOfPayment;

      setDealData(prev => ({
        ...prev,
        payments: prev.payments.map(p => p._id === paymentId ? updatedPayment : p),
        totalPaid: prev.totalPaid - oldAmount + newAmount,
        remainingAmount: prev.remainingAmount + oldAmount - newAmount,
        // Reverse old mode contribution, apply new mode contribution
        bankPaid: (prev.bankPaid || 0)
          - (oldMode === 'Bank' ? oldAmount : 0)
          + (newMode === 'Bank' ? newAmount : 0),
        otherPaid: (prev.otherPaid || 0)
          - (oldMode === 'Other' ? oldAmount : 0)
          + (newMode === 'Other' ? newAmount : 0),
        jantriRemaining: (prev.jantriRemaining || 0)
          + (oldMode === 'Bank' ? oldAmount : 0)
          - (newMode === 'Bank' ? newAmount : 0),
        otherRemaining: (prev.otherRemaining || 0)
          + (oldMode === 'Other' ? oldAmount : 0)
          - (newMode === 'Other' ? newAmount : 0)
      }));

      setSuccess('Payment updated successfully');
      setEditingPaymentId(null);
      setEditPaymentForm({ date: '', modeOfPayment: '', amount: '', remarks: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const updatedPayments = [...dealData.payments];
    const [draggedItem] = updatedPayments.splice(draggedIndex, 1);
    updatedPayments.splice(dropIndex, 0, draggedItem);
    setDealData({ ...dealData, payments: updatedPayments });
    setDraggedIndex(null);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });



  const generatePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

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

      const drawPageBorder = (doc) => {
        const pw = doc.internal.pageSize.width;
        const ph = doc.internal.pageSize.height;
        const margin = 5;

        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.6);
        doc.roundedRect(margin, margin, pw - 2 * margin, ph - 2 * margin, 2, 2);
      };

      // Village name and survey number
      doc.setFontSize(20);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`${deal.villageName} - ${'Survey No.'}${deal.newSurveyNo || deal.surveyNumber}`, pageWidth / 2, 20, { align: 'center' });

      // Broker Name
      doc.setFontSize(14);
      doc.setTextColor(200, 160, 40);
      doc.setFont("helvetica", "bold");
      doc.text('Broker Name: ' + deal.brokerName, pageWidth / 2, 28, { align: 'center' });



      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text('Deal Details', pageWidth / 2, 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let yPos = 50;


      // Helper function to print two columns
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

      // District and Sub-District
      printRow('District:', deal.district || 'N/A', 'Sub-District:', deal.subDistrict || 'N/A', yPos);
      yPos += 8;

      // // Broker Name (if exists)
      // if (deal.brokerName) {
      //   doc.setFont('helvetica', 'bold');
      //   doc.text('Broker Name:', 14, yPos);
      //   doc.setFont('helvetica', 'normal');
      //   doc.text(deal.brokerName, 55, yPos);
      //   yPos += 8;
      // }


      // Village and deal type
      printRow('Village:', deal.villageName, 'Deal Type:', deal.dealType || 'Buy', yPos);
      yPos += 8;


      // NA Type (if exists)
      printRow('NA Type:', deal.naType || 'N/A', 'Deal Date:', deal.dealDate ? formatDate(deal.dealDate) : 'N/A', yPos);
      yPos += 8;
      // if (deal.naType) {
      //   doc.setFont('helvetica', 'bold');
      //   doc.text('NA Type:', 14, yPos);
      //   doc.setFont('helvetica', 'normal');
      //   doc.text(deal.naType, 55, yPos);
      //   yPos += 8;
      // }

      // Old Survey No. and New Survey No.
      printRow('Old Survey No.:', deal.oldSurveyNo || 'N/A', 'New Survey No.:', deal.newSurveyNo || deal.surveyNumber || 'N/A', yPos);
      yPos += 8;

      // Unit Price and Total Area
      printRow('Unit Price:', formatPDFCurrency(deal.pricePerSqYard), 'Total Area (sq. yds):', formatNumber(deal.totalSqYard), yPos);
      yPos += 8;

      // Total Amount (full width)
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatPDFCurrency(deal.totalAmount), 55, yPos);
      yPos += 8;

      // Jantri and Total Sq. mtr
      printRow('Jantri (per sq. mtr):', deal.jantri > 0 ? formatPDFCurrency(deal.jantri) : 'N/A', 'Total Area (sq. mtr):', deal.totalSqMeter > 0 ? formatNumber(deal.totalSqMeter) : 'N/A', yPos);
      yPos += 8;

      // White amount calculation with TDS from database
      if (deal.tdsAmount > 0) {
        // Show white payment before TDS
        doc.setFont('helvetica', 'bold');
        doc.text('JR Amount (Before):', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatPDFCurrency(deal.whitePaymentBeforeTDS || 0), 55, yPos);
        yPos += 8;

        // Show TDS amount
        doc.setFont('helvetica', 'bold');
        doc.text('TDS (1%):', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatPDFCurrency(deal.tdsAmount), 55, yPos);
        yPos += 8;

        // Show white payment after TDS
        doc.setFont('helvetica', 'bold');
        doc.text('JR Amount (After):', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatPDFCurrency(deal.whitePayment || 0), 55, yPos);
        yPos += 8;
      } else {
        // Show white amount (no TDS)
        doc.setFont('helvetica', 'bold');
        doc.text('JR Amount:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(deal.whitePayment > 0 ? formatPDFCurrency(deal.whitePayment) : 'N/A', 55, yPos);
        yPos += 8;
      }
      // 25% amount and 75% amount
      const amount25 = deal.totalAmount * 0.25;
      const amount75 = deal.totalAmount * 0.75;
      printRow('25% Amount:', formatPDFCurrency(amount25), '75% Amount:', formatPDFCurrency(amount75), yPos);
      yPos += 8;

      // 25% Deadline and 75% Deadline
      printRow('25% Deadline:', deal.deadlineStartDate ? formatDate(deal.deadlineStartDate) : 'N/A', '75% Deadline:', deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : 'N/A', yPos);
      yPos += 8;

      yPos += 8;
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Summary', pageWidth / 2, yPos, { align: 'center' });
      yPos += 3;

      // Total Amount Summary Table
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      // doc.text('Total Amount Summary:', 14, yPos);
      yPos += 2;

      const { bankPaid: bPaid, otherPaid: oPaid, jantriRemaining: jRem, otherRemaining: oRem } = dealData;
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Total Amount', 'JR Amount', 'Other Amount']],
        body: [
          ['Target Amount', formatPDFCurrency(deal.totalAmount), formatPDFCurrency(jantriAmount || 0), formatPDFCurrency(otherAmount || 0)],
          ['Total Paid', formatPDFCurrency(totalPaid), formatPDFCurrency(bPaid || 0), formatPDFCurrency(oPaid || 0)],
          ['Remaining', formatPDFCurrency(remainingAmount), formatPDFCurrency(jRem), formatPDFCurrency(oRem)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 42 },
          2: { cellWidth: 42 },
          3: { cellWidth: 42 }
        },
        didParseCell: (data) => {
          // Highlight the Remaining row (index 2) in yellow
          if (data.section === 'body' && data.row.index === 2) {
            data.cell.styles.fillColor = [255, 240, 100];
            data.cell.styles.textColor = [60, 40, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Notes section — below payment summary
      if (deal.notes) {
        const notesStartY = doc.lastAutoTable.finalY + 12;
        const notesX = 14;
        const notesWidth = pageWidth - 28;

        // Label
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', notesX, notesStartY);

        // Box
        const noteLines = doc.splitTextToSize(deal.notes, notesWidth - 8);
        const lineHeight = 6;
        const boxHeight = noteLines.length * lineHeight + 10;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 245);
        doc.roundedRect(notesX, notesStartY + 4, notesWidth, boxHeight, 2, 2, 'FD');

        // Text inside box
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(noteLines, notesX + 4, notesStartY + 4 + lineHeight);
      }

      // // Jantri / Other Amount Summary Table
      // yPos = doc.lastAutoTable.finalY + 10;
      // doc.setFontSize(12);
      // doc.setTextColor(0, 0, 0);
      // doc.text('Amount Breakdown:', 14, yPos);
      // yPos += 5;


      if (payments && payments.length > 0) {
        // Start payment history on a new page
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment History', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        const formatShortDate = (date) => {
          const d = new Date(date);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };

        const paymentRows = payments.map((payment, index) => [
          index + 1,
          formatShortDate(payment.date),
          payment.modeOfPayment === 'Bank' ? formatPDFCurrency(payment.amount) : ' ',
          payment.modeOfPayment === 'Other' ? formatPDFCurrency(payment.amount) : ' ',
          payment.remarks || ' '
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
            1: { cellWidth: 28 },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' },
            4: { cellWidth: 64, overflow: 'linebreak' }
          },
          styles: { overflow: 'linebreak', cellPadding: 3, fontSize: 9 }
        });

        // Show totals
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          body: [
            ['PAID AMOUNT', '', formatPDFCurrency(totalPaid), ''],
            ['PENDING AMOUNT', '', formatPDFCurrency(remainingAmount), '']
          ],
          theme: 'plain',
          styles: { fontStyle: 'bold', fillColor: [210, 250, 230] },
          margin: { left: 30, right: 30 }
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.height;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        drawPageBorder(doc);

        // Footer - Generated date and page number
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleString('en-IN')} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );

        // App branding - bottom right corner
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
          'Powered by PropLedger',
          pageWidth - 10,
          pageHeight - 8,
          { align: 'right' }
        );
      }

      doc.save(`${deal.villageName}_${deal.surveyNumber}.pdf`);
      setIsGeneratingPDF(false);
    }, 800);
  };



  /* ── Loading / Error States ── */
  if (loading) {
    return (
      <div className="dd-page">
        <div className="dd-wrapper">
          {/* Header skeleton */}
          <div className="dd-page-header" style={{ marginBottom: '1.5rem' }}>
            <div className="dd-sk-line" style={{ width: 70, height: 32, borderRadius: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <div className="dd-sk-line" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div>
                <div className="dd-sk-line" style={{ width: 200, height: 22, marginBottom: 8 }} />
                <div className="dd-sk-line" style={{ width: 140, height: 14 }} />
              </div>
            </div>
          </div>

          {/* Deal info grid skeleton */}
          <div className="dd-section">
            <div className="dd-sk-line" style={{ width: 160, height: 18, marginBottom: '1rem' }} />
            <div className="dd-info-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="dd-sk-pill">
                  <div className="dd-sk-line" style={{ width: '50%', height: 12, marginBottom: 8 }} />
                  <div className="dd-sk-line" style={{ width: '75%', height: 18 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary skeleton */}
          <div className="dd-section">
            <div className="dd-sk-line" style={{ width: 180, height: 18, marginBottom: '1rem' }} />
            <div className="dd-stat-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="dd-sk-stat">
                  <div className="dd-sk-line" style={{ width: '60%', height: 13, marginBottom: 10 }} />
                  <div className="dd-sk-line" style={{ width: '85%', height: 26 }} />
                </div>
              ))}
            </div>
            <div className="dd-sk-line" style={{ width: '100%', height: 10, borderRadius: 99, marginTop: '1.25rem' }} />
          </div>

          {/* Payment rows skeleton */}
          <div className="dd-section">
            <div className="dd-sk-line" style={{ width: 170, height: 18, marginBottom: '1rem' }} />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dd-sk-row">
                <div className="dd-sk-line" style={{ width: 90, height: 14 }} />
                <div className="dd-sk-line" style={{ width: 60, height: 14 }} />
                <div className="dd-sk-line" style={{ width: 90, height: 14 }} />
                <div className="dd-sk-line" style={{ width: 120, height: 14 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dealData) {
    return (
      <div className="dd-page">
        <div className="dd-error-banner"><span>⚠️</span> Deal not found</div>
      </div>
    );
  }

  const { deal, payments, totalPaid, remainingAmount, bankPaid, otherPaid, jantriAmount, otherAmount, jantriRemaining, otherRemaining } = dealData;
  const paidPercent = deal.totalAmount > 0 ? Math.min(100, (totalPaid / deal.totalAmount) * 100) : 0;
  const banakhatAmount = deal.banakhatAmount || deal.totalAmount * 0.25;

  return (
    <div className="dd-page">
      <div className="dd-wrapper">

        {/* ── Page Header ── */}
        <div className="dd-page-header">
          <div className="dd-page-title-block">
            {/* <div className="dd-page-icon">🏡</div> */}
            <div>
              <h1 className="dd-page-title">{deal.villageName}</h1>
              <p className="dd-page-subtitle">Survey No. {deal.surveyNumber} · Deal Details</p>
            </div>
          </div>
        </div>

        {/* ── Toasts ── */}
        {error && <div className="dd-toast dd-toast--error"><span>⚠️</span> {error}</div>}
        {success && <div className="dd-toast dd-toast--success"><span>✅</span> {success}</div>}

        {/* ── Section 1: Deal Information ── */}
        <div className={`dd-section ${expandedSections.includes('deal-info') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleSection('deal-info')}>
              {/* <span className="dd-section-icon">📋</span> */}
              <h2 className="dd-section-title">Deal Information</h2>
            </div>
          </div>
          <div className="dd-section-content">
            <div className="dd-info-grid">
              {deal.brokerName && (
                <InfoPill label="Broker Name" value={deal.brokerName} />
              )}
              <InfoPill label="Deal Type" value={
                <span className={`deal-type-badge deal-type-badge--${(deal.dealType || 'Buy').toLowerCase()}`}>
                  {deal.dealType || 'Buy'}
                </span>
              } />
              {deal.naType && (
                <InfoPill label="NA Type" value={deal.naType} />
              )}
              <InfoPill label="Deal Date" value={deal.dealDate ? formatDate(deal.dealDate) : 'N/A'} />
              <InfoPill label="Unit Price" value={formatCurrency(deal.pricePerSqYard)} />
              <InfoPill label="Total Area" value={`${deal.totalSqYard.toLocaleString('en-IN')}`} />
              <InfoPill label="25% Amount" value={formatCurrency(banakhatAmount)} accent />
              <InfoPill label="75% Amount" value={formatCurrency(deal.totalAmount * 0.75)} accent />
              <InfoPill label="25% Deadline" value={deal.deadlineStartDate ? formatDate(deal.deadlineStartDate) : 'N/A'} />
              <InfoPill label="75% Deadline" value={deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : 'N/A'} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Payment Summary ── */}
        <div className={`dd-section ${expandedSections.includes('payment-summary') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleSection('payment-summary')}>
              {/* <span className="dd-section-icon">💰</span> */}
              <h2 className="dd-section-title">Payment Summary</h2>
            </div>
          </div>
          <div className="dd-section-content">



            {/* Row 2: Payment Status (overall) */}
            <div className="dd-stat-grid" style={{ marginTop: '1.5rem' }}>
              <StatCard label="Total Amount" value={formatCurrency(deal.totalAmount)} variant="total" />
              <StatCard label="Total Paid" value={formatCurrency(totalPaid)} variant="paid" />
              <StatCard
                label="Total Remaining"
                value={formatCurrency(remainingAmount)}
                variant={remainingAmount > 0 ? 'remaining' : 'cleared'}
              />
            </div>

            {/* Jantri calculation note */}
            {(deal.jantri > 0 && deal.totalSqMeter > 0) && (
              <div style={{
                background: '#eff6ff',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                marginTop: '1rem',
                fontSize: '0.8rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.95rem' }}>ℹ️</span>
                <span>
                  <strong>Jantri Amount</strong> = {formatCurrency(deal.jantri)} × {deal.totalSqMeter.toLocaleString('en-IN')}  sq.mtr = {formatCurrency(jantriAmount || 0)}
                </span>
              </div>
            )}
            {/* Row 3: Per-mode breakdown (Bank → Jantri | Other → Other) */}
            {(jantriAmount > 0 || otherAmount > 0) && (
              <>
                <div style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Mode-wise Tracking
                </div>
                <div className="dd-stat-grid">
                  <StatCard label="Jantri Amount" value={formatCurrency(jantriAmount || 0)} variant="total" />
                  <StatCard label="Jantri Paid" value={formatCurrency(bankPaid || 0)} variant="paid" />
                  <StatCard
                    label="Jantri Remaining"
                    value={formatCurrency(jantriRemaining)}
                    variant={jantriRemaining > 0 ? 'remaining' : 'cleared'}
                  />
                </div>
                <div className="dd-stat-grid" style={{ marginTop: '0.75rem' }}>
                  <StatCard label="Other Amount" value={formatCurrency(otherAmount || 0)} variant="total" />
                  <StatCard label="Other Paid" value={formatCurrency(otherPaid || 0)} variant="paid" />
                  <StatCard
                    label="Other Remaining"
                    value={formatCurrency(otherRemaining)}
                    variant={otherRemaining > 0 ? 'remaining' : 'cleared'}
                  />
                </div>
              </>
            )}

            {/* Total Amount Progress bar */}
            <div className="dd-progress-wrap">
              <div className="dd-progress-bar-bg">
                <div
                  className="dd-progress-bar-fill"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <span className="dd-progress-label">
                {paidPercent.toFixed(1)}% paid
                {remainingAmount <= 0 && <span className="dd-cleared-badge">✔ Cleared</span>}
              </span>
            </div>

          </div>
        </div>

        {/* ── Section 3: Payment History ── */}
        <div className={`dd-section ${expandedSections.includes('payment-history') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleSection('payment-history')}>
              {/* <span className="dd-section-icon">📜</span> */}
              <h2 className="dd-section-title">Payment History</h2>
              <span className="dd-payment-count">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
            </div>
            {isAdmin && (
              <button
                className={`dd-btn dd-btn--sm ${showPaymentForm ? 'dd-btn--ghost' : 'dd-btn--add-payment'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaymentForm(!showPaymentForm);
                  // Ensure payment-history section is expanded when showing form
                  if (!showPaymentForm && !expandedSections.includes('payment-history')) {
                    setExpandedSections(prev => [...prev, 'payment-history']);
                  }
                }}
              >
                {showPaymentForm ? '✕ Cancel' : '+ Add Payment'}
              </button>
            )}
          </div>
          <div className="dd-section-content">

            {/* Add Payment Form */}
            {showPaymentForm && (
              <div className="dd-payment-form-card">
                <div className="dd-section-header" style={{ marginBottom: '1rem' }}>
                  <h3 className="dd-section-title">Add Payment Record</h3>
                </div>
                <form onSubmit={handlePaymentSubmit} noValidate>
                  <div className="dd-form-grid">
                    <div className="dd-field">
                      <label className="dd-label">Date <span className="dd-required">*</span></label>
                      <input
                        type="date"
                        className="dd-input"
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="dd-field">
                      <label className="dd-label">Mode of Payment <span className="dd-required">*</span></label>
                      <select
                        className="dd-input"
                        value={paymentForm.modeOfPayment}
                        onChange={(e) => setPaymentForm({ ...paymentForm, modeOfPayment: e.target.value })}
                        required
                      >
                        <option value="Bank">Bank</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="dd-field">
                      <label className="dd-label">Amount (₹) <span className="dd-required">*</span></label>
                      <div className="dd-input-prefix-wrap">
                        <span className="dd-input-prefix">₹</span>
                        <input
                          type="number"
                          className="dd-input dd-input--prefixed"
                          placeholder="0.00"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="dd-field" style={{ marginTop: '0.75rem' }}>
                    <label className="dd-label">Remarks</label>
                    <textarea
                      className="dd-input dd-textarea"
                      placeholder="e.g., IN HAND ALPESH BHAI"
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                      rows="2"
                    />
                  </div>
                  <div className="dd-form-actions">
                    <button type="button" className="dd-btn dd-btn--ghost" onClick={() => { setShowPaymentForm(false); setPaymentForm({ date: new Date().toISOString().split('T')[0], modeOfPayment: 'Bank', amount: '', remarks: '' }); }} disabled={isSavingPayment}>
                      Cancel
                    </button>
                    <button type="submit" className="dd-btn dd-btn--submit" disabled={isSavingPayment}>
                      {isSavingPayment ? (
                        <>
                          <span className="dd-spinner" />
                          Saving...
                        </>
                      ) : (
                        'Add Payment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="dd-empty-state">
                <span className="dd-empty-icon">💳</span>
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div className="dd-payments-list">
                {payments.map((payment, index) => (
                  <div
                    key={payment._id}
                    className="dd-payment-card"
                    draggable={isAdmin}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{ opacity: draggedIndex === index ? 0.45 : 1 }}
                  >
                    {/* Drag Handle */}
                    {isAdmin && (
                      <div className="dd-payment-drag-handle" title="Drag to reorder">⠿</div>
                    )}

                    {/* Payment Info */}
                    <div className="dd-payment-info">
                      <div className="dd-payment-header">
                        <div className="dd-payment-date">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {formatDate(payment.date)}
                        </div>
                        <PaymentModeBadge mode={payment.modeOfPayment} />
                      </div>

                      <div className="dd-payment-amount-large">{formatCurrency(payment.amount)}</div>

                      {payment.remarks && (
                        <div className="dd-payment-remarks">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          {payment.remarks}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isAdmin && (
                      <div className="dd-payment-actions">
                        <button
                          className="dd-payment-btn dd-payment-btn--edit"
                          onClick={() => handleEditPayment(payment)}
                          title="Edit Payment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          className="dd-payment-btn dd-payment-btn--delete"
                          onClick={() => setConfirmDeletePaymentId(payment._id)}
                          title="Delete Payment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Total Summary Cards */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <div className="dd-payment-total-card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderColor: '#93c5fd', margin: 0 }}>
                    <div className="dd-payment-total-label" style={{ color: '#1e40af' }}>Total Paid</div>
                    <div className="dd-payment-total-amount" style={{ color: '#1e40af' }}>{formatCurrency(totalPaid)}</div>
                  </div>

                  <div className="dd-payment-total-card" style={{ margin: 0, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#fbbf24' }}>
                    <div className="dd-payment-total-label" style={{ color: '#92400e' }}>Total Remaining</div>
                    <div className="dd-payment-total-amount" style={{ color: '#92400e' }}>{formatCurrency(remainingAmount)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Action Bar ── */}
        <div className="dd-action-bar">
          <button className="dd-btn dd-btn--pdf" onClick={generatePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <span className="dd-spinner" />
                Generating...
              </>
            ) : (
              <>
                Export PDF
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Edit Payment Modal ── */}
      {editingPaymentId && (() => {
        // eslint-disable-next-line no-unused-vars
        const payment = payments.find(p => p._id === editingPaymentId);
        return (
          <div className="logout-modal-overlay" onClick={handleCancelEdit}>
            <div className="dashboard-modal dashboard-modal--large" onClick={e => e.stopPropagation()}>
              <div className="dashboard-modal-header">
                <h3 className="dashboard-modal-title">Edit Payment</h3>
                <button className="dashboard-modal-close" onClick={handleCancelEdit}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="dashboard-modal-body">
                <div className="dashboard-edit-form">
                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        className="dashboard-form-input"
                        value={editPaymentForm.date}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Mode of Payment</label>
                      <select
                        name="modeOfPayment"
                        className="dashboard-form-input"
                        value={editPaymentForm.modeOfPayment}
                        onChange={handleEditFormChange}
                      >
                        <option value="Bank">Bank</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Amount (₹)</label>
                    <input
                      type="number"
                      name="amount"
                      className="dashboard-form-input"
                      value={editPaymentForm.amount}
                      onChange={handleEditFormChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Remarks(optional)</label>
                    <textarea
                      name="remarks"
                      className="dashboard-form-input"
                      value={editPaymentForm.remarks}
                      onChange={handleEditFormChange}
                      rows="3"
                      placeholder="Add any notes or remarks..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              <div className="dashboard-modal-actions">
                <button className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={handleCancelEdit} disabled={isSavingPayment}>Cancel</button>
                <button className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={() => handleSaveEdit(editingPaymentId)} disabled={isSavingPayment}>
                  {isSavingPayment ? (
                    <>
                      <span className="modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete Payment Confirmation Modal ── */}
      {confirmDeletePaymentId && (() => {
        const payment = payments.find(p => p._id === confirmDeletePaymentId);
        return (
          <div className="logout-modal-overlay" onClick={() => setConfirmDeletePaymentId(null)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="logout-modal-title">Delete Payment?</h3>
              <p className="logout-modal-desc">
                Are you sure you want to delete this payment record?<br />
                {payment && <><strong>{formatCurrency(payment.amount)}</strong> &mdash; {payment.modeOfPayment}</>}<br />
                <span style={{ color: '#e53e3e', fontSize: '0.82rem' }}>This action cannot be undone.</span>
              </p>
              <div className="logout-modal-actions">
                <button className="logout-modal-btn logout-modal-btn--cancel" onClick={() => setConfirmDeletePaymentId(null)} disabled={isDeletingPayment}>Cancel</button>
                <button className="logout-modal-btn logout-modal-btn--confirm" onClick={() => handleDeletePayment(confirmDeletePaymentId)} disabled={isDeletingPayment}>
                  {isDeletingPayment ? <><span className="modal-spinner" /> Deleting…</> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DealDetails;