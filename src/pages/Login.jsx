import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (data.id) localStorage.setItem('userId', data.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <header>
        <div className="container">
          <h1>Doctor Staff System</h1>
          <nav>
            <Link to="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="container auth-container">
        <form onSubmit={handleSubmit}>
          <h2>System Login</h2>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </main>
    </div>
  );
}

export default Login;
