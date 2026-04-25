import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ChefProfile.css';

import API from '../../api';
import { useAuth } from '../../context/AuthContext';

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const ChefProfile = () => {
  const { id } = useParams();
  const { userInfo } = useAuth();
  const [chef, setChef] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChef = async () => {
      try {
        setLoading(true);
        const [data, followedChefs] = await Promise.all([
          API.getChefDetails(id),
          userInfo ? API.getFollowedChefs() : Promise.resolve([]),
        ]);
        const followedIds = Array.isArray(followedChefs) ? followedChefs.map((c) => c._id) : [];
        
        setChef({
          id: data.chef._id,
          name: data.chef.username,
          specialty: data.chef.bio ? (data.chef.bio.split('.')[0]) : 'Master Culinary Artist',
          location: data.chef.address || 'Global',
          bio: data.chef.bio || 'Professional chef sharing the art of fine dining and signature recipes on RecipeNest.',
          coverImage: data.chef.coverPhoto || 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
          profileImage: data.chef.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
          followersCount: data.followersCount || 0,
          recipes: data.recipes.map(r => ({
            _id: r._id,
            title: r.title,
            image: r.image || 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            time: r.prepTime ? `${r.prepTime} min` : 'Check directions',
            difficulty: r.difficulty || 'Medium',
            category: r.category || 'Other',
            description: r.instructions || ''
          }))
        });
        setIsFollowing(followedIds.includes(data.chef._id));
      } catch (error) {
        console.error('Error fetching chef details:', error);
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchChef();
  }, [id, userInfo]);

  const handleToggleFollow = async () => {
    if (!userInfo) {
      toast.info('Please login to follow chefs');
      return;
    }
    if (userInfo._id === chef?.id) {
      toast.info('You cannot follow yourself');
      return;
    }

    try {
      setFollowLoading(true);
      const data = await API.toggleFollowChef(chef.id);
      setIsFollowing(Boolean(data.isFollowing));
      setChef((prev) => prev ? { ...prev, followersCount: data.followersCount } : prev);
      toast.success(data.isFollowing ? `You are now following ${chef.name}` : `Unfollowed ${chef.name}`);
    } catch (error) {
      toast.error(error.message || 'Unable to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state container" style={{ minHeight: '60vh' }}>
        <Icon name="chef-hat" size={48} filter="var(--primary-filter)" className="spinner" />
        <p>Loading chef profile...</p>
      </div>
    );
  }

  if (!chef) return <div className="container mt-8 text-center"><h2>Chef not found</h2></div>;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <img src={chef.coverImage} alt="Cover" className="cover-image" />
        <div className="hero-overlay"></div>
      </div>

      <div className="container profile-container">
        <div className="profile-sidebar">
          <img src={chef.profileImage} alt={chef.name} className="profile-avatar" />
          <h1 className="profile-name">{chef.name}</h1>
          <p className="profile-specialty">{chef.specialty}</p>
          
          <div className="profile-meta">
            <p><Icon name="map-pin" size={18} className="mr-2" /> {chef.location}</p>
            <p><Icon name="book-open" size={18} className="mr-2" /> {chef.recipes.length} Recipes published</p>
            <p><Icon name="users" size={18} className="mr-2" /> {chef.followersCount} Followers</p>
          </div>

          {userInfo?._id !== chef.id && (
            <button
              className={`btn-pill ${isFollowing ? 'outline' : 'primary'} w-100 mt-6`}
              onClick={handleToggleFollow}
              disabled={followLoading}
            >
              {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow Chef'}
            </button>
          )}
        </div>

        <div className="profile-content">
          <section className="about-section">
            <h2>About Me</h2>
            <div className="header-line-sm"></div>
            <p className="bio-text">{chef.bio}</p>
          </section>

          <section className="portfolio-section mt-8">
            <h2>Recipe Portfolio</h2>
            <div className="header-line-sm"></div>
            
            <div className="recipe-grid">
              {chef.recipes.map(recipe => (
                <Link 
                  to={`/recipe/${recipe._id}`} 
                  key={recipe._id} 
                  className="recipe-card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="recipe-img-container">
                    <img src={recipe.image} alt={recipe.title} />
                    <span className="recipe-difficulty">{recipe.difficulty}</span>
                  </div>
                  <div className="recipe-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3>{recipe.title}</h3>
                    <p className="recipe-desc">{recipe.description.substring(0, 60)}...</p>
                    <div className="recipe-footer mt-auto pt-4">
                      <span className="recipe-time">🕒 {recipe.time}</span>
                      <span className="btn-pill outline btn-sm">View Recipe</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChefProfile;
