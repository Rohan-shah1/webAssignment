import { useState, useEffect } from 'react';
import { Users, BookOpen, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../api';
import './Dashboard.css'; // Reuse dashboard styles

const AdminDashboard = () => {
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
          ) : (
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
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
