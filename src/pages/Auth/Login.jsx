import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Auth.css';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.671 32.659 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.958 3.042l5.657-5.657C34.019 6.053 29.258 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 12 24 12c3.059 0 5.842 1.154 7.958 3.042l5.657-5.657C34.019 6.053 29.258 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.156 0 9.83-1.977 13.364-5.197l-6.173-5.226C29.137 35.091 26.705 36 24 36c-5.202 0-9.637-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a11.95 11.95 0 0 1-4.112 5.577l.003-.002 6.173 5.226C36.93 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await API.googleAuth(tokenResponse.access_token);
        if (data.requiresOtp) {
          toast.info('Google sign-in verified. Please complete OTP + role.');
          navigate('/google-otp-verify', { state: { email: data.email } });
          return;
        }

        // If backend returns a fully logged-in user object/token, store it.
        login(data.user || data);
        toast.success('Welcome back!');
        const role = (data.user || data).role;
        navigate(role === 'Admin' ? '/admin' : role === 'Chef' ? '/dashboard' : '/');
      } catch (error) {
        toast.error(error.message || 'Google Sign-In failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google Sign-In failed'),
  });

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
      if (data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
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
          <Icon name="chef-hat" size={48} filter="var(--primary-filter)" />
          <h2>Welcome Back</h2>
          <p>Log in to manage your recipes and profile.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group mb-6">
            <label>Email Address</label>
            <div className="input-group">
              <Icon name="mail" size={20} className="input-icon" />
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group mb-4">
            <label>Password</label>
            <div className="input-group">
              <Icon name="lock" size={20} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-between mb-6 text-sm">
            <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Forgot password?</Link>
          </div>

          <button type="submit" className="btn-primary w-100 auth-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="divider mt-6 mb-6">OR</div>

        <button
          type="button"
          className="google-auth-btn w-100"
          onClick={() => googleLogin()}
          disabled={loading}
        >
          <GoogleIcon size={24} />
          Continue with Google
        </button>

        <p className="auth-footer mt-6">
          Don't have an account? <Link to="/register" className="btn-link">Join Us</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
