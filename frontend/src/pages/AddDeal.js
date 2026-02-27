import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const Field = ({ label, required, children, hint }) => (
  <div className="ad-field">
    <label className="ad-label">
      {label}
      {required && <span className="ad-required">*</span>}
    </label>
    {children}
    {hint && <span className="ad-hint">{hint}</span>}
  </div>
);

const AddDeal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    villageName: '',
    surveyNumber: '',
    pricePerSqYard: '',
    totalSqYard: '',
    deadlineStartDate: '',
    deadlineEndDate: '',
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
        deadlineEndDate: formData.deadlineEndDate,
      };

      console.log('Full payload:', JSON.stringify(payload, null, 2));
      console.log('Dates:', {
        start: formData.deadlineStartDate,
        end: formData.deadlineEndDate,
        startType: typeof formData.deadlineStartDate,
        endType: typeof formData.deadlineEndDate,
      });

      const { data } = await API.post('/api/deals', payload);
      navigate(`/deals/${data._id}`);
    } catch (err) {
      console.error('Error creating deal:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount =
    formData.pricePerSqYard && formData.totalSqYard
      ? parseFloat(formData.pricePerSqYard) * parseFloat(formData.totalSqYard)
      : 0;

  const banakhatAmount = totalAmount * 0.25;

  return (
    <div className="ad-page">
      <div className="ad-wrapper">

        {/* ── Page Header ── */}
        <div className="ad-page-header">
          <button className="ad-back-btn" onClick={() => navigate(-1)}>
            <span className="ad-back-arrow">←</span> Back
          </button>
          <div className="ad-page-title-block">
            <div className="ad-page-icon">🏡</div>
            <div>
              <h1 className="ad-page-title">Add New Deal</h1>
              <p className="ad-page-subtitle">Fill in the property details below to create a new deal</p>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="ad-error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ad-form" noValidate>

          {/* ── Section 1: Property Details ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              <span className="ad-section-icon">📍</span>
              <h2 className="ad-section-title">Property Details</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="Village Name" required>
                <input
                  type="text"
                  className="ad-input"
                  name="villageName"
                  placeholder="e.g. Navagam, Dholera"
                  value={formData.villageName}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="Survey Number" required>
                <input
                  type="text"
                  className="ad-input"
                  name="surveyNumber"
                  placeholder="e.g. 123/4"
                  value={formData.surveyNumber}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>
          </div>

          {/* ── Section 2: Pricing ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              <span className="ad-section-icon">💰</span>
              <h2 className="ad-section-title">Pricing & Area</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="Unit Price (₹ per Sq. Yard)" required hint="Enter amount in Indian Rupees">
                <div className="ad-input-prefix-wrap">
                  <span className="ad-input-prefix">₹</span>
                  <input
                    type="number"
                    className="ad-input ad-input--prefixed"
                    name="pricePerSqYard"
                    placeholder="0.00"
                    value={formData.pricePerSqYard}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </Field>
              <Field label="Total Area (Sq. Yards)" required hint="Enter total land area">
                <div className="ad-input-suffix-wrap">
                  <input
                    type="number"
                    className="ad-input ad-input--suffixed"
                    name="totalSqYard"
                    placeholder="0.00"
                    value={formData.totalSqYard}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                  <span className="ad-input-suffix">sq.yd</span>
                </div>
              </Field>
            </div>

            {/* Live Calculation Cards */}
            {totalAmount > 0 && (
              <div className="ad-calc-strip">
                <div className="ad-calc-card ad-calc-card--total">
                  <span className="ad-calc-label">Total Deal Amount</span>
                  <span className="ad-calc-value">{formatINR(totalAmount)}</span>
                </div>
                <div className="ad-calc-divider">×25%</div>
                <div className="ad-calc-card ad-calc-card--banakhat">
                  <span className="ad-calc-label">Banakhat Amount (25%)</span>
                  <span className="ad-calc-value">{formatINR(banakhatAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 3: Deadline ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              <span className="ad-section-icon">📅</span>
              <h2 className="ad-section-title">Deal Deadline</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="Start Date">
                <input
                  type="date"
                  className="ad-input"
                  name="deadlineStartDate"
                  value={formData.deadlineStartDate}
                  onChange={handleChange}
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  className="ad-input"
                  name="deadlineEndDate"
                  value={formData.deadlineEndDate}
                  onChange={handleChange}
                />
              </Field>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="ad-actions">
            <button
              type="button"
              className="ad-btn ad-btn--cancel"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ad-btn ad-btn--submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="ad-spinner" /> Creating Deal…</>
              ) : (
                <>✅ Create Deal</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddDeal;
