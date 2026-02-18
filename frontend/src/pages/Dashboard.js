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
    if (!searchTerm.trim()) {
      fetchDeals();
      return;
    }

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
    if (!window.confirm(`Are you sure you want to delete the deal for ${villageName}? This action cannot be undone.`)) {
      return;
    }

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
      totalSqYard: deal.totalSqYard,
      totalAmount: deal.totalAmount,
      paymentDeadlineMonth: deal.deadlineEndDate || deal.paymentDeadlineMonth
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      villageName: '',
      surveyNumber: '',
      totalSqYard: '',
      totalAmount: '',
      paymentDeadlineMonth: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (dealId) => {
    try {
      const { data } = await API.put(`/deals/${dealId}`, editFormData);
      setDeals(deals.map(deal => deal._id === dealId ? data : deal));
      setEditingId(null);
      setEditFormData({
        villageName: '',
        surveyNumber: '',
        totalSqYard: '',
        totalAmount: '',
        paymentDeadlineMonth: ''
      });
      alert('Deal updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update deal');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        backgroundImage: `url(${bgLogo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f0f9ff',
        backgroundBlendMode: 'lighten',
        padding: '3rem 1rem'
      }}>
        <div className="container">
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '1rem', borderRadius: '0.5rem' }}>
              Loading your deals...
              <br />
              <small style={{ fontSize: '0.875rem' }}>First load may take 30-60 seconds as server wakes up</small>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      backgroundImage: `url(${bgLogo})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#f0f9ff',
      backgroundBlendMode: 'lighten',
      padding: '2rem 1rem'
    }}>
      <div className="container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex-between mb-3">
          <h2 className="card-header" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            All Deals
          </h2>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="form-input"
            placeholder="Search by village name or survey number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <button onClick={handleSearch} className="btn btn-primary">
            Search
          </button>
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); fetchDeals(); }} className="btn btn-outline">
              Clear
            </button>
          )}
        </div>

        {deals.length === 0 ? (
          <p className="text-center">No deals found</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Village Name</th>
                  <th>Survey No.</th>
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
                        <td>
                          <input
                            type="text"
                            name="villageName"
                            value={editFormData.villageName}
                            onChange={handleEditFormChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="surveyNumber"
                            value={editFormData.surveyNumber}
                            onChange={handleEditFormChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="totalSqYard"
                            value={editFormData.totalSqYard}
                            onChange={handleEditFormChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="totalAmount"
                            value={editFormData.totalAmount}
                            onChange={handleEditFormChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            name="paymentDeadlineMonth"
                            value={editFormData.paymentDeadlineMonth ? new Date(editFormData.paymentDeadlineMonth).toISOString().split('T')[0] : ''}
                            onChange={handleEditFormChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleSaveEdit(deal._id)}
                              className="btn btn-sm"
                              style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                              }}
                              title="Save"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="btn btn-sm"
                              style={{
                                background: '#6b7280',
                                color: 'white',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                              }}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{deal.villageName}</td>
                        <td>{deal.surveyNumber}</td>
                        <td>{deal.totalSqYard.toLocaleString('en-IN')}</td>
                        <td>{formatCurrency(deal.totalAmount)}</td>
                        <td>{deal.deadlineEndDate ? formatDate(deal.deadlineEndDate) : formatDate(deal.paymentDeadlineMonth)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Link to={`/deals/${deal._id}`} className="btn btn-sm btn-primary">
                              View Details
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleEdit(deal)}
                                  className="btn btn-sm"
                                  style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Edit Deal"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(deal._id, deal.villageName)}
                                  className="btn btn-sm"
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    padding: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Delete Deal"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
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
        )}
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link to="/add-deal" className="btn btn-secondary">
            + Add New Deal
          </Link>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
