import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChefHat, Mail, Lock } from 'lucide-react';
import './Auth.css';
import { useAuth } from '../../context/AuthContext';

import API from '../../api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const data = await API.login(formData.email, formData.password);
      login(data);
      toast.success('Login successful! Welcome back.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-header">
          <ChefHat size={48} color="var(--primary-color)" />
          <h2>Welcome Back</h2>
          <p>Log in to manage your recipes and profile.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group row-align">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="form-group row-align">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-primary w-100 auth-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Join Us</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
