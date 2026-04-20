import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
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
  const email = location.state?.email || '';
  const role = location.state?.role || 'Food Lover';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter OTP');
    
    try {
      setLoading(true);
      await API.verifyEmailOtp(email, otp, role);
      toast.success('Email verified successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await API.resendOtp(email);
      toast.success('A new OTP has been sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Error resending OTP');
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-header">
          <Icon name="shield-check" size={48} filter="var(--primary-filter)" />
          <h1>Verify Your Email</h1>
          <p>We've sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <div className="input-group">
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-100" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Didn't receive the code?</p>
          <button className="btn-link" onClick={handleResend}>Resend OTP</button>
        </div>
      </div>
    </div>
  );
};

export default EmailOtpVerify;
