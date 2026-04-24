import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { useAuth } from '../../context/AuthContext';
import ChefList from '../Home/ChefList';

import API from '../../api';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const ChefDashboard = () => {
  const { userInfo, login, logout } = useAuth();

  const isFoodLover = userInfo?.role === 'Food Lover';
  const isAdmin = userInfo?.role === 'Admin';
  const [activeTab, setActiveTab] = useState(isFoodLover ? 'browse' : 'recipes');
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(!isFoodLover);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);
  const [recipeData, setRecipeData] = useState({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '' });

  const [recipeImage, setRecipeImage] = useState(null);
  const [followedChefs, setFollowedChefs] = useState([]);
  const [followedLoading, setFollowedLoading] = useState(false);

  if (!userInfo) {
    return (
      <div className="dashboard-page ds-empty-state container" style={{ minHeight: '60vh' }}>
        <Icon name="chef-hat" size={48} className="ds-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedIngredients = typeof recipeData.ingredients === 'string'
        ? recipeData.ingredients.split(',').map(i => i.trim()).join(',')
        : recipeData.ingredients;

      const formData = new FormData();
      formData.append('title', recipeData.title);
      formData.append('ingredients', formattedIngredients);
      formData.append('instructions', recipeData.instructions);
      formData.append('category', recipeData.category);
      formData.append('difficulty', recipeData.difficulty);
      formData.append('prepTime', recipeData.prepTime || 0);

      if (recipeImage) formData.append('image', recipeImage);

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

  const resetRecipeForm = () => {
    setRecipeData({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '' });
    setRecipeImage(null);
    setIsEditing(false);
    setCurrentRecipeId(null);
  };

  const openEditModal = (recipe) => {
    setRecipeData({
      title: recipe.title,
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



  useEffect(() => {
    const fetchMyRecipes = async () => {
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
  }, [userInfo, isFoodLover, isAdmin]);

  useEffect(() => {
    const fetchFollowed = async () => {
      if (!isFoodLover) return;
      try {
        setFollowedLoading(true);
        const data = await API.getFollowedChefs();
        setFollowedChefs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching followed chefs:', error);
      } finally {
        setFollowedLoading(false);
      }
    };
    fetchFollowed();
  }, [isFoodLover]);



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
              <Icon name="plus" size={18} filter="white" className="mr-2" /> Add New Recipe
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
                  <button className="btn-icon text-primary" onClick={() => openEditModal(recipe)}>
                    <Icon name="edit-2" size={18} filter="var(--primary-color)" />
                  </button>
                  <button className="btn-icon text-danger" onClick={() => deleteRecipe(recipe._id)}>
                    <Icon name="trash-2" size={18} />
                  </button>
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
        <div className="dashboard-panel p-0 clean-panel">
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
          {followedLoading ? (
            <div className="text-center py-8 text-secondary">
              <p>Loading followed chefs...</p>
            </div>
          ) : followedChefs.length === 0 ? (
            <div className="ds-empty-state">
              <Icon name="users" size={48} className="mx-auto mb-4" />
              <p>You haven't followed any chefs yet.</p>
              <button className="btn-outline mt-4" onClick={() => setActiveTab('browse')}>Discover Chefs</button>
            </div>
          ) : (
            <div className="recipe-list">
              {followedChefs.map((chef) => (
                <Link to={`/chef/${chef._id}`} key={chef._id} className="dashboard-recipe-card">
                  <div className="recipe-summary">
                    <h3>{chef.username}</h3>
                    <p className="text-secondary text-sm">{chef.bio || 'Professional chef on RecipeNest.'}</p>
                  </div>
                  <div className="recipe-actions">
                    <span className="btn-pill outline btn-sm">View Profile</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
                <Icon name="compass" size={20} /> Browse Chefs
              </button>
            )}
            {isFoodLover && (
              <button
                className={`nav-item ${activeTab === 'followed' ? 'active' : ''}`}
                onClick={() => setActiveTab('followed')}
              >
                <Icon name="users" size={20} /> Followed Chefs
              </button>
            )}
            {!isFoodLover && !isAdmin && (
              <button
                className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
                onClick={() => setActiveTab('recipes')}
              >
                <Icon name="book-open" size={20} /> My Recipes
              </button>
            )}


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
              <div className="recipe-modal-header">
                <Icon name="book-open" size={32} filter="white" />
                <h2>{isEditing ? 'Edit Your Masterpiece' : 'Create New Masterpiece'}</h2>
              </div>

              <form onSubmit={handleRecipeSubmit}>
                <div className="recipe-form-group">
                  <label>Recipe Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="ds-input"
                    onChange={e => setRecipeImage(e.target.files[0])}
                  />
                </div>
                <div className="recipe-form-group">
                  <label>Recipe Title</label>
                  <input
                    type="text"
                    className="ds-input"
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
                    className="ds-textarea"
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
                    className="ds-textarea"
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
                      className="ds-select"
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
                      className="ds-select"
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
                      className="ds-input"
                      value={recipeData.prepTime}
                      onChange={e => setRecipeData({ ...recipeData, prepTime: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-pill primary w-100 mt-4" disabled={loading}>
                  {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Publish Recipe')}
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
