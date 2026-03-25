import { useState, useEffect } from 'react';
import { Users, BookOpen, Trash2, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css'; // Reuse dashboard styles

const AdminDashboard = () => {
  const { userInfo, login, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const [profileData, setProfileData] = useState({
    username: userInfo?.username || '',
    bio: userInfo?.bio || '',
  });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (userInfo) {
      setProfileData({
        username: userInfo.username || '',
        bio: userInfo.bio || '',
      });
    }
  }, [userInfo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([API.adminGetUsers(), API.adminGetRecipes()]);
      setUsers(u);
      setRecipes(r);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? All their data will be lost.')) {
      try {
        await API.adminDeleteUser(id);
        setUsers(users.filter(u => u._id !== id));
        toast.success('User deleted');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('bio', profileData.bio);
      if (profileImage) {
        formData.append('profilePicture', profileImage);
      }
      
      const updated = await API.adminUpdateProfile(formData);
      console.log('Profile update response:', updated);
      login(updated);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Admin Profile Update Error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const deleteRecipe = async (id) => {
    if (window.confirm('Delete this recipe?')) {
      try {
        await API.deleteRecipe(id); // Use standard deleteRecipe
        setRecipes(recipes.filter(r => r._id !== id));
        toast.success('Recipe deleted');
      } catch (error) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-page container py-8">
      <div className="header-flex mb-8">
        <div>
          <h1 className="flex-align"><ShieldCheck className="mr-2" color="var(--primary-color)" /> Admin Control Center</h1>
          <p className="text-secondary">Manage platform users and content</p>
        </div>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} /> User Management
            </button>
            <button 
              className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <BookOpen size={20} /> Global Recipes
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Settings size={20} /> Profile Settings
            </button>
            <button className="nav-item text-danger mt-auto" onClick={handleLogout}>
              <LogOut size={20} /> Log Out
            </button>
          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'users' ? (
            <div className="dashboard-panel">
              <h2>All Users ({users.length})</h2>
              <div className="header-line-sm mb-4"></div>
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="w-100 text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th className="p-3">Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="p-3 font-bold">{u.username}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3"><span className="badge">{u.role}</span></td>
                        <td className="p-3">
                          <button className="btn-icon text-danger" onClick={() => deleteUser(u._id)}><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'recipes' ? (
            <div className="dashboard-panel">
              <h2>Global Recipes ({recipes.length})</h2>
              <div className="header-line-sm mb-4"></div>
              <div className="recipe-list">
                {recipes.map(recipe => (
                  <div key={recipe._id} className="dashboard-recipe-card">
                    <div className="recipe-summary">
                      <h3>{recipe.title}</h3>
                      <p className="text-sm text-secondary">By {recipe.user?.username || 'Unknown'}</p>
                    </div>
                    <div className="recipe-actions">
                      <button className="btn-icon text-danger" onClick={() => deleteRecipe(recipe._id)}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dashboard-panel">
              <h2>Edit Profile</h2>
              <div className="header-line-sm mb-4"></div>
              <form className="profile-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Full Name / Username</label>
                  <input 
                    type="text" 
                    value={profileData.username} 
                    onChange={e => setProfileData({...profileData, username: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    rows="4" 
                    value={profileData.bio}
                    onChange={e => setProfileData({...profileData, bio: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Profile Picture</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setProfileImage(e.target.files[0])}
                  />
                  <p className="text-secondary mt-1" style={{ fontSize: '0.8rem' }}>
                    Leave empty to keep current picture.
                  </p>
                </div>
                <button type="submit" className="btn-primary mt-4">Save Changes</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
