import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter email');
    try {
      setLoading(true);
      await API.forgotPassword(email);
      toast.success('Password reset code sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Error sending request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('Fill all fields');

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,25}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be between 8 and 25 characters long and contain both letters and numbers.');
      return;
    }

    try {
      setLoading(true);
      await API.resetPassword(email, otp, newPassword);
      toast.success('Password updated! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-header">
          <Icon name="lock" size={48} filter="var(--primary-filter)" />
          <h1>{step === 1 ? 'Forgot Password?' : 'Reset Password'}</h1>
          <p>{step === 1 ? 'Enter your email to receive a recovery code.' : 'Enter the code and your new password.'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <Icon name="mail" size={20} className="input-icon" />
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-100" disabled={loading}>
              {loading ? 'Sending...' : 'Get Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Reset Code</label>
              <input 
                type="text" 
                id="otp"
                name="otp"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-group">
                <Icon name="key" size={20} className="input-icon" />
                <input 
                  type="password" 
                  id="newPassword"
                  name="newPassword"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-100" disabled={loading}>
              {loading ? 'Resetting...' : 'Change Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="flex-align text-sm">
            <Icon name="arrow-left" size={14} className="mr-1" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
