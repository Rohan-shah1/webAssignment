import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css'; // Reuse dashboard styles

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const AdminDashboard = () => {
  const { userInfo, login, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);



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


  const [deleteModal, setDeleteModal] = useState({ show: false, recipeId: null, reason: '' });

  const confirmDelete = (id) => {
    setDeleteModal({ show: true, recipeId: id, reason: '' });
  };

  const deleteRecipe = async () => {
    if (!deleteModal.reason.trim()) {
      toast.warning('Please provide a reason for deletion');
      return;
    }

    try {
      await API.deleteRecipe(deleteModal.recipeId, { reason: deleteModal.reason });
      setRecipes(recipes.filter(r => r._id !== deleteModal.recipeId));
      toast.success('Recipe deleted and feedback logged');
      setDeleteModal({ show: false, recipeId: null, reason: '' });
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };



  return (
    <div className="dashboard-page container py-8">
      <div className="header-flex mb-8">
        <div>
          <h1 className="flex-align">
            <Icon name="shield-check" size={32} filter="var(--primary-filter)" className="mr-3" /> Admin Control Center
          </h1>
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
              <Icon name="users" size={20} /> User Management
            </button>
            <button 
              className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <Icon name="book-open" size={20} /> Global Recipes
            </button>


          </nav>
        </aside>

        <main className="dashboard-main">
          {activeTab === 'users' ? (
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>User Management ({users.length})</h2>
              </div>
              <div className="header-line-sm mb-4"></div>
              <div className="table-container ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td className="p-3 text-left">
                          <div className="flex flex-col">
                            <span className="font-bold">{u.username}</span>
                            <span className="text-xs text-secondary">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-3 text-left">
                          <span className={`badge ${u.role === 'Chef' ? 'primary' : ''}`}>{u.role}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button className="btn-icon text-danger" onClick={() => deleteUser(u._id)} title="Delete User" style={{ display: 'inline-flex', marginLeft: 'auto' }}>
                            <Icon name="trash-2" size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-secondary">No users found in the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'recipes' ? (
            <div className="dashboard-panel">
              <div className="panel-header">
                <h2>Global Recipes ({recipes.length})</h2>
              </div>
              <div className="header-line-sm mb-4"></div>
              <div className="recipe-list">
                {recipes.map(recipe => (
                  <div key={recipe._id} className="dashboard-recipe-card">
                    <div className="recipe-summary">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="m-0">{recipe.title}</h3>
                        <span className="badge text-xs">{recipe.category}</span>
                      </div>
                      <div className="recipe-meta">
                        <span>By Chef <strong>{recipe.chef?.username || 'Unknown'}</strong></span>
                        <span className="mx-2">•</span>
                        <span>⏱️ {recipe.prepTime} min</span>
                      </div>
                    </div>
                    <div className="recipe-actions">
                      <Link to={`/recipe/${recipe._id}`} className="btn-icon text-primary" title="View Recipe">
                        <Icon name="eye" size={18} filter="var(--primary-color)" />
                      </Link>
                      <button className="btn-icon text-danger" onClick={() => confirmDelete(recipe._id)} title="Delete Recipe">
                        <Icon name="trash-2" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {recipes.length === 0 && <p className="text-secondary text-center py-8">No recipes published yet.</p>}
              </div>

              {/* Delete Reason Modal */}
              {deleteModal.show && (
                <div className="modal-overlay">
                  <div className="modal-content card-box">
                    <h3>Confirm Deletion</h3>
                    <p className="text-secondary mb-4">Please provide a reason for deleting this recipe. This will be sent as feedback.</p>
                    <textarea 
                      className="modern-input mb-4" 
                      placeholder="e.g. Inappropriate content, copyright violation, etc."
                      rows="3"
                      value={deleteModal.reason}
                      onChange={(e) => setDeleteModal({...deleteModal, reason: e.target.value})}
                    ></textarea>
                    <div className="flex justify-end gap-3">
                      <button className="btn-pill outline" onClick={() => setDeleteModal({ show: false, recipeId: null, reason: '' })}>Cancel</button>
                      <button className="btn-pill primary" onClick={deleteRecipe} style={{background: 'var(--toast-error)'}}>Delete Permanently</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
