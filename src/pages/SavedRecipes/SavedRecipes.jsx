import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import './SavedRecipes.css';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const SavedRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const data = await API.getSavedRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Error fetching saved recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await API.toggleSavedRecipe(id);
      setRecipes(prev => prev.filter(r => r._id !== id));
    } catch (error) {
      console.error('Error unsaving recipe:', error);
    }
  };

  return (
    <div className="container py-8">
      <div className="section-header">
        <h1>Your Recipe Book</h1>
        <p className="text-secondary">All the treasures you've saved to cook later.</p>
        <div className="header-line"></div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary">Opening your book...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state text-center py-12">
          <Icon name="book-open" size={64} filter="var(--text-secondary)" opacity={0.3} />
          <h2 className="mt-4">Your book is empty</h2>
          <p className="text-secondary mb-8">Start exploring and save your first recipe to see it here!</p>
          <Link to="/recipes" className="btn-primary">Browse Recipes</Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <div key={recipe._id} className="recipe-card">
              <Link to={`/recipe/${recipe._id}`} className="recipe-card-link">
                <div className="recipe-img-container">
                  <img src={recipe.image || 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} alt={recipe.title} />
                  <button className="unsave-btn" onClick={(e) => handleUnsave(e, recipe._id)} title="Remove from saved">
                    <Icon name="bookmark" size={18} filter="white" />
                  </button>
                </div>
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p className="text-secondary text-sm">By {recipe.chef?.username || 'Unknown Chef'}</p>
                  <div className="recipe-footer mt-4">
                    <span className="recipe-time">🕒 {recipe.prepTime} min</span>
                    <span className="view-link text-sm">View Details →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
