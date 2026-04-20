import { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const UserProfile = () => {
  const { userInfo, login, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: userInfo?.username || '',
    email: userInfo?.email || '',
    bio: userInfo?.bio || '',
    address: userInfo?.address || '',
    profilePicture: null // File object
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      data.append('address', formData.address);
      if (formData.profilePicture) data.append('profilePicture', formData.profilePicture);
      if (currentPassword && newPassword) {
        data.append('currentPassword', currentPassword);
        data.append('newPassword', newPassword);
      }

      const updatedUser = await API.updateProfile(data);
      login(updatedUser);
      toast.success('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="profile-layout grid">
        <aside className="profile-sidebar card-box">
          <div className="avatar-section">
            <div className="avatar-preview">
              <img src={userInfo?.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'} alt="Profile" />
              <label className="avatar-edit-btn">
                <Icon name="camera" size={16} filter="white" />
                <input 
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.files[0] })}
                />
              </label>
            </div>
            <h2>{userInfo?.username}</h2>
            <p className="text-secondary">{userInfo?.role}</p>
          </div>
          
          <nav className="profile-nav mt-8">
            <button className="active"><Icon name="user" size={18} /> Account Details</button>
            <button onClick={logout} className="logout-btn"><Icon name="log-out" size={18} /> Sign Out</button>
          </nav>
        </aside>

        <main className="profile-main card-box">
          <div className="section-title">
            <h2>Account Settings</h2>
            <p className="text-secondary">Manage your public profile and account preferences.</p>
          </div>

          <form onSubmit={handleUpdate} className="profile-form mt-6">
            <div className="form-grid">
              <div className="form-group">
                <label>Username</label>
                <div className="input-group">
                  <Icon name="user" size={18} className="input-icon" />
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-group disabled">
                  <Icon name="mail" size={18} className="input-icon" />
                  <input type="email" value={formData.email} disabled />
                </div>
              </div>
            </div>

            <div className="form-group mt-4">
              <label>Address & Country</label>
              <div className="input-group">
                <Icon name="map-pin" size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Paris, France"
                />
              </div>
            </div>

            <div className="form-group mt-4">
              <label>Bio</label>
              <textarea 
                rows="4"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your culinary journey..."
              ></textarea>
            </div>

            <div className="password-section mt-8">
              <h3>Change Password</h3>
              <p className="text-secondary text-sm mb-4">Leave blank if you don't want to change it.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-group">
                    <Icon name="lock" size={18} className="input-icon" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-group">
                    <Icon name="lock" size={18} className="input-icon" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions mt-8">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
