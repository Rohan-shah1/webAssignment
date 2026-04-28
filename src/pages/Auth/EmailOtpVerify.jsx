import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const EmailOtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email || '';
  const [role, setRole] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!role) return toast.error('Please select your role');
    if (!otp) return toast.error('Please enter the verification code');
    
    try {
      setLoading(true);
      const data = await API.verifyEmailOtp(email, otp, role);
      login(data);
      toast.success(`Welcome to RecipeNest as a ${role}!`);
      navigate(role === 'Admin' ? '/admin' : role === 'Chef' ? '/dashboard' : '/');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await API.resendOtp(email);
      toast.success('A new OTP has been sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Error resending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-header">
          <Icon name="shield-check" size={48} filter="var(--primary-filter)" />
          <h1>Complete Your Registration</h1>
          <p>Verify your email <strong>{email}</strong> to finalize your account.</p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group mb-6">
            <label className="text-sm font-bold mb-2 block">Tell us your role</label>
            <div className="role-selector ds-row" style={{ marginTop: '0.5rem' }}>
              <button 
                type="button"
                className={`role-btn ${role === 'Food Lover' ? 'active' : ''}`}
                onClick={() => setRole('Food Lover')}
                style={{ flex: 1 }}
              >
                <Icon name="utensils-crossed" size={24} className="mx-auto mb-2" />
                <span>Food Lover</span>
              </button>
              <button 
                type="button"
                className={`role-btn ${role === 'Chef' ? 'active' : ''}`}
                onClick={() => setRole('Chef')}
                style={{ flex: 1 }}
              >
                <Icon name="chef-hat" size={24} className="mx-auto mb-2" />
                <span>Chef</span>
              </button>
            </div>
            {role && <p className="role-hint text-sm mt-1 opacity-50">
              {role === 'Chef' ? 'You can post recipes and manage your culinary brand.' : 'Explore, save, and interact with master recipes.'}
            </p>}
          </div>

          <div className="form-group mb-6">
            <label htmlFor="otp">Verification Code</label>
            <input 
              type="text" 
              id="otp"
              name="otp"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center font-bold text-xl tracking-widest"
              autoFocus
            />
          </div>

          <button type="submit" className="btn-primary w-100" disabled={loading}>
            {loading ? 'Verifying...' : 'Complete Profile'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Didn't receive the code?</p>
          <button className="btn-link" onClick={handleResend} disabled={loading}>Resend OTP</button>
        </div>
      </div>
    </div>
  );
};

export default EmailOtpVerify;
