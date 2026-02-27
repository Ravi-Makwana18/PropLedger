import React, { useState } from 'react';
import API from '../api/axios';

const initialState = {
  name: '',
  phone: '',
  enquiryType: 'Land Buying',
  message: '',
};

const EnquirySection = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    // Message is NOT required
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/api/enquiry', form);
      if (data.success) {
        setSuccess('Thank you for your enquiry! We will contact you soon.');
        setForm(initialState);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="enquiry-section" style={{
      background: 'linear-gradient(to right, #f4f7fb, #ffffff)',
      padding: '4.5rem 0 3rem 0',
      position: 'relative',
      minHeight: '520px',
    }}>
      {/* Subtle abstract shape behind left content */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle at 30% 30%, #e3eaff 0%, transparent 70%)',
        opacity: 0.18,
        zIndex: 0,
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div className="enquiry-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="enquiry-left" style={{ padding: '2.5rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
          <h2 className="enquiry-heading" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '1.2rem', letterSpacing: '-1px' }}>Have Questions? Let's Help You.</h2>
          <p className="enquiry-trust" style={{ fontSize: '1.15rem', color: '#2563eb', fontWeight: 500, marginBottom: '1.2rem', maxWidth: 420 }}>Your trusted partner for land, plot, and property solutions in Dholera SIR.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.08rem', color: '#374151', fontWeight: 600 }}>
              <span style={{ color: '#2ecc71', fontSize: '1.3rem', marginRight: '0.7rem' }}>✅</span>Verified Land Deals
            </li>
            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.08rem', color: '#374151', fontWeight: 600 }}>
              <span style={{ color: '#2563eb', fontSize: '1.3rem', marginRight: '0.7rem' }}>✅</span>Legal N.A. File Assistance
            </li>
            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.08rem', color: '#374151', fontWeight: 600 }}>
              <span style={{ color: '#f59e42', fontSize: '1.3rem', marginRight: '0.7rem' }}>✅</span>Expert Investment Guidance
            </li>
          </ul>
        </div>
        <div className="enquiry-right" style={{
          background: '#fff',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
          padding: '2.5rem 2rem',
          minWidth: 320,
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          <form className="enquiry-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="form-group">
              <label htmlFor="name" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
                style={{
                  border: '1.5px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '1.08rem',
                  outline: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: 'none',
                  marginBottom: '1.2rem',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2563eb33'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="form-input"
                style={{
                  border: '1.5px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '1.08rem',
                  outline: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: 'none',
                  marginBottom: '1.2rem',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2563eb33'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="enquiryType" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Enquiry Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                id="enquiryType"
                name="enquiryType"
                value={form.enquiryType}
                onChange={handleChange}
                className="form-input"
                style={{
                  border: '1.5px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '1.08rem',
                  outline: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: 'none',
                  marginBottom: '1.2rem',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2563eb33'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              >
                <option>Land Buying</option>
                <option>Land Selling</option>
                <option>N.A. File</option>
                <option>Plot Enquiries</option>
                <option>General Question</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                className="form-input"
                rows={4}
                maxLength={50}
                style={{
                  border: '1.5px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '1.08rem',
                  outline: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: 'none',
                  marginBottom: '1.2rem',
                  resize: 'vertical',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #2563eb33'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            {error && <div className="form-error" style={{ color: '#ef4444', fontSize: '1rem', marginBottom: '0.5rem' }}>{error}</div>}
            {success && <div className="form-success" style={{ color: '#10b981', fontSize: '1rem', marginBottom: '0.5rem' }}>{success}</div>}
            <button type="submit" className="enquiry-submit-btn" disabled={loading} style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.15rem',
              padding: '1rem 0',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 6px 18px -4px rgba(37,99,235,0.18)',
              cursor: 'pointer',
              transition: 'background 0.3s, transform 0.2s',
              marginTop: '0.5rem',
              pointerEvents: 'auto',
              transform: loading ? 'none' : 'translateY(0)',
            }}
              onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EnquirySection;
