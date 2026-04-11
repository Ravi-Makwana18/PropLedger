import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import AppSelect from '../components/ui/AppSelect';
import { preloadRoute } from '../utils/preloadRoutes';
import './Dashboard.css';

const DASHBOARD_CACHE_KEY = 'pl_dashboard_deals';

const readCachedDeals = () => {
  try {
    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

/* ── Icon components defined OUTSIDE the component so they never recreate ── */
const EditIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [deals, setDeals] = useState(() => readCachedDeals());
  const [searchTerm, setSearchTerm] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('type');
    return (t === 'Buy' || t === 'Sell' || t === 'Other') ? t : 'All';
  });
  const [loading, setLoading] = useState(() => readCachedDeals().length === 0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' }); // type: 'success' | 'error'
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    district: '',
    subDistrict: '',
    villageName: '',
    oldSurveyNo: '',
    newSurveyNo: '',
    dealType: 'Buy',
    pricePerSqYard: '',
    totalSqYard: '',
    totalSqMeter: '',
    jantri: '',
    totalAmount: '',
    paymentDeadlineMonth: ''
  });
  // ── Sorting state ────────────────────────────────────────────────────────
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('latest');
  const [expandedDeals, setExpandedDeals] = useState([]); // For mobile accordion - all closed by default
  const sortOptions = [
    { value: 'latest', label: 'Latest Added' },
    { value: 'village', label: 'Village Name (A-Z)' },
    { value: 'unitPriceAsc', label: 'Unit Price (Low-High)' },
    { value: 'unitPriceDesc', label: 'Unit Price (High-Low)' },
    { value: 'totalAmountAsc', label: 'Total Amount (Low-High)' },
    { value: 'totalAmountDesc', label: 'Total Amount (High-Low)' },
    { value: 'deadline', label: 'Payment Deadline (Nearest First)' },
  ];

  // Toggle deal expansion for mobile
  const toggleDeal = (dealId) => {
    setExpandedDeals(prev =>
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  // ── On mount: load all deals ────────────────────────────────────────────
  useEffect(() => {
    fetchDeals();
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortOpen && !e.target.closest('.dashboard-sort-btn') && !e.target.closest('.dashboard-sort-dropdown')) {
        setSortOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sortOpen]);

  // ── Sync deal-type filter with the ?type= URL query parameter ────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'Buy' || typeParam === 'Sell' || typeParam === 'Other') {
      setDealTypeFilter(typeParam);
    } else {
      setDealTypeFilter('All');
    }
  }, [location.search]);

  // ── API: fetch all deals from the server ──────────────────────────────────
  const fetchDeals = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/deals');
      setDeals(data);
      sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  // ── API: keyword search (falls back to full list on empty query) ──────────
  const handleSearch = async () => {
    if (!searchTerm.trim()) { fetchDeals(); return; }
    setLoading(true);
    try {
      const { data } = await API.get(`/api/deals/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setDeals(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // ── API: delete deal — 600 ms buffer gives a processing spinner before firing
  const handleDelete = async (dealId) => {
    setIsDeleting(true);
    setTimeout(async () => {
      try {
        await API.delete(`/api/deals/${dealId}`);
        setDeals(deals.filter(deal => deal._id !== dealId));
        setConfirmDeleteId(null);
        showToast('Deal deleted successfully');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete deal', 'error');
      } finally {
        setIsDeleting(false);
      }
    }, 600);
  };

  // ── Edit helpers ─────────────────────────────────────────────────────────
  const handleEdit = (deal) => {
    setEditingId(deal._id);
    setEditFormData({
      district: deal.district || '',
      subDistrict: deal.subDistrict || '',
      villageName: deal.villageName,
      oldSurveyNo: deal.oldSurveyNo || '',
      newSurveyNo: deal.newSurveyNo || deal.surveyNumber || '',
      dealType: deal.dealType || 'Buy',
      pricePerSqYard: deal.pricePerSqYard,
      totalSqYard: deal.totalSqYard,
      totalSqMeter: deal.totalSqMeter || '',
      jantri: deal.jantri || '',
      totalAmount: deal.totalAmount,
      paymentDeadlineMonth: deal.deadlineEndDate || deal.paymentDeadlineMonth
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ district: '', subDistrict: '', villageName: '', oldSurveyNo: '', newSurveyNo: '', dealType: 'Buy', pricePerSqYard: '', totalSqYard: '', totalSqMeter: '', jantri: '', totalAmount: '', paymentDeadlineMonth: '' });
  };

  // Auto-calculate totalAmount when unit price or area changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'pricePerSqYard' || name === 'totalSqYard') {
        const price = parseFloat(name === 'pricePerSqYard' ? value : prev.pricePerSqYard) || 0;
        const area = parseFloat(name === 'totalSqYard' ? value : prev.totalSqYard) || 0;
        updated.totalAmount = price * area;
      }
      return updated;
    });
  };

  const handleSaveEdit = async (dealId) => {
    setIsSavingEdit(true);
    try {
      // Prepare payload with correct field names
      const payload = {
        district: editFormData.district,
        subDistrict: editFormData.subDistrict,
        villageName: editFormData.villageName,
        oldSurveyNo: editFormData.oldSurveyNo || undefined,
        newSurveyNo: editFormData.newSurveyNo,
        dealType: editFormData.dealType,
        pricePerSqYard: parseFloat(editFormData.pricePerSqYard),
        totalSqYard: parseFloat(editFormData.totalSqYard),
        totalSqMeter: editFormData.totalSqMeter ? parseFloat(editFormData.totalSqMeter) : undefined,
        jantri: editFormData.jantri ? parseFloat(editFormData.jantri) : undefined,
        deadlineEndDate: editFormData.paymentDeadlineMonth || undefined
      };

      const { data } = await API.put(`/api/deals/${dealId}`, payload);
      setDeals(deals.map(deal => deal._id === dealId ? data : deal));
      setEditingId(null);
      setEditFormData({ district: '', subDistrict: '', villageName: '', oldSurveyNo: '', newSurveyNo: '', dealType: 'Buy', pricePerSqYard: '', totalSqYard: '', totalSqMeter: '', jantri: '', totalAmount: '', paymentDeadlineMonth: '' });
      showToast('Deal updated successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update deal', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Formatters (currency + date) ─────────────────────────────────────────
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  // Short, human-friendly currency (Indian units): shows Crore / Lakh / K as appropriate
  const formatCurrencyShort = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    const abs = Math.abs(amount || 0);
    if (abs >= 10000000) { // 1 Crore = 1e7
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) { // 1 Lakh = 1e5
      return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    if (abs >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
  };



  // ── Inline SVG icon components are now defined at module level ──────────


  // Filter and sort deals for rendering
  // Filter by search term
  const getFilteredDeals = () => {
    let filtered = deals;
    // Apply deal type filter
    if (dealTypeFilter !== 'All') {
      filtered = filtered.filter(deal => (deal.dealType || 'Buy') === dealTypeFilter);
    }
    // Apply search term filter
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm) {
      const term = trimmedTerm.toLowerCase();
      filtered = filtered.filter(deal => {
        const village = deal.villageName?.trim().toLowerCase() || '';
        const district = deal.district?.trim().toLowerCase() || '';
        const subDistrict = deal.subDistrict?.trim().toLowerCase() || '';
        const newSurvey = String(deal.newSurveyNo || deal.surveyNumber || '').trim().toLowerCase();
        const oldSurvey = String(deal.oldSurveyNo || '').trim().toLowerCase();

        return village.includes(term) ||
          district.includes(term) ||
          subDistrict.includes(term) ||
          newSurvey.includes(term) ||
          oldSurvey.includes(term);
      });
    }
    return filtered;
  };

  const getSortedDeals = (filteredDeals) => {
    let sorted = [...filteredDeals];
    switch (sortOption) {
      case 'village':
        sorted.sort((a, b) => a.villageName.localeCompare(b.villageName));
        break;
      case 'unitPriceAsc':
        sorted.sort((a, b) => (a.pricePerSqYard || 0) - (b.pricePerSqYard || 0));
        break;
      case 'unitPriceDesc':
        sorted.sort((a, b) => (b.pricePerSqYard || 0) - (a.pricePerSqYard || 0));
        break;
      case 'totalAmountAsc':
        sorted.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
        break;
      case 'totalAmountDesc':
        sorted.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        break;
      case 'deadline':
        sorted.sort((a, b) => {
          const da = new Date(a.deadlineEndDate || a.paymentDeadlineMonth || 0);
          const db = new Date(b.deadlineEndDate || b.paymentDeadlineMonth || 0);
          return da - db;
        });
        break;
      case 'latest':
      default:
        sorted.sort((a, b) => {
          if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
          return b._id.localeCompare(a._id);
        });
        break;
    }
    return sorted;
  };

  const filteredDeals = getFilteredDeals();
  const sortedDeals = getSortedDeals(filteredDeals);

  const totalDeals = dealTypeFilter === 'All' ? deals.length : deals.filter(d => (d.dealType || 'Buy') === dealTypeFilter).length;
  const filteredCount = sortedDeals.length;
  
  const dealsForKPI = dealTypeFilter === 'All' ? deals : deals.filter(d => (d.dealType || 'Buy') === dealTypeFilter);
  const totalValue = dealsForKPI.reduce((sum, deal) => sum + (deal.totalAmount || 0), 0);

  // ── KPI Computations (filtered by deal type) ─────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dealsThisMonth = dealsForKPI.filter(d => {
    const created = d.createdAt ? new Date(d.createdAt) : null;
    return created && created >= startOfMonth;
  }).length;

  const totalPaid = dealsForKPI.reduce((sum, deal) => {
    return sum + (deal.totalPaid || 0);
  }, 0);

  const totalPending = Math.max(0, totalValue - totalPaid);

  const clearedCount = dealsForKPI.filter(deal => {
    const paid = deal.totalPaid || 0;
    return paid >= (deal.totalAmount || 0) && deal.totalAmount > 0;
  }).length;

  // ── Deadline Alert Computation ────────────────────────────────────────────
  // Warn when any payment milestone deadline is within ALERT_DAYS or overdue
  const ALERT_DAYS = 7;
  const deadlineAlerts = deals.flatMap(deal => {
    const alerts = [];
    const paid = deal.totalPaid || 0;
    const total = deal.totalAmount || 0;
    if (!total) return [];
    const paidPct = total > 0 ? (paid / total) * 100 : 0;
    // Check each milestone (25 / 50 / 75 / 100 %)
    const milestones = deal.paymentMilestones || [];
    milestones.forEach(ms => {
      if (!ms.dueDate || paidPct >= ms.percentage) return;
      const due = new Date(ms.dueDate);
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= ALERT_DAYS) {
        alerts.push({
          dealId: deal._id,
          dealName: deal.villageName,
          surveyNo: deal.newSurveyNo || deal.surveyNumber,
          percentage: ms.percentage,
          daysLeft,
          overdue: daysLeft < 0
        });
      }
    });
    // Fallback: use deadlineEndDate if no milestones
    if (milestones.length === 0 && paidPct < 100) {
      const deadline = deal.deadlineEndDate || deal.paymentDeadlineMonth;
      if (deadline) {
        const due = new Date(deadline);
        const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= ALERT_DAYS) {
          alerts.push({
            dealId: deal._id,
            dealName: deal.villageName,
            surveyNo: deal.newSurveyNo || deal.surveyNumber,
            percentage: 100,
            daysLeft,
            overdue: daysLeft < 0
          });
        }
      }
    }
    return alerts;
  });

  // ── Deal Status Tag Helper ────────────────────────────────────────────────
  const getDealStatus = (deal) => {
    const paid = deal.totalPaid || 0;
    const total = deal.totalAmount || 0;
    if (!total) return null;
    if (paid >= total) return { label: 'Cleared', cls: 'status-tag--cleared' };
    const deadline = deal.deadlineEndDate || deal.paymentDeadlineMonth;
    if (deadline && new Date(deadline) < now && paid < total) {
      return { label: 'Overdue', cls: 'status-tag--overdue' };
    }
    if (paid > 0) return { label: 'In Progress', cls: 'status-tag--progress' };
    return { label: 'Not Started', cls: 'status-tag--pending' };
  };

  return (
    <div className="dashboard-page">
      {/* ── Hero Header ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <div className="dashboard-hero-top">
            <div>
              <h1 className="dashboard-hero-title">
                {dealTypeFilter === 'Buy' ? 'Purchase Deals'
                  : dealTypeFilter === 'Sell' ? 'Sell Deals'
                    : dealTypeFilter === 'Other' ? 'Other Deals'
                      : 'Dashboard'}
              </h1>
              <p className="dashboard-hero-subtitle">Manage and track all your property transactions</p>
            </div>
          </div>

          {/* ── KPI Stat Cards ── */}
          <div className="dashboard-kpi-row">
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon dashboard-kpi-icon--portfolio">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Rupee Symbol */}
                  <path d="M6 4h12M6 8h12M10 8c2.5 0 4 1.5 4 3s-1.5 3-4 3H6l8 6" />
                </svg>
              </div>
              <div className="dashboard-kpi-info">
                <span className="dashboard-kpi-label">Portfolio Value</span>
                <span className="dashboard-kpi-value" title={formatCurrency(totalValue)}>
                  {formatCurrencyShort(totalValue)}
                </span>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon dashboard-kpi-icon--month">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dashboard-kpi-info">
                <span className="dashboard-kpi-label">Added This Month</span>
                <span className="dashboard-kpi-value">{dealsThisMonth}</span>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon dashboard-kpi-icon--pending">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="dashboard-kpi-info">
                <span className="dashboard-kpi-label">Pending Payments</span>
                <span className="dashboard-kpi-value dashboard-kpi-value--warn" title={formatCurrency(totalPending)}>
                  {formatCurrencyShort(totalPending)}
                </span>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon dashboard-kpi-icon--cleared">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="dashboard-kpi-info">
                <span className="dashboard-kpi-label">Deals Cleared</span>
                <span className="dashboard-kpi-value dashboard-kpi-value--success">{clearedCount} / {totalDeals}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deadline Alerts Banner ── */}
      {deadlineAlerts.length > 0 && (
        <div className="deadline-alerts-wrap">
          {deadlineAlerts.map((alert, i) => (
            <div key={`${alert.dealId}-${i}`} className={`deadline-alert ${alert.overdue ? 'deadline-alert--overdue' : 'deadline-alert--warning'}`}>
              <div className="deadline-alert-icon">
                {alert.overdue ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
              <div className="deadline-alert-body">
                <strong>{alert.dealName}</strong>
                {alert.surveyNo && <span className="deadline-alert-survey"> (#{alert.surveyNo})</span>}
                {' — '}
                {alert.overdue
                  ? `Payment deadline overdue by ${Math.abs(alert.daysLeft)} day${Math.abs(alert.daysLeft) !== 1 ? 's' : ''}!`
                  : alert.daysLeft === 0
                    ? `Payment deadline is TODAY!`
                    : `Payment deadline in ${alert.daysLeft} day${alert.daysLeft !== 1 ? 's' : ''}.`
                }
              </div>
              <a href={`/deals/${alert.dealId}`} className="deadline-alert-link">View Deal →</a>
            </div>
          ))}
        </div>
      )}

      {error && <div className="hp-error-banner pl-alert pl-alert--error">⚠️ {error}</div>}
      {toast.message && (
        <div className={`hp-error-banner pl-alert pl-alert--${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="dashboard-filters-wrap">
        <div className="dashboard-filters app-card">
          {/* Search */}
          <div className="dashboard-search-wrap">
            <svg className="dashboard-search-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <AppInput
              type="text"
              className="dashboard-search-input"
              placeholder="Search by village name or survey number…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <AppButton onClick={handleSearch} className="dashboard-search-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="24" y1="24" x2="16.65" y2="16.65" />
            </svg>
            <span className="dashboard-search-btn-text">Search</span>
          </AppButton>

          {/* Sort Button */}
          <div className="dashboard-sort-wrap">
            <AppButton
              className="dashboard-sort-btn"
              onClick={() => setSortOpen((v) => !v)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
              <span className="dashboard-sort-btn-text">Sort</span>
            </AppButton>
            {sortOpen && (
              <div className="dashboard-sort-dropdown">
                {sortOptions.map(opt => (
                  <div
                    key={opt.value}
                    className={`dashboard-sort-option${sortOption === opt.value ? ' dashboard-sort-option--active' : ''}`}
                    onClick={() => { setSortOption(opt.value); setSortOpen(false); }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && dealTypeFilter === 'All' && (
        <div className="dashboard-toolbar">
          <div className="dashboard-count-badge">
            {filteredCount} of {totalDeals} deals
          </div>
          <Link to="/add-deal" className="dashboard-add-btn app-btn">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Deal
          </Link>
        </div>
      )}

      {loading ? (
        <div className="dashboard-empty pl-state pl-state--loading">
          <div className="spinner" style={{ width: 42, height: 42 }}></div>
          <h3 className="pl-empty-title">Loading deals...</h3>
          <p className="pl-empty-desc">Fetching your latest dashboard data.</p>
        </div>
      ) : sortedDeals.length === 0 ? (
        <div className="dashboard-empty pl-state pl-state--empty">
          <span className="dashboard-empty-icon pl-empty-icon">📁</span>
          <h3 className="pl-empty-title">No deals found</h3>
          <p className="pl-empty-desc">{searchTerm || dealTypeFilter !== 'All' ? 'Try adjusting your filters.' : 'No deals have been created yet.'}</p>
        </div>
      ) : (
        <div className="dashboard-deals-grid">
          {sortedDeals.map((deal) => (
            <div key={deal._id} className={`dashboard-deal-card ${expandedDeals.includes(deal._id) ? 'dashboard-deal-card--expanded' : ''}`}>
              <div className="dashboard-deal-header app-section-header" onClick={() => toggleDeal(deal._id)}>
                <div className="dashboard-deal-header-left">
                  <h3 className="dashboard-deal-title">{deal.villageName}</h3>
                  <div className="dashboard-deal-survey">
                    <span className="dashboard-deal-survey-text">New Survey #</span>{deal.newSurveyNo || deal.surveyNumber}
                  </div>
                </div>
                <div className="dashboard-deal-header-right">
                  {(() => {
                    const status = getDealStatus(deal);
                    return status ? (
                      <span className={`status-tag ${status.cls}`}>{status.label}</span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="dashboard-deal-content">

                <div className="dashboard-deal-details">
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">District</span>
                    <span className="dashboard-deal-detail-value">{deal.district || 'N/A'}</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Sub-District</span>
                    <span className="dashboard-deal-detail-value">{deal.subDistrict || 'N/A'}</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Unit Price</span>
                    <span className="dashboard-deal-detail-value">{formatCurrency(deal.pricePerSqYard)}</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Total Area</span>
                    <span className="dashboard-deal-detail-value">{deal.totalSqYard.toLocaleString('en-IN')} sq.yds</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Sq. Meter</span>
                    <span className="dashboard-deal-detail-value">{deal.totalSqMeter ? deal.totalSqMeter.toLocaleString('en-IN') : 0}</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Jantri</span>
                    <span className="dashboard-deal-detail-value">{deal.jantri ? formatCurrency(deal.jantri) : '₹0'}</span>
                  </div>
                  <div className="dashboard-deal-detail">
                    <span className="dashboard-deal-detail-label">Total Amount</span>
                    <span className="dashboard-deal-amount">{formatCurrency(deal.totalAmount)}</span>
                  </div>
                </div>

                <div className="dashboard-deal-actions app-actions-row">
                  <Link
                    to={`/deals/${deal._id}`}
                    className="dashboard-action-btn app-btn dashboard-action-btn--view"
                    onMouseEnter={() => preloadRoute('dealDetails')}
                    onFocus={() => preloadRoute('dealDetails')}
                    onTouchStart={() => preloadRoute('dealDetails')}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="dashboard-action-btn-text">View Details</span>
                  </Link>
                  {isAdmin && (
                    <>
                      <AppButton onClick={() => handleEdit(deal)} className="dashboard-action-btn dashboard-action-btn--edit">
                        <EditIconSvg />
                        <span className="dashboard-action-btn-text">Edit</span>
                      </AppButton>
                      <AppButton onClick={() => setConfirmDeleteId(deal._id)} className="dashboard-action-btn dashboard-action-btn--delete">
                        <DeleteIconSvg />
                        <span className="dashboard-action-btn-text">Delete</span>
                      </AppButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── Edit Modal ── */}
      {editingId && (() => {
        // eslint-disable-next-line no-unused-vars
        const deal = deals.find(d => d._id === editingId);
        return (
          <div className="dashboard-modal-overlay" onClick={handleCancelEdit}>
            <div className="dashboard-modal dashboard-modal--large" onClick={e => e.stopPropagation()}>
              <div className="dashboard-modal-header">
                <h3 className="dashboard-modal-title">Edit Deal</h3>
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
                      <label className="dashboard-form-label">District</label>
                      <AppInput
                        type="text"
                        name="district"
                        className="dashboard-form-input"
                        value={editFormData.district}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Sub-District</label>
                      <AppInput
                        type="text"
                        name="subDistrict"
                        className="dashboard-form-input"
                        value={editFormData.subDistrict}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Village Name</label>
                    <AppInput
                      type="text"
                      name="villageName"
                      className="dashboard-form-input"
                      value={editFormData.villageName}
                      onChange={handleEditFormChange}
                    />
                  </div>

                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Old Survey No.</label>
                      <AppInput
                        type="text"
                        name="oldSurveyNo"
                        className="dashboard-form-input"
                        value={editFormData.oldSurveyNo}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">New Survey No.</label>
                      <AppInput
                        type="text"
                        name="newSurveyNo"
                        className="dashboard-form-input"
                        value={editFormData.newSurveyNo}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Deal Type</label>
                      <AppSelect
                        name="dealType"
                        className="dashboard-form-input"
                        value={editFormData.dealType}
                        onChange={handleEditFormChange}
                      >
                        <option value="Buy">Purchase</option>
                        <option value="Sell">Sell</option>
                        <option value="Other">Other</option>
                      </AppSelect>
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Price per Sq. Yard</label>
                      <AppInput
                        type="number"
                        name="pricePerSqYard"
                        className="dashboard-form-input"
                        value={editFormData.pricePerSqYard}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Total Sq. Yard</label>
                      <AppInput
                        type="number"
                        name="totalSqYard"
                        className="dashboard-form-input"
                        value={editFormData.totalSqYard}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Total Sq. Meter</label>
                      <AppInput
                        type="number"
                        name="totalSqMeter"
                        className="dashboard-form-input"
                        value={editFormData.totalSqMeter}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Jantri</label>
                      <AppInput
                        type="number"
                        name="jantri"
                        className="dashboard-form-input"
                        value={editFormData.jantri}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Total Amount</label>
                      <AppInput
                        type="number"
                        name="totalAmount"
                        value={editFormData.totalAmount}
                        readOnly
                        className="dashboard-form-input dashboard-form-input--readonly"
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Payment Deadline</label>
                    <AppInput
                      type="date"
                      name="paymentDeadlineMonth"
                      className="dashboard-form-input"
                      value={editFormData.paymentDeadlineMonth ? new Date(editFormData.paymentDeadlineMonth).toISOString().split('T')[0] : ''}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
              </div>
              <div className="dashboard-modal-actions">
                <AppButton className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={handleCancelEdit} disabled={isSavingEdit}>Cancel</AppButton>
                <AppButton className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={() => handleSaveEdit(editingId)} disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <>
                      <span className="dashboard-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </AppButton>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDeleteId && (() => {
        const deal = deals.find(d => d._id === confirmDeleteId);
        return (
          <div className="dashboard-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
              <div className="dashboard-modal-icon">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="dashboard-modal-title">Delete Deal?</h3>
              <p className="dashboard-modal-desc">
                Are you sure you want to delete<br />
                <strong>{deal?.villageName}</strong> (New Survey #{deal?.newSurveyNo || deal?.surveyNumber})?<br />
                <span className="dashboard-danger-note">This action cannot be undone.</span>
              </p>
              <div className="dashboard-modal-actions">
                <AppButton className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}>Cancel</AppButton>
                <AppButton className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={() => handleDelete(confirmDeleteId)} disabled={isDeleting}>
                  {isDeleting ? <><span className="dashboard-modal-spinner" /> Deleting…</> : 'Yes, Delete'}
                </AppButton>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
