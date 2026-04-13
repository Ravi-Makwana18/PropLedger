import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countries, getStatesForCountry, getCitiesForState } from '../data/locationData';
import AppCard from '../components/ui/AppCard';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import AppSelect from '../components/ui/AppSelect';
import logo from '../assets/logo-compact.jpg';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPersonName: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');

    // Handle country change
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.name === value);
      if (selectedCountry) {
        const states = getStatesForCountry(selectedCountry.code);
        setAvailableStates(states);
        setAvailableCities([]);
        setFormData(prev => ({ ...prev, country: value, state: '', city: '' }));
      }
    }

    // Handle state change
    if (name === 'state') {
      const selectedCountry = countries.find(c => c.name === formData.country);
      if (selectedCountry) {
        const cities = getCitiesForState(selectedCountry.code, value);
        setAvailableCities(cities);
        setFormData(prev => ({ ...prev, state: value, city: '' }));
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.companyName.trim()) {
      setError('Please enter company name');
      return;
    }
    if (!formData.contactPersonName.trim()) {
      setError('Please enter contact person name');
      return;
    }
    if (!formData.country.trim()) {
      setError('Please enter country');
      return;
    }
    if (!formData.state.trim()) {
      setError('Please enter state');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please enter city');
      return;
    }
    if (!formData.pincode.trim()) {
      setError('Please enter pincode');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please enter phone number');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Branding Panel */}
      <div className="auth-left-panel">
        <div className="auth-left-content">
          <div className="auth-brand-section">
            <img src={logo} alt="PropLedger" className="auth-brand-logo" />
            <h1 className="auth-brand-title">PropLedger</h1>
            <p className="auth-brand-tagline">Professional Land Deal Management</p>
          </div>
          
          <div className="auth-features-list">
            <div className="auth-feature">
              <div className="auth-feature-icon">🚀</div>
              <div className="auth-feature-content">
                <h3>Quick Setup</h3>
                <p>Get started in minutes with our simple onboarding</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">💼</div>
              <div className="auth-feature-content">
                <h3>Business Tools</h3>
                <p>Everything you need to manage land deals professionally</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🎯</div>
              <div className="auth-feature-content">
                <h3>Stay Organized</h3>
                <p>Track deals, documents, and history in one place</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-decorative-elements">
          <div className="auth-circle auth-circle-1"></div>
          <div className="auth-circle auth-circle-2"></div>
          <div className="auth-circle auth-circle-3"></div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right-panel auth-right-panel--register">
        <div className="auth-mobile-header">
          <img src={logo} alt="PropLedger" className="auth-mobile-logo" />
          <span className="auth-mobile-brand">PropLedger</span>
        </div>

        <AppCard className="auth-form-container auth-form-container--wide">
          <div className="auth-form-header">
            <div className="auth-welcome-badge">Get Started</div>
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">Set up your organization account to start managing land deals</p>
          </div>

          {error && (
            <div className="auth-error-alert pl-alert pl-alert--error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form" noValidate>
            {/* Company Information */}
            <div className="auth-section">
              <div className="auth-section-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                <h3>Company Information</h3>
              </div>
              
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="companyName">
                    Company Name <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    <AppInput
                      id="companyName"
                      name="companyName"
                      type="text"
                      className="auth-input"
                      placeholder="Your company name"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="contactPersonName">
                    Contact Person <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <AppInput
                      id="contactPersonName"
                      name="contactPersonName"
                      type="text"
                      className="auth-input"
                      placeholder="Full name"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="auth-section">
              <div className="auth-section-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3>Location Details</h3>
              </div>
              
              <div className="auth-form-row auth-form-row--2">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="country">
                    Country <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                    <AppSelect
                      id="country"
                      name="country"
                      className="auth-input"
                      value={formData.country}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </AppSelect>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="state">
                    State <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <AppSelect
                      id="state"
                      name="state"
                      className="auth-input"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      disabled={!formData.country}
                    >
                      <option value="">Select State</option>
                      {availableStates.map(state => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </AppSelect>
                  </div>
                </div>
              </div>

              <div className="auth-form-row auth-form-row--2">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="city">
                    City <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    {availableCities.length > 0 ? (
                      <AppSelect
                        id="city"
                        name="city"
                        className="auth-input"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select City</option>
                        {availableCities.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </AppSelect>
                    ) : (
                      <AppInput
                        id="city"
                        name="city"
                        type="text"
                        className="auth-input"
                        placeholder="Enter city name"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={!formData.state}
                      />
                    )}
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="pincode">
                    Pincode <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <AppInput
                      id="pincode"
                      name="pincode"
                      type="text"
                      className="auth-input"
                      placeholder="Postal code"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="auth-section">
              <div className="auth-section-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <h3>Contact Information</h3>
              </div>
              
              <div className="auth-form-row auth-form-row--2">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="email">
                    Email Address <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <AppInput
                      id="email"
                      name="email"
                      type="email"
                      className="auth-input"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="phone">
                    Phone Number <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <AppInput
                      id="phone"
                      name="phone"
                      type="tel"
                      className="auth-input"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="auth-section">
              <div className="auth-section-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3>Security</h3>
              </div>
              
              <div className="auth-form-row auth-form-row--2">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="password">
                    Password (min 8 characters) <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <AppInput
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="confirmPassword">
                    Confirm Password <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <AppInput
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <AppButton
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </AppButton>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-secondary-btn app-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Sign in to existing account</span>
          </Link>
        </AppCard>
      </div>
    </div>
  );
};

export default Register;
