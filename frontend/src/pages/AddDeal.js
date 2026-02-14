import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const AddDeal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    villageName: '',
    surveyNumber: '',
    pricePerSqYard: '',
    totalSqYard: '',
    deadlineStartDate: '',
    deadlineEndDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        villageName: formData.villageName,
        surveyNumber: formData.surveyNumber,
        pricePerSqYard: parseFloat(formData.pricePerSqYard),
        totalSqYard: parseFloat(formData.totalSqYard),
        deadlineStartDate: formData.deadlineStartDate,
        deadlineEndDate: formData.deadlineEndDate
      };

      console.log('Full payload:', JSON.stringify(payload, null, 2));
      console.log('Dates:', {
        start: formData.deadlineStartDate,
        end: formData.deadlineEndDate,
        startType: typeof formData.deadlineStartDate,
        endType: typeof formData.deadlineEndDate
      });

      const { data } = await API.post('/deals', payload);
      navigate(`/deals/${data._id}`);
    } catch (err) {
      console.error('Error creating deal:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.pricePerSqYard && formData.totalSqYard
    ? parseFloat(formData.pricePerSqYard) * parseFloat(formData.totalSqYard)
    : 0;

  const banakhatAmount = totalAmount * 0.25;

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        ← Back
      </button>

      <div className="card">
        <h2 className="card-header">Add New Deal</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Village Name *</label>
              <input
                type="text"
                className="form-input"
                name="villageName"
                placeholder="Enter village name"
                value={formData.villageName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Survey Number *</label>
              <input
                type="text"
                className="form-input"
                name="surveyNumber"
                placeholder="Enter survey number"
                value={formData.surveyNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price per Sq. Yard (₹) *</label>
              <input
                type="number"
                className="form-input"
                name="pricePerSqYard"
                placeholder="Enter price per sq. yard"
                value={formData.pricePerSqYard}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Sq. Yard *</label>
              <input
                type="number"
                className="form-input"
                name="totalSqYard"
                placeholder="Enter total sq. yard"
                value={formData.totalSqYard}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline Start Date *</label>
              <input
                type="date"
                className="form-input"
                name="deadlineStartDate"
                value={formData.deadlineStartDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline End Date *</label>
              <input
                type="date"
                className="form-input"
                name="deadlineEndDate"
                value={formData.deadlineEndDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {totalAmount > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmin(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="alert alert-info">
                <strong>Total Deal Amount:</strong> {' '}
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(totalAmount)}
              </div>
              <div className="alert alert-info">
                <strong>Banakhat Amount (25%):</strong> {' '}
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(banakhatAmount)}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Deal'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeal;
