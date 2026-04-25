import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import API from '../../api';

const ChefList = ({ isDashboardMode = false }) => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const data = await API.getChefs();
        // Map backend data to frontend model
        const mappedChefs = data.map(chef => ({
          id: chef._id,
          name: chef.username,
          specialty: chef.bio ? (chef.bio.substring(0, 30) + '...') : 'Culinary Expert',
          image: chef.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
          recipesCount: chef.recipesCount || 0
        }));
        setChefs(mappedChefs);
      } catch (error) {
        console.error('Error fetching chefs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChefs();
  }, []);

  return (
    <div className={isDashboardMode ? "dashboard-browse" : "home-page"}>
      {!isDashboardMode && (
        <section className="hero-section">
          <div className="container hero-content text-center">
            <h1>Discover Master Culinary Artists</h1>
            <p>Connect with the world's most renowned chefs, explore their signature recipes, and elevate your cooking journey.</p>
          </div>
        </section>
      )}

      <section className={isDashboardMode ? "py-4" : "container py-8"}>
        <div className="section-header">
          <h2>Featured Chefs</h2>
          <div className="header-line"></div>
        </div>

        {loading ? (
          <div className="loading-state">
            <img 
              src="https://unpkg.com/lucide-static@latest/icons/chef-hat.svg" 
              alt="Loading" 
              className="spinner" 
              style={{ width: 48, height: 48, filter: 'var(--primary-filter)' }} 
            />
            <p>Loading chefs...</p>
          </div>
        ) : (
          <div className="chef-grid">
            {chefs.map(chef => (
              <Link to={`/chef/${chef.id}`} key={chef.id} className="chef-card">
                <div className="chef-image-container">
                  <img src={chef.image} alt={chef.name} className="chef-image" />
                  <div className="chef-overlay">
                    <span className="view-profile">View Profile</span>
                  </div>
                </div>
                <div className="chef-info">
                  <h3>{chef.name}</h3>
                  <p className="specialty">{chef.specialty}</p>
                  <div className="chef-stats">
                    <span className="recipes-count">{chef.recipesCount} Recipes</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChefList;
