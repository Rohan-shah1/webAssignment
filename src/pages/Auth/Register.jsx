import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import './Auth.css';
import API from '../../api';

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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await API.googleAuth(tokenResponse.access_token);
        if (data.requiresOtp) {
          toast.info('Google sign-in verified. Please check your email for the final OTP and select your role.');
          navigate('/google-otp-verify', { state: { email: data.email } });
        } else {
          // Fallback if they were already fully registered
          toast.success('Welcome back!');
          navigate('/');
        }
      } catch (error) {
        toast.error('Google Sign-In failed');
      } finally {
        setLoading(false);
      }
    },
    onError: error => toast.error('Google Sign-In failed'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 8 characters long and contain both letters and numbers.');
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
      });
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { state: { email: formData.email, isGoogle: false } });
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
          <Icon name="chef-hat" size={48} filter="var(--primary-filter)" />
          <h2>Join RecipeNest</h2>
          <p>Create an account to share your culinary masterpieces.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group mb-4">
            <label>Username</label>
            <div className="ds-input-group">
              <Icon name="user" size={20} className="ds-muted" />
              <input 
                type="text" 
                placeholder="Chef Gordon" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
                className="ds-input"
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label>Email Address</label>
            <div className="ds-input-group">
              <Icon name="mail" size={20} className="ds-muted" />
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="ds-input"
              />
            </div>
          </div>
          
          <div className="form-group mb-4">
            <label>Password</label>
            <div className="ds-input-group">
              <Icon name="lock" size={20} className="ds-muted" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="ds-input"
              />
            </div>
          </div>

          <div className="form-group mb-6">
            <label>Confirm Password</label>
            <div className="ds-input-group">
              <Icon name="lock" size={20} className="ds-muted" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="ds-input"
              />
            </div>
          </div>

          <button type="submit" className="btn-pill primary w-100" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
          
          <div className="divider mt-6 mb-6">OR</div>
          
          <button type="button" className="google-auth-btn w-100" onClick={() => googleLogin()}>
            <GoogleIcon size={24} />
            Sign up with Google
          </button>
        </form>

        <p className="auth-footer mt-6">
          Already have an account? <Link to="/login" className="btn-link">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
