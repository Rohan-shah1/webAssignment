import { useState, useEffect } from 'react';
import { ChefHat, BookOpen, Settings, LogOut, Plus, Edit2, Trash2, Compass, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import './Dashboard.css';
import { useAuth } from '../../context/AuthContext';
import ChefList from '../Home/ChefList';

import API from '../../api';

const ChefDashboard = () => {
  const { userInfo, login, logout } = useAuth();

  const isFoodLover = userInfo?.role === 'Food Lover' || userInfo?.role === 'Normal User';
  const isAdmin = userInfo?.role === 'Admin';
  const [activeTab, setActiveTab] = useState(isFoodLover ? 'browse' : (isAdmin ? 'profile' : 'recipes'));
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(!isFoodLover);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);
  const [recipeData, setRecipeData] = useState({ title: '', ingredients: '', instructions: '' });

  const [profileData, setProfileData] = useState({
    username: userInfo?.username || '',
    bio: userInfo?.bio || '',
  });
  const [profileImage, setProfileImage] = useState(null);

  // Early return guard AFTER all initial state hooks
  if (!userInfo) {
    return <div className="dashboard-page container py-8 text-center text-secondary">Loading dashboard...</div>;
  }

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedRecipe = {
        ...recipeData,
        ingredients: typeof recipeData.ingredients === 'string' 
          ? recipeData.ingredients.split(',').map(i => i.trim())
          : recipeData.ingredients
      };
      
      if (isEditing) {
        const updated = await API.updateRecipe(currentRecipeId, formattedRecipe);
        setRecipes(recipes.map(r => r._id === currentRecipeId ? updated : r));
        toast.success('Recipe updated successfully!');
      } else {
        const created = await API.createRecipe(formattedRecipe);
        setRecipes([...recipes, created]);
        toast.success('Recipe added successfully!');
      }
      
      setShowModal(false);
      resetRecipeForm();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to add recipe');
    }
  };

  const resetRecipeForm = () => {
    setRecipeData({ title: '', ingredients: '', instructions: '' });
    setIsEditing(false);
    setCurrentRecipeId(null);
  };

  const openEditModal = (recipe) => {
    setRecipeData({
      title: recipe.title,
      ingredients: recipe.ingredients.join(', '),
      instructions: recipe.instructions
    });
    setIsEditing(true);
    setCurrentRecipeId(recipe._id);
    setShowModal(true);
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
      
      const updated = await API.updateProfile(formData);
      login(updated); // Uses AuthContext login to update global state
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile Update Error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  useEffect(() => {
    const fetchMyRecipes = async () => {
      // Don't fetch if userInfo is null, if user is a Food Lover, or if user is an Admin
      if (!userInfo || isFoodLover || isAdmin) return; 
      
      try {
        setLoading(true);
        const data = await API.getChefDetails(userInfo._id);
        setRecipes(data.recipes);
      } catch (error) {
        console.error('Error fetching dashboard recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRecipes();
  }, [userInfo, isFoodLover]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const deleteRecipe = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        await API.deleteRecipe(id);
        setRecipes(recipes.filter(r => r._id !== id));
        toast.success('Recipe deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };

  const renderContent = () => {
    if (activeTab === 'recipes') {
      return (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Recipe Management</h2>
            <button className="btn-primary flex-align" onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2" /> Add New Recipe
            </button>
          </div>
          <div className="header-line-sm mb-4"></div>
          
          <div className="recipe-list">
            {recipes.map(recipe => (
              <div key={recipe._id} className="dashboard-recipe-card">
                <div className="recipe-summary">
                  <h3>{recipe.title}</h3>
                  <div className="recipe-meta">
                    <span className="badge">Gourmet</span>
                    <span>⏱️ Check Directions</span>
                  </div>
                </div>
                <div className="recipe-actions">
                  <button className="btn-icon text-primary" onClick={() => openEditModal(recipe)}><Edit2 size={18} /></button>
                  <button className="btn-icon text-danger" onClick={() => deleteRecipe(recipe._id)}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            {recipes.length === 0 && <p className="text-secondary">No recipes found. Start creating!</p>}
          </div>
        </div>
      );
    }

    if (activeTab === 'browse') {
      return (
        <div className="dashboard-panel p-0" style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
          <ChefList isDashboardMode={true} />
        </div>
      );
    }

    if (activeTab === 'followed') {
      return (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Followed Chefs</h2>
          </div>
          <div className="header-line-sm mb-4"></div>
          <div className="text-center py-8 text-secondary">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>You haven't followed any chefs yet.</p>
            <button className="btn-outline mt-4" onClick={() => setActiveTab('browse')}>Discover Chefs</button>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'profile') {
      return (
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
                Leave empty to keep current picture. Recommended size: 500x500px.
              </p>
            </div>
            <button type="submit" className="btn-primary mt-4">Save Changes</button>
          </form>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-page container py-8">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="chef-avatar-small">
              <img src={userInfo?.profilePicture || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"} alt="Avatar" />
            </div>
            <h3>{userInfo?.username}</h3>
            <p className="text-secondary">{userInfo?.role}</p>
          </div>
          
          <nav className="sidebar-nav">
            {isFoodLover && (
              <button 
                className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={() => setActiveTab('browse')}
              >
                <Compass size={20} /> Browse Chefs
              </button>
            )}
            {isFoodLover && (
              <button 
                className={`nav-item ${activeTab === 'followed' ? 'active' : ''}`}
                onClick={() => setActiveTab('followed')}
              >
                <Users size={20} /> Followed Chefs
              </button>
            )}
            {!isFoodLover && !isAdmin && (
              <button 
                className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
                onClick={() => setActiveTab('recipes')}
              >
                <BookOpen size={20} /> My Recipes
              </button>
            )}
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
          {renderContent()}
        </main>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            <div className="modal-body">
              <h2>{isEditing ? 'Edit Recipe' : 'Add New Recipe'}</h2>
              <form onSubmit={handleRecipeSubmit}>
                <div className="form-group">
                  <label>Recipe Title</label>
                  <input 
                    type="text" 
                    required 
                    value={recipeData.title}
                    onChange={e => setRecipeData({...recipeData, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Ingredients (comma separated)</label>
                  <textarea 
                    rows="3" 
                    required 
                    placeholder="Salt, Pepper, Chicken..."
                    value={recipeData.ingredients}
                    onChange={e => setRecipeData({...recipeData, ingredients: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea 
                    rows="5" 
                    required 
                    value={recipeData.instructions}
                    onChange={e => setRecipeData({...recipeData, instructions: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary w-100 mt-4">
                  {isEditing ? 'Update Recipe' : 'Create Recipe'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
