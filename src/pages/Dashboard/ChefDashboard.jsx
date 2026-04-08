import { useState, useEffect } from 'react';
import { ChefHat, BookOpen, Settings, LogOut, Plus, Edit2, Trash2, Compass, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import './Dashboard.css';
import { useAuth } from '../../context/AuthContext';
import ChefList from '../Home/ChefList';

import API from '../../api';

const ChefDashboard = () => {
  // Authentication context and helpers for user session management
  const { userInfo, login, logout } = useAuth();

  // Access control flags based on the user's role
  const isFoodLover = userInfo?.role === 'Food Lover' || userInfo?.role === 'Normal User';
  const isAdmin = userInfo?.role === 'Admin';
  // Initial tab selection determined by user role
  const [activeTab, setActiveTab] = useState(isFoodLover ? 'browse' : (isAdmin ? 'profile' : 'recipes'));
  
  // State variables for recipe collection and UI status
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(!isFoodLover);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);
  const [recipeData, setRecipeData] = useState({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '' });

  // Local state for profile and image management
  const [profileData, setProfileData] = useState({
    username: userInfo?.username || '',
    bio: userInfo?.bio || '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);

  // Fallback UI while authentication data is being resolved
  if (!userInfo) {
    return <div className="dashboard-page container py-8 text-center text-secondary">Loading dashboard...</div>;
  }

  // Submission handler for creating or updating recipe data
  const handleRecipeSubmit = async (e) => {
    // Intercept standard form submission to process through React
    e.preventDefault();
    try {
      // Ingredient string normalization for backend storage format
      const formattedIngredients = typeof recipeData.ingredients === 'string'
        ? recipeData.ingredients.split(',').map(i => i.trim()).join(',')
        : recipeData.ingredients;

      // FormData construction to support multipart uploads for images
      const formData = new FormData();
      formData.append('title', recipeData.title);
      formData.append('ingredients', formattedIngredients);
      formData.append('instructions', recipeData.instructions);
      formData.append('category', recipeData.category);
      formData.append('difficulty', recipeData.difficulty);
      formData.append('prepTime', recipeData.prepTime || 0);

      // Attachment of binary image data if selected
      if (recipeImage) {
        formData.append('image', recipeImage);
      }

      if (isEditing) {
        const updated = await API.updateRecipe(currentRecipeId, formData);
        setRecipes(recipes.map(r => r._id === currentRecipeId ? updated : r));
        toast.success('Recipe updated successfully!');
      } else {
        const created = await API.createRecipe(formData);
        setRecipes([...recipes, created]);
        toast.success('Recipe added successfully!');
      }

      setShowModal(false);
      resetRecipeForm();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to add recipe');
    }
  };

  // Clears the recipe form state to prevent data carryover
  const resetRecipeForm = () => {
    setRecipeData({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '' });
    setRecipeImage(null);
    setIsEditing(false);
    setCurrentRecipeId(null);
  };

  // Populates the form with existing data for the selected recipe or editing
  const openEditModal = (recipe) => {
    setRecipeData({
      title: recipe.title,
      // Conversion of array back to string for editable textarea
      ingredients: recipe.ingredients.join(', '),
      instructions: recipe.instructions,
      category: recipe.category || 'Other',
      difficulty: recipe.difficulty || 'Medium',
      prepTime: recipe.prepTime || ''
    });
    setRecipeImage(null);
    setIsEditing(true);
    setCurrentRecipeId(recipe._id);
    setShowModal(true);
  };


  // Synchronizes user profile modifications with the backend
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
      login(updated); // Immediate update of the global authentication state
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile Update Error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  // Component effect to fetch personal recipe collection upon mount or user change
  useEffect(() => {
    const fetchMyRecipes = async () => {
      // Fetching skipped for Food Lovers or Admins as they lack personal recipe management in this context
      if (!userInfo || isFoodLover || isAdmin) return;

      try {
        setLoading(true);
        // Retrieval of populated recipe data for the current user
        const data = await API.getChefDetails(userInfo._id);
        setRecipes(data.recipes);
      } catch (error) {
        console.error('Error fetching dashboard recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRecipes();
  }, [userInfo, isFoodLover, isAdmin]);

  // Clears session and redirects browser to the home route
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  // Permanently removes a recipe after a confirmation check
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

  // Conditional rendering logic for different dashboard tab panels
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
                    <span className="badge">{recipe.category || 'Gourmet'}</span>
                    <span>⏱️ {recipe.prepTime ? `${recipe.prepTime} mins` : 'Check Directions'}</span>
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
                onChange={e => setProfileData({ ...profileData, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows="4"
                value={profileData.bio}
                onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
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

  // Main component layout with sidebar navigation and dynamic panel display
  return (
    <div className="dashboard-page container py-8">
      <div className="dashboard-layout">
        {/* Sidebar navigation section */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="chef-avatar-small">
              <img src={userInfo?.profilePicture || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"} alt="Avatar" />
            </div>
            <h3>{userInfo?.username}</h3>
            <p className="text-secondary">{userInfo?.role}</p>
          </div>

          <nav className="sidebar-nav">
            {/* Search options displayed for food lover roles */}
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
            {/* Cookbook management options displayed for chef roles */}
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

        {/* Dynamic viewport for rendered tab content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>

      {/* Recipe creation and modification modal overlay */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setShowModal(false)} style={{ top: '10px', right: '10px', background: 'rgba(255,255,255,0.2)', color: 'white' }}>&times;</button>
            <div className="modal-body" style={{ padding: '2.5rem' }}>
              <div className="recipe-modal-header">
                <BookOpen size={32} color="white" />
                <h2>{isEditing ? 'Edit Your Masterpiece' : 'Create New Masterpiece'}</h2>
              </div>

              <form onSubmit={handleRecipeSubmit}>
                <div className="recipe-form-group">
                  <label>Recipe Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="modern-input"
                    onChange={e => setRecipeImage(e.target.files[0])}
                  />
                </div>
                <div className="recipe-form-group">
                  <label>Recipe Title</label>
                  <input
                    type="text"
                    className="modern-input"
                    required
                    placeholder="e.g. Classic Beef Wellington"
                    value={recipeData.title}
                    onChange={e => setRecipeData({ ...recipeData, title: e.target.value })}
                  />
                </div>

                <div className="recipe-form-group">
                  <label>Ingredients (comma separated)</label>
                  <textarea
                    rows="3"
                    className="modern-input"
                    required
                    placeholder="1kg Beef fillet, 250g Mushrooms, Puff pastry..."
                    value={recipeData.ingredients}
                    onChange={e => setRecipeData({ ...recipeData, ingredients: e.target.value })}
                  ></textarea>
                </div>

                <div className="recipe-form-group">
                  <label>Cooking Instructions</label>
                  <textarea
                    rows="5"
                    className="modern-input"
                    required
                    placeholder="Step 1: Preheat oven...&#10;Step 2: Sear the beef..."
                    value={recipeData.instructions}
                    onChange={e => setRecipeData({ ...recipeData, instructions: e.target.value })}
                  ></textarea>
                </div>

                <div className="recipe-form-group grid-3">
                  <div>
                    <label>Category</label>
                    <select
                      className="modern-input"
                      value={recipeData.category}
                      onChange={e => setRecipeData({ ...recipeData, category: e.target.value })}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Difficulty</label>
                    <select
                      className="modern-input"
                      value={recipeData.difficulty}
                      onChange={e => setRecipeData({ ...recipeData, difficulty: e.target.value })}
                    >
                      <option value="Easy">Beginner</option>
                      <option value="Medium">Intermediate</option>
                      <option value="Hard">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label>Prep Time (mins)</label>
                    <input
                      type="number"
                      min="0"
                      className="modern-input"
                      value={recipeData.prepTime}
                      onChange={e => setRecipeData({ ...recipeData, prepTime: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-100 mt-4" style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }}>
                  {isEditing ? 'Save Changes' : 'Publish Recipe'}
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
