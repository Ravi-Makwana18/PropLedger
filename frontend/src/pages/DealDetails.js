import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  NA: { bg: '#f1f5f9', color: '#64748b' },
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
  const { isAdmin } = useAuth();

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
  const [editPaymentForm, setEditPaymentForm] = useState({
    date: '',
    modeOfPayment: '',
    amount: '',
    remarks: ''
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    fetchDealDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setError('');
    setSuccess('');
    try {
      await API.delete(`/api/payments/${paymentId}`);
      // Update local state immediately — no re-fetch needed
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
    }
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

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Destination Dholera PVT. LTD', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('deal information report', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Deal Details', 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 55;

    const dealInfo = [
      ['Village Name', deal.villageName],
      ['Survey No.', deal.surveyNumber],
      ['Unit Price', formatPDFCurrency(deal.pricePerSqYard)],
      ['Total Area', formatNumber(deal.totalSqYard)],
      ['Total Amount', formatPDFCurrency(deal.totalAmount)],
      ['Banakhat Amount (25%)', formatPDFCurrency(deal.banakhatAmount || deal.totalAmount * 0.25)],
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
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleString('en-IN')} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Deal_${deal.villageName}_${deal.surveyNumber}.pdf`);
  };

  /* ── Loading / Error States ── */
  if (loading) {
    return (
      <div className="dd-loading-screen">
        <div className="dd-spinner-lg" />
        <p>Loading deal details…</p>
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
        <div className="dd-section">
          <div className="dd-section-header">
            <span className="dd-section-icon">📋</span>
            <h2 className="dd-section-title">Deal Information</h2>
          </div>
          <div className="dd-info-grid">
            <InfoPill label="Village Name" value={deal.villageName} />
            <InfoPill label="Survey No." value={deal.surveyNumber} />
            <InfoPill label="Unit Price" value={formatCurrency(deal.pricePerSqYard)} />
            <InfoPill label="Total Area" value={`${deal.totalSqYard.toLocaleString('en-IN')} sq.yd`} />
            <InfoPill label="Total Amount" value={formatCurrency(deal.totalAmount)} accent />
            <InfoPill label="Banakhat Amount (25%)" value={formatCurrency(banakhatAmount)} accent />
            <InfoPill label="Deadline" value={formatDeadlinePeriod(deal.deadlineStartDate, deal.deadlineEndDate)} />
          </div>
        </div>

        {/* ── Section 2: Payment Summary ── */}
        <div className="dd-section">
          <div className="dd-section-header">
            <span className="dd-section-icon">💰</span>
            <h2 className="dd-section-title">Payment Summary</h2>
          </div>

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
                      <option value="NA">NA</option>
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
                  <button type="button" className="dd-btn dd-btn--ghost" onClick={() => setShowPaymentForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="dd-btn dd-btn--submit">
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Section 3: Payment History ── */}
        <div className="dd-section">
          <div className="dd-section-header">
            <span className="dd-section-icon">📜</span>
            <h2 className="dd-section-title">Payment History</h2>
            <span className="dd-payment-count">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
            {isAdmin && (
              <button
                className={`dd-btn dd-btn--sm ${showPaymentForm ? 'dd-btn--ghost' : 'dd-btn--add-payment'}`}
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                {showPaymentForm ? '✕ Cancel' : '+ Add Payment'}
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="dd-empty-state">
              <span className="dd-empty-icon">💳</span>
              <p>No payments recorded yet.</p>
            </div>
          ) : (
            <div className="dd-table-wrap">
              <table className="dd-table">
                <thead>
                  <tr>
                    {isAdmin && <th className="dd-th-drag" title="Drag to reorder">⠿</th>}
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) =>
                    editingPaymentId === payment._id ? (
                      /* ── Inline edit row ── */
                      <tr key={payment._id} className="dd-row-editing">
                        {isAdmin && <td />}
                        <td>
                          <input
                            type="date"
                            name="date"
                            value={editPaymentForm.date}
                            onChange={handleEditFormChange}
                            className="dd-input dd-inline-input"
                          />
                        </td>
                        <td>
                          <select
                            name="modeOfPayment"
                            value={editPaymentForm.modeOfPayment}
                            onChange={handleEditFormChange}
                            className="dd-input dd-inline-input"
                          >
                            <option value="NEFT">NEFT</option>
                            <option value="RTGS">RTGS</option>
                            <option value="CASH">CASH</option>
                            <option value="CHEQUE">CHEQUE</option>
                            <option value="UPI">UPI</option>
                            <option value="NA">NA</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            name="amount"
                            value={editPaymentForm.amount}
                            onChange={handleEditFormChange}
                            className="dd-input dd-inline-input"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="remarks"
                            value={editPaymentForm.remarks}
                            onChange={handleEditFormChange}
                            className="dd-input dd-inline-input"
                          />
                        </td>
                        <td>
                          <div className="dd-row-actions">
                            <button
                              className="dd-icon-btn dd-icon-btn--save"
                              onClick={() => handleSaveEdit(payment._id)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className="dd-icon-btn dd-icon-btn--cancel"
                              onClick={handleCancelEdit}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      /* ── Normal row ── */
                      <tr
                        key={payment._id}
                        className="dd-row"
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{ opacity: draggedIndex === index ? 0.45 : 1 }}
                      >
                        {isAdmin && (
                          <td className="dd-drag-handle" title="Drag to reorder">⠿</td>
                        )}
                        <td className="dd-td-date">{formatDate(payment.date)}</td>
                        <td><PaymentModeBadge mode={payment.modeOfPayment} /></td>
                        <td className="dd-td-amount">{formatCurrency(payment.amount)}</td>
                        <td className="dd-td-remarks">{payment.remarks || <span className="dd-na">—</span>}</td>
                        {isAdmin && (
                          <td>
                            <div className="dd-row-actions">
                              <button
                                className="dd-icon-btn dd-icon-btn--edit"
                                onClick={() => handleEditPayment(payment)}
                                title="Edit Payment"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              {confirmDeletePaymentId === payment._id ? (
                                <>
                                  <button
                                    className="dd-icon-btn dd-icon-btn--delete"
                                    onClick={() => handleDeletePayment(payment._id)}
                                    title="Confirm delete"
                                    style={{ width: 'auto', padding: '0 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                                  >✓ Yes</button>
                                  <button
                                    className="dd-icon-btn dd-icon-btn--cancel"
                                    onClick={() => setConfirmDeletePaymentId(null)}
                                    title="Cancel"
                                    style={{ width: 'auto', padding: '0 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                                  >✕ No</button>
                                </>
                              ) : (
                                <button
                                  className="dd-icon-btn dd-icon-btn--delete"
                                  onClick={() => setConfirmDeletePaymentId(payment._id)}
                                  title="Delete Payment"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                  {/* Total row */}
                  <tr className="dd-total-row">
                    {isAdmin && <td />}
                    <td colSpan="2" className="dd-total-label">TOTAL PAID</td>
                    <td className="dd-total-value">{formatCurrency(totalPaid)}</td>
                    <td colSpan={isAdmin ? 2 : 1} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Sticky Action Bar ── */}
        <div className="dd-action-bar">
          <button className="dd-btn dd-btn--pdf" onClick={generatePDF}>
            📄 Export PDF
          </button>
        </div>

      </div>
    </div>
  );
};

export default DealDetails;