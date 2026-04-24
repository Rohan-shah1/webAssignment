import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';

const RecipeFeed = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [category, difficulty]); // Refetch when filters change

  const fetchRecipes = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await API.fetchRecipes(query);
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="section-header">
        <h2>Discover Recipes</h2>
        <div className="header-line"></div>
      </div>

      <div className="search-filter-bar mb-8 p-4 ds-card">
        <form onSubmit={fetchRecipes} className="ds-row">
          <div className="ds-input-group" style={{ flex: '2 1 300px' }}>
            <img 
              src="https://unpkg.com/lucide-static@latest/icons/search.svg" 
              alt="Search" 
              style={{ width: 20, height: 20, filter: 'var(--icon-filter)' }} 
            />
            <input 
              type="text" 
              className="ds-input"
              placeholder="Search by title or ingredients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="ds-select"
            style={{ flex: '1 1 150px' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Dessert">Dessert</option>
            <option value="Other">Other</option>
          </select>

          <select 
            className="ds-select"
            style={{ flex: '1 1 150px' }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button type="submit" className="btn-primary flex-align" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
            <img 
              src="https://unpkg.com/lucide-static@latest/icons/filter.svg" 
              alt="Filter" 
              style={{ width: 18, height: 18, filter: 'invert(1)', marginRight: '8px' }} 
            /> Apply
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8">
          <img 
            src="https://unpkg.com/lucide-static@latest/icons/book-open.svg" 
            alt="No Recipes" 
            style={{ width: 48, height: 48, margin: '0 auto 1rem', filter: 'var(--icon-filter)' }} 
            className="opacity-50"
          />
          <p className="text-secondary">No recipes found matching your criteria.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <Link 
              to={`/recipe/${recipe._id}`} 
              key={recipe._id} 
              className="recipe-card ds-link-card"
            >
              <div className="recipe-img-container">
                <img src={recipe.image || '../../assets/recipe-burger.jpg'} alt={recipe.title} />
                <span className="recipe-difficulty">{recipe.difficulty || 'Medium'}</span>
              </div>
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p className="text-secondary text-sm mb-2">By {recipe.chef?.username || 'Unknown Chef'}</p>
                <div className="recipe-footer mt-4">
                  <span className="recipe-time">🕒 {recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}</span>
                  <span className="btn-pill outline btn-sm">View Recipe</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeFeed;
