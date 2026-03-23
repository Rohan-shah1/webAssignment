import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChefHat, Mail, Lock, User, UtensilsCrossed } from 'lucide-react';
import './Auth.css';

import API from '../../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Chef'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      await API.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      toast.success('Registration successful! You may now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-header">
          <ChefHat size={48} color="var(--primary-color)" />
          <h2>Join RecipeNest</h2>
          <p>Create an account to share your culinary masterpieces.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group row-align">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

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

          <div className="form-group row-align">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>

          {/* Role Toggle */}
          <div className="role-toggle-group">
            <p className="role-label">I am a...</p>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${formData.role === 'Chef' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'Chef'})}
              >
                <ChefHat size={18} />
                Chef
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'Food Lover' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'Food Lover'})}
              >
                <UtensilsCrossed size={18} />
                Food Lover
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-100 auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
