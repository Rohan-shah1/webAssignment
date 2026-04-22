import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import './Profile.css';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const ChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    if (formData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setLoading(true);
      await API.changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="auth-card mx-auto" style={{ maxWidth: '500px' }}>
        <button onClick={() => navigate('/profile')} className="ds-back-btn">
          <Icon name="arrow-left" size={18} /> Back to Profile
        </button>
        
        <div className="section-title mb-8">
          <h2>Security Settings</h2>
          <p className="text-secondary">Update your account password to stay secure.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-box space-y-6">
          <div className="form-group">
            <label>Current Password</label>
            <div className="input-group">
              <Icon name="lock" size={18} className="input-icon" />
              <input 
                type="password" 
                required
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className="input-group">
              <Icon name="shield-check" size={18} className="input-icon" />
              <input 
                type="password" 
                required
                placeholder="Min 6 characters"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="input-group">
              <Icon name="check-circle" size={18} className="input-icon" />
              <input 
                type="password" 
                required
                placeholder="Repeat new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Processing...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
