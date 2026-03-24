import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  const sortOptions = [
    { value: 'latest', label: 'Latest Added' },
    { value: 'village', label: 'Village Name (A-Z)' },
    { value: 'unitPriceAsc', label: 'Unit Price (Low-High)' },
    { value: 'unitPriceDesc', label: 'Unit Price (High-Low)' },
    { value: 'totalAmountAsc', label: 'Total Amount (Low-High)' },
    { value: 'totalAmountDesc', label: 'Total Amount (High-Low)' },
    { value: 'deadline', label: 'Payment Deadline (Nearest First)' },
  ];

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
    try {
      const { data } = await API.put(`/api/deals/${dealId}`, editFormData);
      setDeals(deals.map(deal => deal._id === dealId ? data : deal));
      setEditingId(null);
      setEditFormData({ villageName: '', surveyNumber: '', dealType: 'Buy', pricePerSqYard: '', totalSqYard: '', totalAmount: '', paymentDeadlineMonth: '' });
      alert('Deal updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update deal');
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
        {/* Shimmer skeleton mimicking the dashboard layout */}
        <div className="db-skeleton-search" />
        <div className="db-skeleton-pills">
          {[1, 2, 3, 4].map(i => <div key={i} className="db-skeleton-pill" />)}
        </div>
        <div className="db-skeleton-toolbar">
          <div className="db-skeleton-line" style={{ width: 120, height: 28, borderRadius: 20 }} />
          <div className="db-skeleton-line" style={{ width: 140, height: 36, borderRadius: 8, marginLeft: 'auto' }} />
        </div>
        <div className="deals-table-wrap">
          <table className="deals-table">
            <thead>
              <tr>
                {['Village Name', 'Survey No.', 'Deal Type', 'Unit Price', 'Total Area', 'Sq. Meter', 'Jantri', 'Total Amount', 'Deadline', 'Actions'].map(h => (
                  <th key={h}><div className="db-skeleton-line" style={{ height: 14, width: '70%' }} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(7)].map((_, i) => (
                <tr key={i}>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '80%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '50%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 22, width: 48, borderRadius: 20 }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '65%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '55%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '70%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 14, width: '50%' }} /></td>
                  <td><div className="db-skeleton-line" style={{ height: 28, width: 80, borderRadius: 6 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile card skeletons */}
        <div className="deals-cards">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="deal-card">
              <div className="db-skeleton-line" style={{ height: 18, width: '60%', marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[...Array(6)].map((_, j) => (
                  <div key={j}>
                    <div className="db-skeleton-line" style={{ height: 10, width: '40%', marginBottom: 4 }} />
                    <div className="db-skeleton-line" style={{ height: 14, width: '80%' }} />
                  </div>
                ))}
              </div>
              <div className="db-skeleton-line" style={{ height: 32, width: '100%', borderRadius: 6 }} />
            </div>
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

  return (
    <div className="dashboard-page">
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Search Bar ────────────────────────── */}
      <div className="dashboard-search">
        <div className="search-field">
          <svg className="search-field-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-field-input"
            placeholder="Search by village name or survey number…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchTerm && (
            <button
              className="search-field-clear"
              onClick={() => { setSearchTerm(''); fetchDeals(); }}
              title="Clear"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <button onClick={handleSearch} className="search-submit-btn" title="Search" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        {/* Sort Button */}
        <div className="sort-dropdown-wrap">
          <button
            className={`sort-btn${sortOpen ? ' sort-btn--active' : ''}`}
            onClick={() => setSortOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            type="button"
            title={sortOptions.find(o => o.value === sortOption)?.label || 'Sort'}
            aria-label="Sort"
          >
            {/* Professional sort icon: 3 lines decreasing in width */}
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
            {sortOpen ? (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
          {sortOpen && (
            <ul className="sort-dropdown" tabIndex={-1} role="listbox">
              {sortOptions.map(opt => (
                <li
                  key={opt.value}
                  className={`sort-dropdown-option${sortOption === opt.value ? ' sort-dropdown-option--active' : ''}`}
                  onClick={() => { setSortOption(opt.value); setSortOpen(false); }}
                  role="option"
                  aria-selected={sortOption === opt.value}
                >
                  {opt.label}
                  {/* Arrow indicator for applicable sorts */}
                  {['unitPriceAsc', 'unitPriceDesc', 'totalAmountAsc', 'totalAmountDesc', 'deadline'].includes(opt.value) && sortOption === opt.value && (
                    <span className="sort-arrow">{opt.value.endsWith('Asc') ? '↑' : opt.value.endsWith('Desc') ? '↓' : '→'}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Deal Type Filter Pills */}
      <div className="deal-type-filter-bar">
        {['All', 'Buy', 'Sell', 'Other'].map(type => (
          <button
            key={type}
            className={`deal-type-pill${dealTypeFilter === type ? ' deal-type-pill--active' : ''} deal-type-pill--${type.toLowerCase()}`}
            onClick={() => setDealTypeFilter(type)}
            type="button"
          >
            {type === 'Buy' && <span className="deal-type-pill-dot deal-type-pill-dot--buy" />}
            {type === 'Sell' && <span className="deal-type-pill-dot deal-type-pill-dot--sell" />}
            {type === 'Other' && <span className="deal-type-pill-dot deal-type-pill-dot--other" />}
            {type === 'All' ? 'All Deals' : `${type} Deals`}
          </button>
        ))}
      </div>
      {isAdmin && (
        <div className="toolbar-row">
          <div className="dashboard-deals-count-badge">
            {(() => {
              const total = deals.length;
              const filtered = sortedDeals.length;
              if (!searchTerm && dealTypeFilter === 'All') return <span>{total} Total Deals</span>;
              if (filtered === total) return <span>{total} Total Deals</span>;
              return <span>Showing {filtered} of {total}</span>;
            })()}
          </div>
          <Link to="/add-deal" className="btn-add-deal">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Deal
          </Link>
        </div>
      )}

      {sortedDeals.length === 0 ? (
        <p className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No deals found</p>
      ) : (
        <>
          {/* ── Desktop / Tablet Table ─────────── */}
          <div className="deals-table-wrap">
            <table className="deals-table">
              <thead>
                <tr>
                  <th>Village Name</th>
                  <th>Survey No.</th>
                  <th>Deal Type</th>
                  <th>Unit Price</th>
                  <th>Total Area</th>
                  <th>Sq. Meter</th>
                  <th>Jantri</th>
                  <th>Total Amount</th>
                  <th>Payment Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDeals.map((deal) => (
                  <tr key={deal._id}>
                    {editingId === deal._id ? (
                      <>
                        <td><input type="text" name="villageName" value={editFormData.villageName} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                        <td><input type="text" name="surveyNumber" value={editFormData.surveyNumber} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                        <td>
                          <select name="dealType" value={editFormData.dealType} onChange={handleEditFormChange} className="form-input edit-input">
                            <option value="Buy">Buy</option>
                            <option value="Sell">Sell</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td><input type="number" name="pricePerSqYard" value={editFormData.pricePerSqYard} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                        <td><input type="number" name="totalSqYard" value={editFormData.totalSqYard} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                        <td><input type="number" name="totalSqMeter" value={editFormData.totalSqMeter} onChange={handleEditFormChange} className="form-input edit-input" placeholder="0" min="0" step="0.01" /></td>
                        <td><input type="number" name="jantri" value={editFormData.jantri} onChange={handleEditFormChange} className="form-input edit-input" placeholder="0" min="0" step="0.01" /></td>
                        <td><input type="number" name="totalAmount" value={editFormData.totalAmount} readOnly className="form-input edit-input edit-input--readonly" /></td>
                        <td><input type="date" name="paymentDeadlineMonth" value={editFormData.paymentDeadlineMonth ? new Date(editFormData.paymentDeadlineMonth).toISOString().split('T')[0] : ''} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                        <td>
                          <div className="action-group">
                            <button onClick={() => handleSaveEdit(deal._id)} className="action-btn action-btn--save">Save</button>
                            <button onClick={handleCancelEdit} className="action-btn action-btn--cancel">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="td-name">{deal.villageName}</td>
                        <td className="td-num">{deal.surveyNumber}</td>
                        <td>
                          <span className={`deal-type-badge deal-type-badge--${(deal.dealType || 'Buy').toLowerCase()}`}>
                            {deal.dealType || 'Buy'}
                          </span>
                        </td>
                        <td className="td-num">{deal.pricePerSqYard ? formatCurrency(deal.pricePerSqYard) : 'N/A'}</td>
                        <td className="td-num">{deal.totalSqYard.toLocaleString('en-IN')}</td>
                        <td className="td-num">{deal.totalSqMeter ? deal.totalSqMeter.toLocaleString('en-IN') : 0}</td>
                        <td className="td-num">{deal.jantri ? formatCurrency(deal.jantri) : 0}</td>
                        <td className="td-num td-amount">{formatCurrency(deal.totalAmount)}</td>
                        <td className="td-num">{deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : formatDate(deal.paymentDeadlineMonth)}</td>
                        <td>
                          <div className="action-group">
                            <Link to={`/deals/${deal._id}`} className="action-btn action-btn--view">View</Link>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleEdit(deal)} className="action-btn action-btn--edit" title="Edit"><EditIconSvg /></button>
                                <button onClick={() => setConfirmDeleteId(deal._id)} className="action-btn action-btn--delete" title="Delete"><DeleteIconSvg /></button>

                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card View ───────────────── */}
          <div className="deals-cards">
            {sortedDeals.map((deal) => (
              <div key={deal._id} className={`deal-card${editingId === deal._id ? ' deal-card--editing' : ''}`}>
                {editingId === deal._id ? (
                  /* ── Edit mode ── */
                  <>
                    <div className="deal-card-name" style={{ marginBottom: '1rem' }}>Editing: {deal.villageName}</div>
                    <div className="deal-card-edit-grid">
                      <div className="deal-card-field">
                        <span className="deal-card-label">Village Name</span>
                        <input type="text" name="villageName" value={editFormData.villageName} onChange={handleEditFormChange} className="form-input edit-input" />
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Survey No.</span>
                        <input type="text" name="surveyNumber" value={editFormData.surveyNumber} onChange={handleEditFormChange} className="form-input edit-input" />
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Unit Price (₹)</span>
                        <input type="number" name="pricePerSqYard" value={editFormData.pricePerSqYard} onChange={handleEditFormChange} className="form-input edit-input" />
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Total Area (sq.yd)</span>
                        <input type="number" name="totalSqYard" value={editFormData.totalSqYard} onChange={handleEditFormChange} className="form-input edit-input" />
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Total Amount (auto)</span>
                        <input type="number" name="totalAmount" value={editFormData.totalAmount} readOnly className="form-input edit-input edit-input--readonly" />
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Payment Deadline</span>
                        <input type="date" name="paymentDeadlineMonth" value={editFormData.paymentDeadlineMonth ? new Date(editFormData.paymentDeadlineMonth).toISOString().split('T')[0] : ''} onChange={handleEditFormChange} className="form-input edit-input" />
                      </div>
                    </div>
                    <div className="deal-card-actions" style={{ marginTop: '1rem' }}>
                      <button onClick={() => handleSaveEdit(deal._id)} className="action-btn action-btn--save" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
                      <button onClick={handleCancelEdit} className="action-btn action-btn--cancel">Cancel</button>
                    </div>
                  </>
                ) : (
                  /* ── Display mode ── */
                  <>
                    <div className="deal-card-name">{deal.villageName}</div>
                    <div className="deal-card-grid">
                      <div className="deal-card-field">
                        <span className="deal-card-label">Survey No.</span>
                        <span className="deal-card-value">{deal.surveyNumber}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Deal Type</span>
                        <span className="deal-card-value">
                          <span className={`deal-type-badge deal-type-badge--${(deal.dealType || 'Buy').toLowerCase()}`}>
                            {deal.dealType || 'Buy'}
                          </span>
                        </span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Unit Price</span>
                        <span className="deal-card-value">{deal.pricePerSqYard ? formatCurrency(deal.pricePerSqYard) : 'N/A'}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Total Area</span>
                        <span className="deal-card-value">{deal.totalSqYard.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Sq. Meter</span>
                        <span className="deal-card-value">{deal.totalSqMeter ? deal.totalSqMeter.toLocaleString('en-IN') : 0}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Jantri</span>
                        <span className="deal-card-value">{deal.jantri ? formatCurrency(deal.jantri) : 0}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Total Amount</span>
                        <span className="deal-card-value deal-card-amount">{formatCurrency(deal.totalAmount)}</span>
                      </div>
                      <div className="deal-card-field">
                        <span className="deal-card-label">Deadline</span>
                        <span className="deal-card-value">{deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : formatDate(deal.paymentDeadlineMonth)}</span>
                      </div>
                    </div>
                    <div className="deal-card-actions">
                      <Link to={`/deals/${deal._id}`} className="action-btn action-btn--view">View Details</Link>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(deal)} className="action-btn action-btn--edit" title="Edit"><EditIconSvg /></button>
                          <button onClick={() => setConfirmDeleteId(deal._id)} className="action-btn action-btn--delete" title="Delete"><DeleteIconSvg /></button>

                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {/* ── Delete Confirmation Modal ── */}
      {confirmDeleteId && (() => {
        const deal = deals.find(d => d._id === confirmDeleteId);
        return (
          <div className="logout-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="logout-modal-title">Delete Deal?</h3>
              <p className="logout-modal-desc">
                Are you sure you want to delete<br />
                <strong>{deal?.villageName}</strong> (Survey #{deal?.surveyNumber})?<br />
                <span style={{ color: '#e53e3e', fontSize: '0.82rem' }}>This action cannot be undone.</span>
              </p>
              <div className="logout-modal-actions">
                <button className="logout-modal-btn logout-modal-btn--cancel" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}>Cancel</button>
                <button className="logout-modal-btn logout-modal-btn--confirm" onClick={() => handleDelete(confirmDeleteId)} disabled={isDeleting}>
                  {isDeleting ? <><span className="modal-spinner" /> Deleting…</> : 'Yes, Delete'}
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