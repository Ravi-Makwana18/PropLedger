import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import bgLogo from '../assets/logo.png';

const Dashboard = () => {
  const { isAdmin } = useAuth();
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

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await API.get('/deals');
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
      const { data } = await API.get(`/deals/search?q=${searchTerm}`);
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
      await API.delete(`/deals/${dealId}`);
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
      const { data } = await API.put(`/deals/${dealId}`, editFormData);
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
      <div style={pageBg}>
        <div className="container">
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', paddingTop: '4rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: '1rem 1.5rem', borderRadius: '0.75rem' }}>
              Loading your deals…<br />
              <small style={{ fontSize: '0.8rem' }}>First load may take 30–60 seconds as server wakes up</small>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBg}>
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
          </div>
          {isAdmin && (
            <div style={{ margin: '1.5rem 0 1.5rem 0', display: 'flex', justifyContent: 'center' }}>
              <Link to="/add-deal" className="btn btn-secondary">+ Add New Deal</Link>
            </div>
          )}

          {deals.length === 0 ? (
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
                    {deals.map((deal) => (
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
                {deals.map((deal) => (
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
