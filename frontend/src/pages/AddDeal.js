import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './AddDeal.css';

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
    notes: '',
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
        district: formData.district,
        subDistrict: formData.subDistrict,
        villageName: formData.villageName,
        ...(formData.oldSurveyNo !== '' && { oldSurveyNo: formData.oldSurveyNo }),
        newSurveyNo: formData.newSurveyNo,
        dealType: formData.dealType,
        pricePerSqYard: parseFloat(formData.pricePerSqYard),
        totalSqYard: parseFloat(formData.totalSqYard),
        ...(formData.totalSqMeter !== '' && { totalSqMeter: parseFloat(formData.totalSqMeter) }),
        ...(formData.jantri !== '' && { jantri: parseFloat(formData.jantri) }),
        ...(formData.notes !== '' && { notes: formData.notes }),
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

  const amount25Percent = totalAmount * 0.25;
  const amount75Percent = totalAmount * 0.75;

  const whitePayment =
    formData.totalSqMeter && formData.jantri
      ? parseFloat(formData.totalSqMeter) * parseFloat(formData.jantri)
      : 0;

  // Apply 1% TDS if white payment exceeds 50,00,000
  const whitePaymentAfterTDS = whitePayment > 5000000 ? whitePayment - (whitePayment * 0.01) : whitePayment;
  const tdsAmount = whitePayment > 5000000 ? whitePayment * 0.01 : 0;

  return (
    <div className="ad-page">
      <div className="ad-wrapper">

        {/* ── Page Header ── */}
        <div className="ad-page-header">
          {/* <button className="ad-back-btn" onClick={() => navigate(-1)}>
            <span className="ad-back-arrow">←</span> Back
          </button> */}
          <div className="ad-page-title-block">
            {/* <div className="ad-page-icon">🏡</div> */}
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
              {/* <span className="ad-section-icon">📍</span> */}
              <h2 className="ad-section-title">Property Details</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="District" required>
                <input
                  type="text"
                  className="ad-input"
                  name="district"
                  placeholder="e.g. Bhavnagar"
                  value={formData.district}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="Sub-District" required>
                <input
                  type="text"
                  className="ad-input"
                  name="subDistrict"
                  placeholder="e.g. Bhavnagar"
                  value={formData.subDistrict}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>
            <div className="ad-grid-2">
            <Field label="Village" required>
              <input
                type="text"
                className="ad-input"
                name="villageName"
                placeholder="e.g. Bhangadh"
                value={formData.villageName}
                onChange={handleChange}
                required
              />
            </Field>
            </div>
            <div className="ad-grid-2">
              <Field label="Old Survey No.">
                <input
                  type="text"
                  className="ad-input"
                  name="oldSurveyNo"
                  placeholder="e.g. 201"
                  value={formData.oldSurveyNo}
                  onChange={handleChange}
                />
              </Field>
              <Field label="New Survey No." required>
                <input
                  type="text"
                  className="ad-input"
                  name="newSurveyNo"
                  placeholder="e.g. 151/A"
                  value={formData.newSurveyNo}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>
            {/* Deal Type row — full width below */}
            <div className="ad-deal-type-row">
              <Field label="Deal Type" required>
                <div className="ad-deal-type-select-wrap">
                  <select
                    className="ad-input ad-deal-type-select"
                    name="dealType"
                    value={formData.dealType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Buy">Purchase</option>
                    <option value="Sell">Sell</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className={`ad-deal-type-badge ad-deal-type-badge--${formData.dealType.toLowerCase()}`}>
                    {formData.dealType === 'Buy' ? 'Purchase Deal' : formData.dealType === 'Sell' ? 'Sell Deal' : 'Other Deal'}
                  </span>
                </div>
              </Field>
            </div>
          </div>

          {/* ── Section 2: Pricing ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              {/* <span className="ad-section-icon">💰</span> */}
              <h2 className="ad-section-title">Pricing & Area</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="Unit Price (₹ per sq. yard)" required hint="Enter amount in Indian Rupees">
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
              <Field label="Total Area (sq. yds)" required hint="Enter total land area">
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
              <Field label="Total Square Meter" hint="Enter total area in sq. meters">
                <div className="ad-input-suffix-wrap">
                  <input
                    type="number"
                    className="ad-input ad-input--suffixed"
                    name="totalSqMeter"
                    placeholder="0.00"
                    value={formData.totalSqMeter}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <span className="ad-input-suffix">sq.m</span>
                </div>
              </Field>
              <Field label="Jantri (₹ per sq.m)" hint="Government valuation rate">
                <div className="ad-input-prefix-wrap">
                  <span className="ad-input-prefix">₹</span>
                  <input
                    type="number"
                    className="ad-input ad-input--prefixed"
                    name="jantri"
                    placeholder="0.00"
                    value={formData.jantri}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </Field>
            </div>

            {/* Live Calculation Cards */}
            {(totalAmount > 0 || whitePayment > 0) && (
              <div className="ad-calc-strip">
                {totalAmount > 0 && (
                  <>
                    <div className="ad-calc-card ad-calc-card--total">
                      <span className="ad-calc-label">Total Deal Amount</span>
                      <span className="ad-calc-value">{formatINR(totalAmount)}</span>
                    </div>
                    <div className="ad-calc-divider">×25%</div>
                    <div className="ad-calc-card ad-calc-card--banakhat">
                      <span className="ad-calc-label">25% Amount</span>
                      <span className="ad-calc-value">{formatINR(amount25Percent)}</span>
                    </div>
                    <div className="ad-calc-divider">×75%</div>
                    <div className="ad-calc-card ad-calc-card--white">
                      <span className="ad-calc-label">75% Amount</span>
                      <span className="ad-calc-value">{formatINR(amount75Percent)}</span>
                    </div>
                  </>
                )}
                {whitePayment > 0 && (
                  <>
                    {totalAmount > 0 && <div className="ad-calc-divider" style={{ background: 'none', color: '#94a3b8' }}>|</div>}
                    <div className="ad-calc-card ad-calc-card--white">
                      <span className="ad-calc-label">White Payment{whitePayment > 5000000 ? ' (Before TDS)' : ''}</span>
                      <span className="ad-calc-value">{formatINR(whitePayment)}</span>
                    </div>
                    {whitePayment > 5000000 && (
                      <>
                        <div className="ad-calc-divider">-1%</div>
                        <div className="ad-calc-card ad-calc-card--banakhat">
                          <span className="ad-calc-label">TDS (1%)</span>
                          <span className="ad-calc-value">{formatINR(tdsAmount)}</span>
                        </div>
                        <div className="ad-calc-divider">=</div>
                        <div className="ad-calc-card ad-calc-card--total">
                          <span className="ad-calc-label">White Payment (After TDS)</span>
                          <span className="ad-calc-value">{formatINR(whitePaymentAfterTDS)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Section 3: Notes ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              {/* <span className="ad-section-icon">📝</span> */}
              <h2 className="ad-section-title">Notes</h2>
            </div>
            <Field label="Additional Notes" hint="Add any additional information or remarks">
              <textarea
                className="ad-input ad-textarea"
                name="notes"
                placeholder="e.g., Special conditions, important details, etc."
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </Field>
          </div>

          {/* ── Section 4: Deadline ── */}
          <div className="ad-section">
            <div className="ad-section-header">
              {/* <span className="ad-section-icon">📅</span> */}
              <h2 className="ad-section-title">Payment Deadlines</h2>
            </div>
            <div className="ad-grid-2">
              <Field label="25% Deadline">
                <input
                  type="date"
                  className="ad-input"
                  name="deadlineStartDate"
                  value={formData.deadlineStartDate}
                  onChange={handleChange}
                />
              </Field>
              <Field label="75% Deadline">
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
                <>Create Deal</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddDeal;
