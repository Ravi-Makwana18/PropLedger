import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('type');
    return (t === 'Buy' || t === 'Sell' || t === 'Other') ? t : 'All';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    villageName: '',
    surveyNumber: '',
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
    try {
      const { data } = await API.get('/api/deals');
      setDeals(data);
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
      const { data } = await API.get(`/api/deals/search?q=${searchTerm}`);
      setDeals(data);
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
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete deal');
      } finally {
        setIsDeleting(false);
      }
    }, 600);
  };

  // ── Edit helpers ─────────────────────────────────────────────────────────
  const handleEdit = (deal) => {
    setEditingId(deal._id);
    setEditFormData({
      villageName: deal.villageName,
      surveyNumber: deal.surveyNumber,
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
    setEditFormData({ villageName: '', surveyNumber: '', dealType: 'Buy', pricePerSqYard: '', totalSqYard: '', totalSqMeter: '', jantri: '', totalAmount: '', paymentDeadlineMonth: '' });
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
        villageName: editFormData.villageName,
        surveyNumber: editFormData.surveyNumber,
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
      setEditFormData({ villageName: '', surveyNumber: '', dealType: 'Buy', pricePerSqYard: '', totalSqYard: '', totalSqMeter: '', jantri: '', totalAmount: '', paymentDeadlineMonth: '' });
      alert('Deal updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update deal');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Formatters (currency + date) ─────────────────────────────────────────
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  // ── Inline SVG icon components ──────────────────────────────────────────
  const EditIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const DeleteIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );

  // ── Loading state: shimmer skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-skeleton-card" style={{ height: 200, marginBottom: '2rem' }} />
        <div className="dashboard-skeleton-card" style={{ height: 80, marginBottom: '1.5rem' }} />
        <div className="dashboard-deals-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="dashboard-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  // Filter and sort deals for rendering
  // Filter by search term
  const getFilteredDeals = () => {
    let filtered = deals;
    // Apply deal type filter
    if (dealTypeFilter !== 'All') {
      filtered = filtered.filter(deal => (deal.dealType || 'Buy') === dealTypeFilter);
    }
    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(deal =>
        deal.villageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.surveyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const totalDeals = deals.length;
  const filteredCount = sortedDeals.length;
  const totalValue = sortedDeals.reduce((sum, deal) => sum + (deal.totalAmount || 0), 0);

  return (
    <div className="dashboard-page">
      {/* ── Hero Header ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <div className="dashboard-hero-top">
            <div className="dashboard-hero-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <h1 className="dashboard-hero-title">Land Deals</h1>
              <p className="dashboard-hero-subtitle">Manage and track all your property transactions</p>
            </div>
          </div>

          {/* Summary chips */}
          <div className="dashboard-summary-row">
            <div className="dashboard-chip">
              <span className="dashboard-chip-label">Total Deals</span>
              <span className="dashboard-chip-value">{totalDeals}</span>
            </div>
            <div className="dashboard-chip">
              <span className="dashboard-chip-label">Showing</span>
              <span className="dashboard-chip-value">{filteredCount}</span>
            </div>
            <div className="dashboard-chip">
              <span className="dashboard-chip-label">Total Value</span>
              <span className="dashboard-chip-value">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="hp-error-banner">⚠️ {error}</div>}

      {/* ── Filters Bar ── */}
      <div className="dashboard-filters-wrap">
        <div className="dashboard-filters">
          {/* Search */}
          <div className="dashboard-search-wrap">
            <svg className="dashboard-search-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Search by village name or survey number…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <button onClick={handleSearch} className="dashboard-search-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="dashboard-search-btn-text">Search</span>
          </button>

          {/* Sort Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="dashboard-sort-btn"
              onClick={() => setSortOpen((v) => !v)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
              <span className="dashboard-sort-btn-text">Sort</span>
            </button>
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

      {/* Deal Type Filter Pills */}
      <div className="dashboard-type-pills">
        {['All', 'Buy', 'Sell', 'Other'].map(type => (
          <button
            key={type}
            className={`dashboard-type-pill${dealTypeFilter === type ? ' dashboard-type-pill--active' : ''}`}
            onClick={() => setDealTypeFilter(type)}
          >
            {type === 'Buy' && <span className="dashboard-type-pill-dot dashboard-type-pill-dot--buy" />}
            {type === 'Sell' && <span className="dashboard-type-pill-dot dashboard-type-pill-dot--sell" />}
            {type === 'Other' && <span className="dashboard-type-pill-dot dashboard-type-pill-dot--other" />}
            {type === 'All' ? 'All Deals' : `${type} Deals`}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="dashboard-toolbar">
          <div className="dashboard-count-badge">
            {filteredCount} of {totalDeals} deals
          </div>
          <Link to="/add-deal" className="dashboard-add-btn">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Deal
          </Link>
        </div>
      )}

      {sortedDeals.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-empty-icon">📁</span>
          <h3>No deals found</h3>
          <p>{searchTerm || dealTypeFilter !== 'All' ? 'Try adjusting your filters.' : 'No deals have been created yet.'}</p>
        </div>
      ) : (
        <div className="dashboard-deals-grid">
          {sortedDeals.map((deal) => (
            <div key={deal._id} className={`dashboard-deal-card ${expandedDeals.includes(deal._id) ? 'dashboard-deal-card--expanded' : ''}`}>
              <div className="dashboard-deal-header" onClick={() => toggleDeal(deal._id)}>
                <div className="dashboard-deal-header-left">
                  <h3 className="dashboard-deal-title">{deal.villageName}</h3>
                  <div className="dashboard-deal-survey">
                    <span className="dashboard-deal-survey-text">Survey #</span>{deal.surveyNumber}
                  </div>
                </div>
                <span className={`dashboard-deal-type-badge dashboard-deal-type-badge--${(deal.dealType || 'Buy').toLowerCase()}`}>
                  <span className="dashboard-deal-type-badge-text">{deal.dealType || 'Buy'}</span>
                </span>
              </div>

              <div className="dashboard-deal-content">

              <div className="dashboard-deal-details">
                <div className="dashboard-deal-detail">
                  <span className="dashboard-deal-detail-label">Unit Price</span>
                  <span className="dashboard-deal-detail-value">{formatCurrency(deal.pricePerSqYard)}</span>
                </div>
                <div className="dashboard-deal-detail">
                  <span className="dashboard-deal-detail-label">Total Area</span>
                  <span className="dashboard-deal-detail-value">{deal.totalSqYard.toLocaleString('en-IN')} sq.yd</span>
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
                  <span className="dashboard-deal-detail-label">Deadline</span>
                  <span className="dashboard-deal-detail-value">{deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : formatDate(deal.paymentDeadlineMonth)}</span>
                </div>
                <div className="dashboard-deal-detail">
                  <span className="dashboard-deal-detail-label">Total Amount</span>
                  <span className="dashboard-deal-amount">{formatCurrency(deal.totalAmount)}</span>
                </div>
              </div>

              <div className="dashboard-deal-actions">
                <Link to={`/deals/${deal._id}`} className="dashboard-action-btn dashboard-action-btn--view">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="dashboard-action-btn-text">View Details</span>
                </Link>
                {isAdmin && (
                  <>
                    <button onClick={() => handleEdit(deal)} className="dashboard-action-btn dashboard-action-btn--edit">
                      <EditIconSvg />
                      <span className="dashboard-action-btn-text">Edit</span>
                    </button>
                    <button onClick={() => setConfirmDeleteId(deal._id)} className="dashboard-action-btn dashboard-action-btn--delete">
                      <DeleteIconSvg />
                      <span className="dashboard-action-btn-text">Delete</span>
                    </button>
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
                      <label className="dashboard-form-label">Village Name</label>
                      <input
                        type="text"
                        name="villageName"
                        className="dashboard-form-input"
                        value={editFormData.villageName}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Survey Number</label>
                      <input
                        type="text"
                        name="surveyNumber"
                        className="dashboard-form-input"
                        value={editFormData.surveyNumber}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Deal Type</label>
                      <select
                        name="dealType"
                        className="dashboard-form-input"
                        value={editFormData.dealType}
                        onChange={handleEditFormChange}
                      >
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Price per Sq. Yard</label>
                      <input
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
                      <input
                        type="number"
                        name="totalSqYard"
                        className="dashboard-form-input"
                        value={editFormData.totalSqYard}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Total Sq. Meter</label>
                      <input
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
                      <input
                        type="number"
                        name="jantri"
                        className="dashboard-form-input"
                        value={editFormData.jantri}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label className="dashboard-form-label">Total Amount</label>
                      <input
                        type="number"
                        name="totalAmount"
                        className="dashboard-form-input"
                        value={editFormData.totalAmount}
                        readOnly
                        style={{ backgroundColor: '#f7fafc', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">Payment Deadline</label>
                    <input
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
                <button className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={handleCancelEdit} disabled={isSavingEdit}>Cancel</button>
                <button className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={() => handleSaveEdit(editingId)} disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <>
                      <span className="dashboard-modal-spinner" />
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
                <strong>{deal?.villageName}</strong> (Survey #{deal?.surveyNumber})?<br />
                <span style={{ color: '#e53e3e', fontSize: '0.82rem' }}>This action cannot be undone.</span>
              </p>
              <div className="dashboard-modal-actions">
                <button className="dashboard-modal-btn dashboard-modal-btn--cancel" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}>Cancel</button>
                <button className="dashboard-modal-btn dashboard-modal-btn--confirm" onClick={() => handleDelete(confirmDeleteId)} disabled={isDeleting}>
                  {isDeleting ? <><span className="dashboard-modal-spinner" /> Deleting…</> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;