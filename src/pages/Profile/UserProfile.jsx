import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    profilePicture: null,
    coverPhoto: null
  });
  const [previews, setPreviews] = useState({
    profilePicture: null,
    coverPhoto: null
  });

  // Sync form with userInfo when it updates (e.g. after save)
  useEffect(() => {
    if (userInfo) {
      setFormData({
        username: userInfo.username || '',
        email: userInfo.email || '',
        bio: userInfo.bio || '',
        address: userInfo.address || '',
        profilePicture: null,
        coverPhoto: null
      });
      setPreviews({
        profilePicture: null,
        coverPhoto: null
      });
    }
  }, [userInfo]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
      setPreviews({ ...previews, [field]: URL.createObjectURL(file) });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      data.append('address', formData.address);
      if (formData.profilePicture) data.append('profilePicture', formData.profilePicture);
      if (formData.coverPhoto) data.append('coverPhoto', formData.coverPhoto);
      const updatedUser = await API.updateProfile(data);
      login(updatedUser);
      setPreviews({ profilePicture: null, coverPhoto: null });
      toast.success('Profile updated successfully!');
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
              <img src={previews.profilePicture || userInfo?.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'} alt="Profile" />
              <label className="avatar-edit-btn" htmlFor="profilePicture">
                <Icon name="camera" size={16} filter="white" />
                <input 
                  type="file" 
                  id="profilePicture"
                  name="profilePicture"
                  hidden 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profilePicture')}
                />
              </label>
            </div>
            <h2>{userInfo?.username}</h2>
            <p className="text-secondary">{userInfo?.role}</p>
          </div>

          {userInfo?.role === 'Chef' && (
            <div className="cover-photo-edit mt-8">
              <label className="text-sm font-bold mb-2 block">Profile Header Background</label>
              <div className="cover-preview-box">
                <img 
                  src={previews.coverPhoto || userInfo?.coverPhoto || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'} 
                  alt="Cover" 
                />
                <label className="cover-edit-overlay" htmlFor="coverPhoto">
                  <Icon name="image" size={20} filter="white" />
                  <span>Change Background</span>
                  <input 
                    type="file" 
                    id="coverPhoto"
                    name="coverPhoto"
                    hidden 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'coverPhoto')}
                  />
                </label>
              </div>
            </div>
          )}
          
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
                <label htmlFor="username">Username</label>
                <div className="input-group">
                  <Icon name="user" size={18} className="input-icon" />
                  <input 
                    type="text" 
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-group disabled">
                  <Icon name="mail" size={18} className="input-icon" />
                  <input type="email" id="email" name="email" value={formData.email} disabled />
                </div>
              </div>
            </div>

            <div className="form-group mt-4">
              <label htmlFor="address">Address & Country</label>
              <div className="input-group">
                <Icon name="map-pin" size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Kathmandu, Nepal"
                />
              </div>
            </div>

            {userInfo?.role !== 'Admin' && (
              <div className="form-group mt-4">
                <label htmlFor="bio">Bio</label>
                <textarea 
                  className="modern-input"
                  id="bio"
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about your culinary journey..."
                ></textarea>
              </div>
            )}

            <div className="password-section mt-10">
              <div className="security-card-content">
                <div className="security-info">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="shield" size={20} className="text-primary" />
                    <h3 className="text-lg font-bold">Account Security</h3>
                  </div>
                  <p className="text-secondary text-sm">Protect your account by keeping your password up to date.</p>
                </div>
                <Link to="/change-password" title="Change Password" className="btn-security">
                  <Icon name="lock" size={18} filter="white" /> Change Password
                </Link>
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
