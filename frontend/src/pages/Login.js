import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(mobileNumber, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left Panel (branding) – hidden on mobile ── */}
      <div className="login-left-panel">
        <div className="login-left-content">
          <Link to="/" className="login-back-home">
            ← Back to Home
          </Link>
          <div className="login-brand-block">
            <img src={logo} alt="Destination Dholera" className="login-brand-logo" />
            <h1 className="login-brand-name">Destination Dholera</h1>
            <p className="login-brand-tagline">
              A private portal made just for our team to manage company work easily and securely.
            </p>
          </div>
          <div className="login-left-features">
            <div className="login-feature-item">
              <span className="login-feature-icon">🔒</span>
              <span>Secure Admin Access</span>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon">📊</span>
              <span>Manage Deals & Enquiries</span>
            </div>
          </div>
        </div>
        {/* decorative gradient orbs */}
        <div className="login-orb login-orb--1" />
        <div className="login-orb login-orb--2" />
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="login-right-panel">
        {/* Mobile-only logo */}
        <div className="login-mobile-brand">
          <img src={logo} alt="Destination Dholera" className="login-mobile-logo" />
          <span className="login-mobile-brand-name">Destination Dholera</span>
        </div>

        <div className="login-form-card">
          {/* Header */}
          <div className="login-form-header">
            <div className="login-shield-icon">🛡️</div>
            <h2 className="login-form-title">Admin Portal</h2>
            <p className="login-form-subtitle">Sign in to manage your dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error-banner">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="mobileNumber">
                Mobile Number
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">📱</span>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  className="login-input"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔑</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>Sign in to Dashboard →</>
              )}
            </button>
          </form>

          <p className="login-restricted-note">
            🔐 Restricted to authorized administrators only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
