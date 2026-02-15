import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="flex-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="flex-between mb-3">
        <h1 style={{ marginBottom: 0 }}>Dashboard</h1>
        {isAdmin && (
          <Link to="/add-deal" className="btn btn-secondary">
            + Add New Deal
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
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
                  <th>Total Sq. Yard</th>
                  <th>Total Amount</th>
                  <th>Payment Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal._id}>
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
