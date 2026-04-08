import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen } from 'lucide-react';
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

      <div className="search-filter-bar mb-8 p-4 bg-light rounded" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--card-shadow)' }}>
        <form onSubmit={fetchRecipes} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 0.5rem' }}>
            <Search size={20} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Search by title or ingredients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.5rem', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }}
          >
            <option value="">All Categories</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Dessert">Dessert</option>
            <option value="Other">Other</option>
          </select>

          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button type="submit" className="btn-primary flex-align">
            <Filter size={18} className="mr-2" /> Apply
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen size={48} className="mx-auto mb-4 text-secondary opacity-50" />
          <p className="text-secondary">No recipes found matching your criteria.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <div key={recipe._id} className="recipe-card">
              <div className="recipe-img-container">
                <img src={recipe.image || 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} alt={recipe.title} />
                <span className="recipe-difficulty">{recipe.difficulty || 'Medium'}</span>
              </div>
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p className="text-secondary text-sm mb-2">By {recipe.chef?.username || 'Unknown Chef'}</p>
                <div className="recipe-footer mt-4">
                  <span className="recipe-time">🕒 {recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}</span>
                  {/* Reuse the ChefProfile logic to Read More, or just link to the Chef Profile */}
                  <Link to={`/chef/${recipe.chef?._id}`} className="btn-outline btn-sm">View Chef</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeFeed;
