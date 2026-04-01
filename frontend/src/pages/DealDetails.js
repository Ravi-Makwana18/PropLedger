import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  NEFT: { bg: '#eff6ff', color: '#1d4ed8' },
  RTGS: { bg: '#f5f3ff', color: '#6d28d9' },
  CASH: { bg: '#f0fdf4', color: '#15803d' },
  CHEQUE: { bg: '#fff7ed', color: '#c2410c' },
  UPI: { bg: '#fdf4ff', color: '#9333ea' },
  ANGADIA: { bg: '#fef9c3', color: '#92400e' },
  OTHER: { bg: '#f8fafc', color: '#475569' },
};

const PaymentModeBadge = ({ mode }) => {
  const style = modeColors[mode] || modeColors.OTHER;
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
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  // ── State ────────────────────────────────────────────────────────────────
  const [dealData, setDealData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    modeOfPayment: 'NEFT',
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
      // Update local state immediately — no re-fetch needed
      const newAmount = parseFloat(paymentForm.amount);
      setDealData(prev => ({
        ...prev,
        payments: [newPayment, ...prev.payments],
        totalPaid: prev.totalPaid + newAmount,
        remainingAmount: prev.remainingAmount - newAmount
      }));
      setSuccess('Payment added successfully');
      setShowPaymentForm(false);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        modeOfPayment: 'NEFT',
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
        setDealData(prev => ({
          ...prev,
          payments: prev.payments.filter(p => p._id !== paymentId),
          totalPaid: prev.totalPaid - deletedAmount,
          remainingAmount: prev.remainingAmount + deletedAmount
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
      // Update local state immediately — no re-fetch needed
      const oldPayment = dealData.payments.find(p => p._id === paymentId);
      const amountDiff = updatedPayment.amount - (oldPayment ? oldPayment.amount : 0);
      setDealData(prev => ({
        ...prev,
        payments: prev.payments.map(p => p._id === paymentId ? updatedPayment : p),
        totalPaid: prev.totalPaid + amountDiff,
        remainingAmount: prev.remainingAmount - amountDiff
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

  const formatDeadlinePeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.getFullYear() === 1970 && end.getFullYear() === 1970) return 'N/A';
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  };

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

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(user?.companyName || 'PropLedger', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('deal information report', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Deal Details', 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 50;

    const dealInfo = [
      ['Village Name', deal.villageName],
      ['Survey No.', deal.surveyNumber],
      ['Unit Price', formatPDFCurrency(deal.pricePerSqYard)],
      ['Total Area', formatNumber(deal.totalSqYard)],
      ['Total Amount', formatPDFCurrency(deal.totalAmount)],
      ['Banakhat Amount (25%)', formatPDFCurrency(deal.banakhatAmount || deal.totalAmount * 0.25)],
      ['Total Square Meter', deal.totalSqMeter > 0 ? `${deal.totalSqMeter} sq.m` : 'N/A'],
      ['Jantri (Rs./sq.m)', deal.jantri > 0 ? formatPDFCurrency(deal.jantri) : 'N/A'],
      ['White Payment', deal.whitePayment > 0 ? formatPDFCurrency(deal.whitePayment) : 'N/A'],
      ['Deadline', formatDeadlinePeriod(deal.deadlineStartDate, deal.deadlineEndDate)]
    ];

    dealInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value.toString(), 70, yPos);
      yPos += 8;
    });

    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Payment Summary', 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: [
        ['Total Amount', formatPDFCurrency(deal.totalAmount)],
        ['Total Paid', formatPDFCurrency(totalPaid)],
        ['Remaining Amount', formatPDFCurrency(remainingAmount)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 }
    });

    if (payments && payments.length > 0) {
      yPos = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Payment History', 14, yPos);
      yPos += 5;

      const paymentRows = payments.map(payment => [
        formatDate(payment.date),
        payment.modeOfPayment,
        formatPDFCurrency(payment.amount),
        payment.remarks || '-'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Mode of Payment', 'Amount', 'Remarks']],
        body: paymentRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        margin: { left: 14, right: 14 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY,
        body: [['', 'TOTAL PAID:', formatPDFCurrency(totalPaid), '']],
        theme: 'plain',
        styles: { fontStyle: 'bold', fillColor: [209, 250, 229] },
        margin: { left: 14, right: 14 }
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
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
        pageWidth - 14,
        pageHeight - 5,
        { align: 'right' }
      );
    }

      doc.save(`Deal_${deal.villageName}_${deal.surveyNumber}.pdf`);
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

  const { deal, payments, totalPaid, remainingAmount } = dealData;
  const paidPercent = deal.totalAmount > 0 ? Math.min(100, (totalPaid / deal.totalAmount) * 100) : 0;
  const banakhatAmount = deal.banakhatAmount || deal.totalAmount * 0.25;

  return (
    <div className="dd-page">
      <div className="dd-wrapper">

        {/* ── Page Header ── */}
        <div className="dd-page-header">
          <button className="dd-back-btn" onClick={() => navigate(-1)}>
            <span>←</span> Back
          </button>
          <div className="dd-page-title-block">
            <div className="dd-page-icon">🏡</div>
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
              <span className="dd-section-icon">📋</span>
              <h2 className="dd-section-title">Deal Information</h2>
            </div>
          </div>
          <div className="dd-section-content">
            <div className="dd-info-grid">
            <InfoPill label="Deal Type" value={
              <span className={`deal-type-badge deal-type-badge--${(deal.dealType || 'Buy').toLowerCase()}`}>
                {deal.dealType || 'Buy'}
              </span>
            } />
            <InfoPill label="Unit Price" value={formatCurrency(deal.pricePerSqYard)} />
            <InfoPill label="Total Area" value={`${deal.totalSqYard.toLocaleString('en-IN')}`} />
            <InfoPill label="Total Amount" value={formatCurrency(deal.totalAmount)} accent />
            <InfoPill label="Banakhat Amount (25%)" value={formatCurrency(banakhatAmount)} accent />
            <InfoPill label="White Payment" value={deal.whitePayment > 0 ? formatCurrency(deal.whitePayment) : 'N/A'} accent />
            <InfoPill label="Deadline" value={formatDeadlinePeriod(deal.deadlineStartDate, deal.deadlineEndDate)} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Payment Summary ── */}
        <div className={`dd-section ${expandedSections.includes('payment-summary') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleSection('payment-summary')}>
              <span className="dd-section-icon">💰</span>
              <h2 className="dd-section-title">Payment Summary</h2>
            </div>
          </div>
          <div className="dd-section-content">

          <div className="dd-stat-grid">
            <StatCard label="Total Amount" value={formatCurrency(deal.totalAmount)} variant="total" />
            <StatCard label="Total Paid" value={formatCurrency(totalPaid)} variant="paid" />
            <StatCard
              label="Remaining Amount"
              value={formatCurrency(remainingAmount)}
              variant={remainingAmount > 0 ? 'remaining' : 'cleared'}
            />
          </div>

          {/* Progress bar */}
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

          {/* Add Payment Form */}
          {showPaymentForm && (
            <div className="dd-payment-form-card">
              <div className="dd-section-header" style={{ marginBottom: '1rem' }}>
                <span className="dd-section-icon">➕</span>
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
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="CASH">CASH</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="UPI">UPI</option>
                      <option value="ANGADIA">ANGADIA</option>
                      <option value="OTHER">OTHER</option>
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
                  <button type="button" className="dd-btn dd-btn--ghost" onClick={() => setShowPaymentForm(false)} disabled={isSavingPayment}>
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
          </div>
        </div>

        {/* ── Section 3: Payment History ── */}
        <div className={`dd-section ${expandedSections.includes('payment-history') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleSection('payment-history')}>
              <span className="dd-section-icon">📜</span>
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

              {/* Total Summary Card */}
              <div className="dd-payment-total-card">
                <div className="dd-payment-total-label">Total Paid</div>
                <div className="dd-payment-total-amount">{formatCurrency(totalPaid)}</div>
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
                📄 Export PDF
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Edit Payment Modal ── */}
      {editingPaymentId && (() => {
        const _payment = payments.find(p => p._id === editingPaymentId);
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
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                        <option value="CASH">CASH</option>
                        <option value="CHEQUE">CHEQUE</option>
                        <option value="UPI">UPI</option>
                        <option value="ANGADIA">ANGADIA</option>
                        <option value="OTHER">OTHER</option>
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
                    <label className="dashboard-form-label">Remarks</label>
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