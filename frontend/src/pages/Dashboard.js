import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import bgLogo from '../assets/logo.png';
import NotificationBell from '../components/NotificationBell';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    villageName: '',
    surveyNumber: '',
    pricePerSqYard: '',
    totalSqYard: '',
    totalAmount: '',
    paymentDeadlineMonth: ''
  });
  // Sorting state
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

  useEffect(() => {
    fetchDeals();
  }, []);

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

  const handleDelete = async (dealId, villageName) => {
    if (!window.confirm(`Are you sure you want to delete the deal for ${villageName}? This action cannot be undone.`)) return;
    try {
      await API.delete(`/api/deals/${dealId}`);
      setDeals(deals.filter(deal => deal._id !== dealId));
      alert('Deal deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete deal');
    }
  };

  const handleEdit = (deal) => {
    setEditingId(deal._id);
    setEditFormData({
      villageName: deal.villageName,
      surveyNumber: deal.surveyNumber,
      pricePerSqYard: deal.pricePerSqYard,
      totalSqYard: deal.totalSqYard,
      totalAmount: deal.totalAmount,
      paymentDeadlineMonth: deal.deadlineEndDate || deal.paymentDeadlineMonth
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ villageName: '', surveyNumber: '', pricePerSqYard: '', totalSqYard: '', totalAmount: '', paymentDeadlineMonth: '' });
  };

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
      setEditFormData({ villageName: '', surveyNumber: '', pricePerSqYard: '', totalSqYard: '', totalAmount: '', paymentDeadlineMonth: '' });
      alert('Deal updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update deal');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

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

  const pageBg = {
    minHeight: 'calc(100vh - 60px)',
    backgroundImage: `url(${bgLogo})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#f0f9ff',
    backgroundBlendMode: 'lighten',
    padding: '1.5rem 0.75rem'
  };

  if (loading) {
    return (
      <div style={{ ...pageBg, position: 'relative' }}>
        {/* Notification Bell top-right corner */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}>
          <NotificationBell user={user} />
        </div>
        <div className="container">
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', paddingTop: '4rem' }}>
            <div className="spinner"></div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#2563eb' }}>Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort deals for rendering
  const getFilteredDeals = () => {
    if (!searchTerm.trim()) return deals;
    return deals.filter(deal =>
      deal.villageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.surveyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
    <div style={{ ...pageBg, position: 'relative' }}>
      {/* Notification Bell top-right corner */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}>
        <NotificationBell user={user} />
      </div>
      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="dashboard-card">
          {/* ── Header ─────────────────────────────── */}

          <div className="dashboard-header">
            <h2 className="dashboard-title">Dashboard</h2>
          </div>

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
            <button onClick={handleSearch} className="search-submit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search</span>
            </button>
            {/* Sort Button */}
            <div className="sort-dropdown-wrap">
              <button
                className={`sort-btn${sortOpen ? ' sort-btn--active' : ''}`}
                onClick={() => setSortOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                type="button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                  <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
                <span style={{ fontWeight: 500, fontSize: '0.97em' }}>{sortOptions.find(o => o.value === sortOption)?.label || 'Sort'}</span>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginLeft: 4, transition: 'transform 0.2s', transform: sortOpen ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
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
                      {['unitPriceAsc','unitPriceDesc','totalAmountAsc','totalAmountDesc','deadline'].includes(opt.value) && sortOption === opt.value && (
                        <span className="sort-arrow">{opt.value.endsWith('Asc') ? '↑' : opt.value.endsWith('Desc') ? '↓' : '→'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="dashboard-deals-header-row">
              <div className="dashboard-deals-count-badge">
                {(() => {
                  const total = deals.length;
                  const filtered = sortedDeals.length;
                  if (!searchTerm) return <span>{total} Total Deals</span>;
                  if (filtered === total) return <span>{total} Total Deals</span>;
                  return <span>Showing {filtered} of {total} deals</span>;
                })()}
              </div>
              <Link to="/add-deal" className="btn btn-secondary">+ Add New Deal</Link>
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
                      <th>Unit Price</th>
                      <th>Total Area</th>
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
                            <td><input type="number" name="pricePerSqYard" value={editFormData.pricePerSqYard} onChange={handleEditFormChange} className="form-input edit-input" /></td>
                            <td><input type="number" name="totalSqYard" value={editFormData.totalSqYard} onChange={handleEditFormChange} className="form-input edit-input" /></td>
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
                            <td className="td-num">{deal.pricePerSqYard ? formatCurrency(deal.pricePerSqYard) : 'N/A'}</td>
                            <td className="td-num">{deal.totalSqYard.toLocaleString('en-IN')}</td>
                            <td className="td-num td-amount">{formatCurrency(deal.totalAmount)}</td>
                            <td className="td-num">{deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : formatDate(deal.paymentDeadlineMonth)}</td>
                            <td>
                              <div className="action-group">
                                <Link to={`/deals/${deal._id}`} className="action-btn action-btn--view">View</Link>
                                {isAdmin && (
                                  <>
                                    <button onClick={() => handleEdit(deal)} className="action-btn action-btn--edit" title="Edit"><EditIconSvg /></button>
                                    <button onClick={() => handleDelete(deal._id, deal.villageName)} className="action-btn action-btn--delete" title="Delete"><DeleteIconSvg /></button>
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
                            <span className="deal-card-label">Unit Price</span>
                            <span className="deal-card-value">{deal.pricePerSqYard ? formatCurrency(deal.pricePerSqYard) : 'N/A'}</span>
                          </div>
                          <div className="deal-card-field">
                            <span className="deal-card-label">Total Area</span>
                            <span className="deal-card-value">{deal.totalSqYard.toLocaleString('en-IN')}</span>
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
                              <button onClick={() => handleDelete(deal._id, deal.villageName)} className="action-btn action-btn--delete" title="Delete"><DeleteIconSvg /></button>
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
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
