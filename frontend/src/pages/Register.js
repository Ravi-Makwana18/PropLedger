import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register, login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData.mobileNumber, formData.password, formData.name);
      // Auto-login after registration
      await login(formData.mobileNumber, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '3rem' }}>
      <div className="card">
        <h2 className="card-header text-center">Register</h2>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              name="mobileNumber"
              placeholder="Enter 10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              name="password"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-3">
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
