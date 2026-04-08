import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AppCard from '../components/ui/AppCard';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import './CreateUser.css';

const CreateUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await API.post('/api/auth/managed-users', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      setSuccess('User created successfully!');
      setFormData({ name: '', phone: '', email: '', password: '' });
      
      setTimeout(() => {
        navigate('/manage-users');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="cu-page">
        <div className="cu-hero">
          <div className="cu-hero-inner">
            <div className="cu-hero-top">
              <div className="cu-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div className="cu-hero-title-group">
                <h1 className="cu-hero-title">Create Staff User</h1>
                <p className="cu-hero-subtitle">Add a new staff member to manage deals</p>
              </div>
            </div>
          </div>
        </div>
        <AppCard className="cu-content">
          <div className="cu-error pl-state pl-state--error">You don't have permission to access this page.</div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="cu-page">
      {/* Hero Header */}
      <div className="cu-hero">
        <div className="cu-hero-inner">
          <div className="cu-hero-top">
            {/* <div className="cu-hero-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div> */}
            <div className="cu-hero-title-group">
              <h1 className="cu-hero-title">Create Staff User</h1>
              <p className="cu-hero-subtitle">Add a new staff member to manage deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AppCard className="cu-content">
        <p className="cu-description">
          Create a staff user with deal access. This staff user can create, update and manage deals, but cannot create another user.
        </p>

        {error && (
          <div className="cu-alert cu-alert--error pl-alert pl-alert--error">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="cu-alert cu-alert--success pl-alert pl-alert--success">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form className="cu-form" onSubmit={handleSubmit}>
          <div className="cu-field">
            <label className="cu-label" htmlFor="name">Full Name</label>
            <AppInput
              id="name"
              type="text"
              name="name"
              className="cu-input"
              placeholder="Enter staff name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="cu-field">
            <label className="cu-label" htmlFor="phone">Phone Number</label>
            <AppInput
              id="phone"
              type="tel"
              name="phone"
              className="cu-input"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="cu-field">
            <label className="cu-label" htmlFor="email">Email Address</label>
            <AppInput
              id="email"
              type="email"
              name="email"
              className="cu-input"
              placeholder="staff@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="cu-field">
            <label className="cu-label" htmlFor="password">Password</label>
            <div className="cu-password-wrap">
              <AppInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="cu-input"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="cu-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <AppButton
            type="submit"
            className="cu-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="cu-spinner"></span>
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </AppButton>
        </form>
      </AppCard>
    </div>
  );
};

export default CreateUser;