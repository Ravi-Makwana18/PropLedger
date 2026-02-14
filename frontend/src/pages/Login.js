import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(mobileNumber, password);
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
        <h2 className="card-header text-center">Login</h2>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

        <div className="text-center mt-3">
          <p>Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
