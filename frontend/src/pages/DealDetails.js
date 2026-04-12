import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { generateDealPdf } from '../utils/generateDealPdf';
import AppSelect from '../components/ui/AppSelect';
import AppTextarea from '../components/ui/AppTextarea';
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
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [editDealSection, setEditDealSection] = useState('deal-info');
  const [isSavingDeal, setIsSavingDeal] = useState(false);
  const [editDealForm, setEditDealForm] = useState({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotesValue, setEditNotesValue] = useState('');
  const [showAddMoreForm, setShowAddMoreForm] = useState(false);
  const [addMoreForm, setAddMoreForm] = useState({
    percentage: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSavingAddMore, setIsSavingAddMore] = useState(false);
  const [confirmDeleteAddMoreIndex, setConfirmDeleteAddMoreIndex] = useState(null);
  const lastFetchedDealIdRef = useRef(null);

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
    if (lastFetchedDealIdRef.current === id) return;
    lastFetchedDealIdRef.current = id;
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

  const handleOpenEditDeal = (section = 'deal-info') => {
    const d = dealData.deal;
    const expenses = d.additionalExpenses || {};
    if (section === 'additional-expenses') {
      setEditDealForm({
        buyBrokeringPercent: expenses.buyBrokeringPercent ?? '',
        sellCpIncentiveRate: expenses.sellCpIncentiveRate ?? '',
        planpassRatePerSqMtr: expenses.planpassRatePerSqMtr ?? '',
        naRatePerSqMtr: expenses.naRatePerSqMtr ?? '',
      });
    } else {
      setEditDealForm({
        brokerName: d.brokerName || '',
        dealType: d.dealType || 'Buy',
        naType: d.naType || '',
        dealDate: d.dealDate ? new Date(d.dealDate).toISOString().split('T')[0] : '',
        district: d.district || '',
        subDistrict: d.subDistrict || '',
        villageName: d.villageName || '',
        oldSurveyNo: d.oldSurveyNo || '',
        newSurveyNo: d.newSurveyNo || d.surveyNumber || '',
        pricePerSqYard: d.pricePerSqYard || '',
        totalSqYard: d.totalSqYard || '',
        totalSqMeter: d.totalSqMeter || '',
        jantri: d.jantri || '',
        deadlineStartDate: d.deadlineStartDate ? new Date(d.deadlineStartDate).toISOString().split('T')[0] : '',
        deadlineEndDate: d.deadlineEndDate ? new Date(d.deadlineEndDate).toISOString().split('T')[0] : '',
      });
    }
    setEditDealSection(section);
    setIsEditingDeal(true);
  };

  const handleSaveDeal = async () => {
    setError('');
    setSuccess('');
    setIsSavingDeal(true);
    try {
      const payload = editDealSection === 'additional-expenses'
        ? {
            additionalExpenses: {
              buyBrokeringPercent: parseFloat(editDealForm.buyBrokeringPercent) || 0,
              sellCpIncentiveRate: parseFloat(editDealForm.sellCpIncentiveRate) || 0,
              planpassRatePerSqMtr: parseFloat(editDealForm.planpassRatePerSqMtr) || 0,
              naRatePerSqMtr: parseFloat(editDealForm.naRatePerSqMtr) || 0,
            },
          }
        : {
            ...editDealForm,
            pricePerSqYard: parseFloat(editDealForm.pricePerSqYard) || 0,
            totalSqYard: parseFloat(editDealForm.totalSqYard) || 0,
            totalSqMeter: parseFloat(editDealForm.totalSqMeter) || 0,
            jantri: parseFloat(editDealForm.jantri) || 0,
          };

      const { data: updatedDeal } = await API.put(`/api/deals/${id}`, payload);
      const newJantriAmt = (updatedDeal.jantri || 0) * (updatedDeal.totalSqMeter || 0);
      const newOtherAmt = updatedDeal.totalAmount - newJantriAmt;
      setDealData(prev => ({
        ...prev,
        deal: updatedDeal,
        jantriAmount: newJantriAmt,
        otherAmount: newOtherAmt,
        remainingAmount: updatedDeal.totalAmount - prev.totalPaid,
        jantriRemaining: newJantriAmt - (prev.bankPaid || 0),
        otherRemaining: newOtherAmt - (prev.otherPaid || 0),
      }));
      setSuccess('Deal updated successfully');
      setIsEditingDeal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update deal');
    } finally {
      setIsSavingDeal(false);
    }
  };

  const handleSaveNotes = async () => {
    setError('');
    setSuccess('');
    setIsSavingDeal(true);
    try {
      const { data: updatedDeal } = await API.put(`/api/deals/${id}`, { notes: editNotesValue });
      setDealData(prev => ({ ...prev, deal: { ...prev.deal, notes: updatedDeal.notes } }));
      setSuccess('Notes updated successfully');
      setIsEditingNotes(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notes');
    } finally {
      setIsSavingDeal(false);
    }
  };

  const handleSaveAddMore = async () => {
    setError('');
    setSuccess('');
    const percentage = parseFloat(addMoreForm.percentage);
    const totalAmount = dealData?.deal?.totalAmount || 0;

    if (Number.isNaN(percentage) || percentage <= 0) {
      setError('Please enter a valid percentage greater than 0');
      return;
    }

    if (!addMoreForm.date) {
      setError('Please select a date');
      return;
    }

    const entryAmount = (percentage / 100) * totalAmount;
    const existingEntries = dealData?.deal?.addMoreEntries || [];
    const nextEntries = [
      ...existingEntries,
      {
        percentage,
        date: addMoreForm.date,
        amount: entryAmount
      }
    ];

    setIsSavingAddMore(true);
    try {
      const { data: updatedDeal } = await API.put(`/api/deals/${id}`, {
        addMoreEntries: nextEntries
      });

      setDealData(prev => ({
        ...prev,
        deal: {
          ...prev.deal,
          addMoreEntries: updatedDeal.addMoreEntries || nextEntries
        }
      }));
      setSuccess('Add More entry saved successfully');
      setAddMoreForm({
        percentage: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddMoreForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Add More entry');
    } finally {
      setIsSavingAddMore(false);
    }
  };

  const handleDeleteAddMore = async (entryIndex) => {
    setError('');
    setSuccess('');
    const existingEntries = dealData?.deal?.addMoreEntries || [];
    const nextEntries = existingEntries.filter((_, index) => index !== entryIndex);

    setIsSavingAddMore(true);
    try {
      const { data: updatedDeal } = await API.put(`/api/deals/${id}`, {
        addMoreEntries: nextEntries
      });

      setDealData(prev => ({
        ...prev,
        deal: {
          ...prev.deal,
          addMoreEntries: updatedDeal.addMoreEntries || nextEntries
        }
      }));
      setSuccess('Add More entry deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete Add More entry');
    } finally {
      setIsSavingAddMore(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });


  if (loading) {
    return (
      <div className="deal-details-skeleton">
        <div className="deal-details-skeleton-header">
          <div className="skeleton-base deal-details-skeleton-back"></div>
          <div>
            <div className="skeleton-base deal-details-skeleton-title"></div>
            <div className="skeleton-base deal-details-skeleton-subtitle"></div>
          </div>
        </div>
        
        <div className="deal-details-skeleton-section">
          <div className="skeleton-base deal-details-skeleton-section-title"></div>
          <div className="deal-details-skeleton-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-base deal-details-skeleton-pill"></div>
            ))}
          </div>
        </div>

        <div className="deal-details-skeleton-section">
          <div className="skeleton-base deal-details-skeleton-section-title"></div>
          <div className="deal-details-skeleton-stats">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-base deal-details-skeleton-stat"></div>
            ))}
          </div>
        </div>

        <div className="deal-details-skeleton-section">
          <div className="skeleton-base deal-details-skeleton-section-title"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="deal-details-skeleton-row">
              <div className="skeleton-base deal-details-skeleton-row-item"></div>
              <div className="skeleton-base deal-details-skeleton-row-item"></div>
              <div className="skeleton-base deal-details-skeleton-row-item"></div>
            </div>
          ))}
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
  const addMorePercentage = parseFloat(addMoreForm.percentage) || 0;
  const addMoreCalculatedAmount = (addMorePercentage / 100) * (deal.totalAmount || 0);
  const addMoreEntries = deal.addMoreEntries || [];
  const additionalExpenses = deal.additionalExpenses || {};
  const buyBrokeringPercent = additionalExpenses.buyBrokeringPercent || 0;
  const sellCpIncentiveRate = additionalExpenses.sellCpIncentiveRate || 0;
  const planpassRatePerSqMtr = additionalExpenses.planpassRatePerSqMtr || 0;
  const naRatePerSqMtr = additionalExpenses.naRatePerSqMtr || 0;
  const buyBrokeringTotal = (buyBrokeringPercent / 100) * (deal.totalAmount || 0);
  const sellCpIncentiveTotal = sellCpIncentiveRate * (deal.totalSqYard || 0);
  const planpassTotal = planpassRatePerSqMtr * (deal.totalSqMeter || 0);
  const naTotal = naRatePerSqMtr * (deal.totalSqMeter || 0);
  const formatShortDate = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const generatePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      generateDealPdf({
        deal,
        payments,
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
      });
      setIsGeneratingPDF(false);
    }, 800);
  };

  return (
    <div className="dd-page">
      <div className="dd-wrapper">

        {/* ── Page Header ── */}
        <div className="dd-page-header app-card">
          <div className="dd-page-title-block">
            {/* <div className="dd-page-icon">🏡</div> */}
            <div>
              <h1 className="dd-page-title">{deal.villageName}</h1>
              <p className="dd-page-subtitle">Survey No. {deal.newSurveyNo || deal.surveyNumber} · Deal Details</p>
            </div>
          </div>
        </div>

        {/* ── Toasts ── */}
        {error && <div className="dd-toast dd-toast--error pl-alert pl-alert--error"><span>⚠️</span> {error}</div>}
        {success && <div className="dd-toast dd-toast--success pl-alert pl-alert--success"><span>✅</span> {success}</div>}

        {/* ── Section 1: Deal Information ── */}
        <div className={`dd-section ${expandedSections.includes('deal-info') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('deal-info')}>
              {/* <span className="dd-section-icon">📋</span> */}
              <h2 className="dd-section-title">Deal Information</h2>
              {isAdmin && (
                <button
                  className="dd-edit-icon-btn app-btn"
                  onClick={(e) => { e.stopPropagation(); handleOpenEditDeal('deal-info'); }}
                  title="Edit Deal Information"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="dd-edit-icon-label">Edit</span>
                </button>
              )}
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
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('payment-summary')}>
              {/* <span className="dd-section-icon">💰</span> */}
              <h2 className="dd-section-title">Payment Summary</h2>
            </div>
          </div>
          <div className="dd-section-content">



            {/* Row 1: Payment Status (overall) */}
            <div className="dd-stat-grid dd-stat-grid--mt-lg">
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
            {/* TDS note (single-line) */}
            {(deal.whitePaymentBeforeTDS > 0) && (
              <div style={{
                background: deal.tdsAmount > 0 ? '#fff7ed' : '#f8fafc',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                color: deal.tdsAmount > 0 ? '#92400e' : '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.95rem' }}>ℹ️</span>
                <span>
                  <strong>Jantri Payment</strong> = {deal.whitePaymentBeforeTDS ? formatCurrency(deal.whitePaymentBeforeTDS) : 'N/A'}
                  {deal.tdsAmount > 0 && (
                    <> &nbsp;·&nbsp; <strong>TDS (1%)</strong> = {formatCurrency(deal.tdsAmount)} &nbsp;·&nbsp; <strong>After TDS</strong> = {formatCurrency(deal.whitePayment || 0)}</>
                  )}
                </span>
              </div>
            )}
            {/* Row 2: Per-mode breakdown (Bank → Jantri | Other → Other) */}
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
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('payment-history')}>
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
              <div className="dd-payment-form-card app-card">
                <div className="dd-section-header app-section-header dd-section-header--tight">
                  <h3 className="dd-section-title">Add Payment Record</h3>
                </div>
                <form onSubmit={handlePaymentSubmit} noValidate>
                  <div className="dd-form-grid">
                    <div className="dd-field">
                      <label className="dd-label">Date <span className="dd-required">*</span></label>
                      <input
                        type="date"
                        className="dd-input app-input"
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="dd-field">
                      <label className="dd-label">Mode of Payment <span className="dd-required">*</span></label>
                      <AppSelect
                        className="dd-input"
                        value={paymentForm.modeOfPayment}
                        onChange={(e) => setPaymentForm({ ...paymentForm, modeOfPayment: e.target.value })}
                        required
                      >
                        <option value="Bank">Bank</option>
                        <option value="Other">Other</option>
                      </AppSelect>
                    </div>
                    <div className="dd-field">
                      <label className="dd-label">Amount (₹) <span className="dd-required">*</span></label>
                      <div className="dd-input-prefix-wrap">
                        <span className="dd-input-prefix">₹</span>
                        <input
                          type="number"
                          className="dd-input app-input dd-input--prefixed"
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
                  <div className="dd-field dd-field--mt-sm">
                    <label className="dd-label">Remarks</label>
                    <AppTextarea
                      className="dd-input dd-textarea"
                      placeholder="e.g., IN HAND ALPESH BHAI"
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                      rows="2"
                    />
                  </div>
                  <div className="dd-form-actions app-actions-row">
                    <button type="button" className="dd-btn app-btn dd-btn--ghost" onClick={() => { setShowPaymentForm(false); setPaymentForm({ date: new Date().toISOString().split('T')[0], modeOfPayment: 'Bank', amount: '', remarks: '' }); }} disabled={isSavingPayment}>
                      Cancel
                    </button>
                    <button type="submit" className="dd-btn app-btn dd-btn--submit" disabled={isSavingPayment}>
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

        {/* ── Section: Notes ── */}
        <div className={`dd-section ${expandedSections.includes('notes') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('notes')}>
              <h2 className="dd-section-title">Notes</h2>
              {isAdmin && !isEditingNotes && (
                <button
                  className="dd-edit-icon-btn app-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditNotesValue(deal.notes || '');
                    setIsEditingNotes(true);
                    if (!expandedSections.includes('notes')) {
                      setExpandedSections(prev => [...prev, 'notes']);
                    }
                  }}
                  title="Edit Notes"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="dd-edit-icon-label">Edit</span>
                </button>
              )}
            </div>
          </div>
          <div className="dd-section-content">
            {isEditingNotes ? (
              <>
                <AppTextarea
                  className="dd-notes-input"
                  value={editNotesValue}
                  onChange={(e) => setEditNotesValue(e.target.value)}
                  rows={4}
                  placeholder="Add notes here..."
                  autoFocus
                />
                <div className="dd-notes-edit-actions app-actions-row">
                  <button className="dd-btn app-btn dd-btn--ghost dd-btn--sm" onClick={() => setIsEditingNotes(false)} disabled={isSavingDeal}>Cancel</button>
                  <button className="dd-btn app-btn dd-btn--submit dd-btn--sm" onClick={handleSaveNotes} disabled={isSavingDeal}>
                    {isSavingDeal ? <><span className="dd-spinner" /> Saving...</> : 'Save'}
                  </button>
                </div>
              </>
            ) : deal.notes ? (
              <div className="dd-notes-display">{deal.notes}</div>
            ) : (
              <p className="dd-notes-empty">{isAdmin ? 'No notes yet — click the edit icon to add.' : 'No notes.'}</p>
            )}
          </div>
        </div>

        {/* ── Section 1.1: Milestone Schedule ── */}
        <div className={`dd-section ${expandedSections.includes('milestone-schedule') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('milestone-schedule')}>
              <h2 className="dd-section-title">Milestone Schedule</h2>
            </div>
            <button
              className={`dd-btn dd-btn--sm ${showAddMoreForm ? 'dd-btn--ghost' : 'dd-btn--add-more'}`}
              onClick={(e) => { e.stopPropagation(); setShowAddMoreForm(prev => !prev); }}
            >
              {showAddMoreForm ? 'Hide Options' : '+ Add More'}
            </button>
          </div>
          <div className="dd-section-content">
            {showAddMoreForm && (
              <div className="dd-section-content--open">
                <div className="dd-form-grid dd-form-grid--add-more">
                  <div className="dd-field">
                    <label className="dd-label">% of Amount</label>
                    <input
                      type="number"
                      className="dd-input app-input"
                      min="0"
                      step="0.01"
                      placeholder="Enter percentage"
                      value={addMoreForm.percentage}
                      onChange={(e) => setAddMoreForm(prev => ({ ...prev, percentage: e.target.value }))}
                    />
                  </div>
                  <div className="dd-field">
                    <label className="dd-label">Date</label>
                    <input
                      type="date"
                      className="dd-input app-input"
                      value={addMoreForm.date}
                      onChange={(e) => setAddMoreForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="dd-add-more-result">
                  <div className="dd-add-more-result-label">Calculated Amount</div>
                  <div className="dd-add-more-result-value">{formatCurrency(addMoreCalculatedAmount)}</div>
                  <div className="dd-add-more-result-note">
                    Formula: ({addMorePercentage || 0}% / 100) × Total Deal Amount
                  </div>
                </div>
                {isAdmin && (
                  <div className="dd-form-actions">
                    <button
                      type="button"
                      className="dd-btn app-btn dd-btn--submit"
                      onClick={handleSaveAddMore}
                      disabled={isSavingAddMore}
                    >
                      {isSavingAddMore ? <><span className="dd-spinner" /> Saving...</> : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {addMoreEntries.length > 0 && (
              <div className="dd-add-more-list">
                {addMoreEntries.map((entry, index) => (
                  <div key={`${entry.date}-${entry.percentage}-${index}`} className="dd-add-more-item">
                    <span>{entry.percentage || 0}%</span>
                    <span>{entry.date ? formatShortDate(entry.date) : 'N/A'}</span>
                    <span>{formatCurrency(entry.amount || 0)}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="dd-add-more-delete-btn"
                        onClick={() => setConfirmDeleteAddMoreIndex(index)}
                        disabled={isSavingAddMore}
                        title="Delete entry"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 4: Additional Expenses ── */}
        <div className={`dd-section ${expandedSections.includes('additional-expenses') ? 'dd-section--expanded' : ''}`}>
          <div className="dd-section-header app-section-header">
            <div className="dd-section-toggle-hit" onClick={() => toggleSection('additional-expenses')}>
              <h2 className="dd-section-title">Additional Expenses</h2>
              {isAdmin && (
                <button
                  className="dd-edit-icon-btn app-btn"
                  onClick={(e) => { e.stopPropagation(); handleOpenEditDeal('additional-expenses'); }}
                  title="Edit Additional Expenses"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="dd-edit-icon-label">Edit</span>
                </button>
              )}
            </div>
          </div>
          <div className="dd-section-content">
            <div className="dd-additional-expenses-grid">
            <div className="dd-additional-expense-card">
              <div className="dd-additional-expense-head">Buy</div>
              <div className="dd-additional-expense-sub">Brokering expenses</div>
              <div className="dd-additional-expense-meta">Rate: {buyBrokeringPercent}%</div>
              <div className="dd-additional-expense-total">{formatCurrency(buyBrokeringTotal)}</div>
            </div>
            <div className="dd-additional-expense-card">
              <div className="dd-additional-expense-head">Sell</div>
              <div className="dd-additional-expense-sub">C. P. Incentive expenses</div>
              <div className="dd-additional-expense-meta">Rate: {formatCurrency(sellCpIncentiveRate)} / sq.yd</div>
              <div className="dd-additional-expense-total">{formatCurrency(sellCpIncentiveTotal)}</div>
            </div>
            <div className="dd-additional-expense-card">
              <div className="dd-additional-expense-head">Planpass Expenses</div>
              <div className="dd-additional-expense-sub">Rate (per sq. mtr)</div>
              <div className="dd-additional-expense-meta">Rate: {formatCurrency(planpassRatePerSqMtr)} / sq.mtr</div>
              <div className="dd-additional-expense-total">{formatCurrency(planpassTotal)}</div>
            </div>
            <div className="dd-additional-expense-card">
              <div className="dd-additional-expense-head">NA expenses</div>
              <div className="dd-additional-expense-sub">Rate (per sq. mtr rate)</div>
              <div className="dd-additional-expense-meta">Rate: {formatCurrency(naRatePerSqMtr)} / sq.mtr</div>
              <div className="dd-additional-expense-total">{formatCurrency(naTotal)}</div>
            </div>
            </div>
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
                Download Report
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Edit Deal Modal ── */}
      {isEditingDeal && (
        <div className="logout-modal-overlay" onClick={() => !isSavingDeal && setIsEditingDeal(false)}>
          <div className="dashboard-modal dashboard-modal--large" onClick={e => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h3 className="dashboard-modal-title">{editDealSection === 'additional-expenses' ? 'Edit Additional Expenses' : 'Edit Deal Information'}</h3>
              <button className="dashboard-modal-close" onClick={() => setIsEditingDeal(false)} disabled={isSavingDeal}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-edit-form">
                {editDealSection === 'deal-info' ? (
                  <>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Village Name</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.villageName} onChange={e => setEditDealForm(p => ({...p, villageName: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Deal Type</label>
                    <AppSelect className="dashboard-form-input" value={editDealForm.dealType} onChange={e => setEditDealForm(p => ({...p, dealType: e.target.value}))}>
                      <option value="Buy">Buy</option>
                      <option value="Sell">Sell</option>
                      <option value="Other">Other</option>
                    </AppSelect>
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Broker Name</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.brokerName} onChange={e => setEditDealForm(p => ({...p, brokerName: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">NA Type</label>
                    <AppSelect className="dashboard-form-input" value={editDealForm.naType} onChange={e => setEditDealForm(p => ({...p, naType: e.target.value}))}>
                      <option value="">Select NA Type</option>
                      <option value="Residential">Residential</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Multi-purpose">Multi-purpose</option>
                    </AppSelect>
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">District</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.district} onChange={e => setEditDealForm(p => ({...p, district: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Sub District</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.subDistrict} onChange={e => setEditDealForm(p => ({...p, subDistrict: e.target.value}))} />
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Old Survey No.</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.oldSurveyNo} onChange={e => setEditDealForm(p => ({...p, oldSurveyNo: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">New Survey No.</label>
                    <input type="text" className="dashboard-form-input" value={editDealForm.newSurveyNo} onChange={e => setEditDealForm(p => ({...p, newSurveyNo: e.target.value}))} />
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Deal Date</label>
                    <input type="date" className="dashboard-form-input" value={editDealForm.dealDate} onChange={e => setEditDealForm(p => ({...p, dealDate: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Unit Price</label>
                    <input type="number" className="dashboard-form-input" value={editDealForm.pricePerSqYard} onChange={e => setEditDealForm(p => ({...p, pricePerSqYard: e.target.value}))} min="0" step="0.01" />
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Total Area (sq. yds)</label>
                    <input type="number" className="dashboard-form-input" value={editDealForm.totalSqYard} onChange={e => setEditDealForm(p => ({...p, totalSqYard: e.target.value}))} min="0" step="0.01" />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Total Area (sq. mtr)</label>
                    <input type="number" className="dashboard-form-input" value={editDealForm.totalSqMeter} onChange={e => setEditDealForm(p => ({...p, totalSqMeter: e.target.value}))} min="0" step="0.01" />
                  </div>
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Jantri Rate (₹/sq.mtr)</label>
                    <input type="number" className="dashboard-form-input" value={editDealForm.jantri} onChange={e => setEditDealForm(p => ({...p, jantri: e.target.value}))} min="0" step="0.01" />
                  </div>
                  <div className="dashboard-form-group" />
                </div>
                <div className="dashboard-form-row">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">25% Deadline</label>
                    <input type="date" className="dashboard-form-input" value={editDealForm.deadlineStartDate} onChange={e => setEditDealForm(p => ({...p, deadlineStartDate: e.target.value}))} />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">75% Deadline</label>
                    <input type="date" className="dashboard-form-input" value={editDealForm.deadlineEndDate} onChange={e => setEditDealForm(p => ({...p, deadlineEndDate: e.target.value}))} />
                  </div>
                </div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-form-row">
                      <div className="dashboard-form-group">
                        <label className="dashboard-form-label">Buy Brokering (%)</label>
                        <input type="number" className="dashboard-form-input" value={editDealForm.buyBrokeringPercent} onChange={e => setEditDealForm(p => ({...p, buyBrokeringPercent: e.target.value}))} min="0" step="0.01" />
                      </div>
                      <div className="dashboard-form-group">
                        <label className="dashboard-form-label">Sell C.P. Incentive Rate (₹/sq.yd)</label>
                        <input type="number" className="dashboard-form-input" value={editDealForm.sellCpIncentiveRate} onChange={e => setEditDealForm(p => ({...p, sellCpIncentiveRate: e.target.value}))} min="0" step="0.01" />
                      </div>
                    </div>
                    <div className="dashboard-form-row">
                      <div className="dashboard-form-group">
                        <label className="dashboard-form-label">Planpass Rate (₹/sq.mtr)</label>
                        <input type="number" className="dashboard-form-input" value={editDealForm.planpassRatePerSqMtr} onChange={e => setEditDealForm(p => ({...p, planpassRatePerSqMtr: e.target.value}))} min="0" step="0.01" />
                      </div>
                      <div className="dashboard-form-group">
                        <label className="dashboard-form-label">NA Rate (₹/sq.mtr)</label>
                        <input type="number" className="dashboard-form-input" value={editDealForm.naRatePerSqMtr} onChange={e => setEditDealForm(p => ({...p, naRatePerSqMtr: e.target.value}))} min="0" step="0.01" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="dashboard-modal-actions">
              <button className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={() => setIsEditingDeal(false)} disabled={isSavingDeal}>Cancel</button>
              <button className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={handleSaveDeal} disabled={isSavingDeal}>
                {isSavingDeal ? <><span className="modal-spinner" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <AppSelect
                        name="modeOfPayment"
                        className="dashboard-form-input"
                        value={editPaymentForm.modeOfPayment}
                        onChange={handleEditFormChange}
                      >
                        <option value="Bank">Bank</option>
                        <option value="Other">Other</option>
                      </AppSelect>
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
                    <AppTextarea
                      name="remarks"
                      className="dashboard-form-input dd-textarea-resize"
                      value={editPaymentForm.remarks}
                      onChange={handleEditFormChange}
                      rows="3"
                      placeholder="Add any notes or remarks..."
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
                <span className="dd-danger-note">This action cannot be undone.</span>
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

      {/* ── Delete Add More Confirmation Modal ── */}
      {confirmDeleteAddMoreIndex !== null && (() => {
        const entry = addMoreEntries[confirmDeleteAddMoreIndex];
        return (
          <div className="logout-modal-overlay" onClick={() => !isSavingAddMore && setConfirmDeleteAddMoreIndex(null)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="logout-modal-title">Delete Add More Entry?</h3>
              <p className="logout-modal-desc">
                Are you sure you want to delete this entry?<br />
                {entry && (
                  <>
                    <strong>{entry.percentage || 0}%</strong> &mdash; {entry.date ? formatShortDate(entry.date) : 'N/A'}<br />
                    <strong>{formatCurrency(entry.amount || 0)}</strong>
                  </>
                )}<br />
                <span className="dd-danger-note">This action cannot be undone.</span>
              </p>
              <div className="logout-modal-actions">
                <button
                  className="logout-modal-btn logout-modal-btn--cancel"
                  onClick={() => setConfirmDeleteAddMoreIndex(null)}
                  disabled={isSavingAddMore}
                >
                  Cancel
                </button>
                <button
                  className="logout-modal-btn logout-modal-btn--confirm"
                  onClick={async () => {
                    await handleDeleteAddMore(confirmDeleteAddMoreIndex);
                    setConfirmDeleteAddMoreIndex(null);
                  }}
                  disabled={isSavingAddMore}
                >
                  {isSavingAddMore ? <><span className="modal-spinner" /> Deleting…</> : 'Yes, Delete'}
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
