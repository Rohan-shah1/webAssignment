import { useState, useEffect, useRef } from 'react';
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
  const modalBodyRef = useRef(null);

  const isFoodLover = userInfo?.role === 'Food Lover';
  const isAdmin = userInfo?.role === 'Admin';
  const [activeTab, setActiveTab] = useState(isFoodLover ? 'browse' : 'recipes');
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(!isFoodLover);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);
  const [recipeData, setRecipeData] = useState({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '', baseQty: '1', baseUnit: 'servings' });

  const [recipeImage, setRecipeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Reset scroll whenever modal opens
  useEffect(() => {
    if (showModal && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [showModal]);
  const [followedChefs, setFollowedChefs] = useState([]);
  const [followedLoading, setFollowedLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

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
      setLoading(true);
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
      formData.append('baseQty', parseFloat(recipeData.baseQty) > 0 ? parseFloat(recipeData.baseQty) : 1);
      formData.append('baseUnit', recipeData.baseUnit || 'servings');

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
    } finally {
      setLoading(false);
    }
  };

  const resetRecipeForm = () => {
    setRecipeData({ title: '', ingredients: '', instructions: '', category: 'Other', difficulty: 'Medium', prepTime: '', baseQty: '1', baseUnit: 'servings' });
    setRecipeImage(null);
    setImagePreview(null);
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
      prepTime: recipe.prepTime || '',
      baseQty: recipe.baseQty != null ? String(recipe.baseQty) : '1',
      baseUnit: recipe.baseUnit || 'servings'
    });
    setRecipeImage(null);
    setImagePreview(recipe.image || null);
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
        setFollowersCount(data.followersCount || 0);
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
        setLoading(true);
        await API.deleteRecipe(id);
        setRecipes(recipes.filter(r => r._id !== id));
        toast.success('Recipe deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete recipe');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'recipes') {
      return (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Recipe Management</h2>
            <button className="btn-primary flex-align" onClick={() => { resetRecipeForm(); setShowModal(true); }}>
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
                  <button className="btn-icon text-danger" onClick={() => deleteRecipe(recipe._id)} disabled={loading}>
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

    if (activeTab === 'analytics') {
      const totalLikes = recipes.reduce((sum, r) => sum + (r.likes?.length || 0), 0);
      return (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Chef Analytics</h2>
          </div>
          <div className="header-line-sm mb-6"></div>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon-bg primary">
                <Icon name="users" size={24} filter="white" />
              </div>
              <div className="analytics-info">
                <span className="analytics-label">Followers</span>
                <span className="analytics-value">{followersCount}</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon-bg secondary">
                <Icon name="book-open" size={24} filter="white" />
              </div>
              <div className="analytics-info">
                <span className="analytics-label">Total Recipes</span>
                <span className="analytics-value">{recipes.length}</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon-bg danger">
                <Icon name="heart" size={24} filter="white" />
              </div>
              <div className="analytics-info">
                <span className="analytics-label">Total Likes</span>
                <span className="analytics-value">{totalLikes}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3>Recent Performance</h3>
            <div className="header-line-sm mb-4"></div>
            <p className="text-secondary text-sm">Your most liked recipe has <strong>{Math.max(...recipes.map(r => r.likes?.length || 0), 0)}</strong> likes.</p>
          </div>
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
            {!isFoodLover && !isAdmin && (
              <button
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <Icon name="bar-chart-2" size={20} /> Analytics
              </button>
            )}


          </nav>
        </aside>

        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetRecipeForm(); }}>
          <div
            className="recipe-modal-box"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="recipe-modal-header">
              <div className="recipe-modal-header-content">
                <Icon name={isEditing ? 'edit-2' : 'sparkles'} size={28} filter="white" />
                <div className="recipe-modal-title-group">
                  <h2>{isEditing ? 'Edit Recipe' : 'Create New Recipe'}</h2>
                  <p>{isEditing ? 'Update your masterpiece' : 'Share your culinary creation with the world'}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => { setShowModal(false); resetRecipeForm(); }} aria-label="Close">
                <Icon name="x" size={20} filter="white" />
              </button>
            </div>

            <div className="recipe-modal-body" ref={modalBodyRef}>
              <form onSubmit={handleRecipeSubmit}>

                {/* Image Upload */}
                <div className="recipe-form-section">
                  <label className="recipe-section-label">
                    <Icon name="image" size={16} />
                    Recipe Photo
                  </label>
                  <label htmlFor="recipeImage" className="recipe-image-upload">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="recipe-image-preview" />
                        <div className="recipe-image-overlay">
                          <Icon name="camera" size={24} filter="white" />
                          <span>Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="recipe-image-placeholder">
                        <Icon name="upload-cloud" size={36} filter="var(--text-secondary)" />
                        <p>Click to upload a photo</p>
                        <span>JPG, PNG, WEBP up to 10MB</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="recipeImage"
                      name="recipeImage"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) {
                          setRecipeImage(f);
                          setImagePreview(URL.createObjectURL(f));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="recipe-form-divider" />

                {/* Basic Info */}
                <div className="recipe-form-section">
                  <label className="recipe-section-label">
                    <Icon name="book-open" size={16} />
                    Recipe Info
                  </label>
                  <div className="recipe-form-group">
                    <label htmlFor="title" className="recipe-field-label">Recipe Title <span className="required-star">*</span></label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="modern-input"
                      required
                      placeholder="e.g. Classic Beef Wellington"
                      value={recipeData.title}
                      onChange={e => setRecipeData({ ...recipeData, title: e.target.value })}
                    />
                  </div>

                  <div className="recipe-3col-grid">
                    <div className="recipe-form-group">
                      <label htmlFor="category" className="recipe-field-label">Category</label>
                      <select
                        id="category"
                        name="category"
                        className="modern-input"
                        value={recipeData.category}
                        onChange={e => setRecipeData({ ...recipeData, category: e.target.value })}
                      >
                        <option value="Breakfast">🌅 Breakfast</option>
                        <option value="Lunch">☀️ Lunch</option>
                        <option value="Dinner">🌙 Dinner</option>
                        <option value="Dessert">🍰 Dessert</option>
                        <option value="Other">🍽️ Other</option>
                      </select>
                    </div>
                    <div className="recipe-form-group">
                      <label htmlFor="difficulty" className="recipe-field-label">Difficulty</label>
                      <select
                        id="difficulty"
                        name="difficulty"
                        className="modern-input"
                        value={recipeData.difficulty}
                        onChange={e => setRecipeData({ ...recipeData, difficulty: e.target.value })}
                      >
                        <option value="Easy">🟢 Beginner</option>
                        <option value="Medium">🟡 Intermediate</option>
                        <option value="Hard">🔴 Advanced</option>
                      </select>
                    </div>
                    <div className="recipe-form-group">
                      <label htmlFor="prepTime" className="recipe-field-label">Prep Time (min)</label>
                      <input
                        type="number"
                        id="prepTime"
                        name="prepTime"
                        min="0"
                        className="modern-input"
                        placeholder="30"
                        value={recipeData.prepTime}
                        onChange={e => setRecipeData({ ...recipeData, prepTime: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="recipe-form-divider" />

                {/* Ingredients & Instructions */}
                <div className="recipe-form-section">
                  <label className="recipe-section-label">
                    <Icon name="list" size={16} />
                    Ingredients &amp; Method
                  </label>
                  <div className="recipe-form-group">
                    <label htmlFor="ingredients" className="recipe-field-label">
                      Ingredients <span className="required-star">*</span>
                      <span className="recipe-field-hint">comma-separated</span>
                    </label>
                    <textarea
                      id="ingredients"
                      name="ingredients"
                      rows="3"
                      className="modern-input"
                      required
                      placeholder="500g Beef fillet, 250g Mushrooms, 2 sheets Puff pastry, Salt, Black pepper..."
                      value={recipeData.ingredients}
                      onChange={e => setRecipeData({ ...recipeData, ingredients: e.target.value })}
                    />
                  </div>

                  <div className="recipe-form-group">
                    <label htmlFor="instructions" className="recipe-field-label">
                      Cooking Instructions <span className="required-star">*</span>
                      <span className="recipe-field-hint">step by step</span>
                    </label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      rows="5"
                      className="modern-input"
                      required
                      placeholder={`Step 1: Preheat oven to 200°C...\nStep 2: Sear the beef on all sides...\nStep 3: Wrap in mushroom duxelles...`}
                      value={recipeData.instructions}
                      onChange={e => setRecipeData({ ...recipeData, instructions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="recipe-form-divider" />

                {/* AI Scaling */}
                <div className="recipe-form-section">
                  <label className="recipe-section-label">
                    <Icon name="sparkles" size={16} filter="var(--primary-filter)" />
                    AI Smart Scaling
                  </label>
                  <div className="ai-scaling-info-box">
                    <Icon name="info" size={16} filter="var(--primary-filter)" />
                    <p>Tell visitors what quantity your ingredient list represents. They can then scale it up or down and our AI will recalculate automatically.</p>
                  </div>
                  <div className="recipe-form-group">
                    <label className="recipe-field-label">This recipe makes</label>
                    <div className="base-qty-row">
                      <input
                        type="number"
                        id="baseQty"
                        name="baseQty"
                        min="0.1"
                        step="0.1"
                        className="modern-input base-qty-input"
                        value={recipeData.baseQty}
                        onChange={e => setRecipeData({ ...recipeData, baseQty: e.target.value })}
                        placeholder="4"
                      />
                      <select
                        id="baseUnit"
                        name="baseUnit"
                        className="modern-input base-unit-select"
                        value={recipeData.baseUnit}
                        onChange={e => setRecipeData({ ...recipeData, baseUnit: e.target.value })}
                      >
                        <option value="servings">servings</option>
                        <option value="portions">portions</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-pill primary w-100"
                  disabled={loading}
                  style={{ marginTop: '1.5rem', padding: '0.9rem', fontSize: '1rem' }}
                >
                  {loading ? (
                    <><Icon name="loader" size={18} filter="white" className="ds-spinner" /> Processing...</>
                  ) : isEditing ? (
                    <><Icon name="check" size={18} filter="white" /> Save Changes</>
                  ) : (
                    <><Icon name="upload-cloud" size={18} filter="white" /> Publish Recipe</>
                  )}
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
