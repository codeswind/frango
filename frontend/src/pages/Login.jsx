import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(credentials);
      if (response.success) {
        login(response.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Restaurant POS</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="demo-accounts">
          <h4>Demo Accounts:</h4>
          <p>Super Admin: superadmin / admin123</p>
          <p>Admin: admin / admin123</p>
          <p>Cashier: cashier / cashier123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;