import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ChefHat, Instagram, Twitter, Mail, BookOpen, Heart, MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import './ChefProfile.css';

import API from '../../api';

const ChefProfile = () => {
  const { id } = useParams();
  const [chef, setChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRecipe, setActiveRecipe] = useState(null); // For "Read More" modal
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('userInfo')));

  const handleLike = async (recipeId) => {
    if (!currentUser) {
      toast.error('Please login to like recipes');
      return;
    }
    try {
      const likes = await API.likeRecipe(recipeId);
      // Update local state for the active recipe
      setActiveRecipe({ ...activeRecipe, likes });
    } catch (error) {
      toast.error('Error liking recipe');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      const comments = await API.addComment(activeRecipe.id, commentText);
      setActiveRecipe({ ...activeRecipe, comments });
      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Error adding comment');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeRecipe.title,
          text: `Check out this recipe for ${activeRecipe.title}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownloadPDF = () => {
    if (!activeRecipe) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(activeRecipe.title, 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Difficulty: ${activeRecipe.difficulty} | Prep Time: ${activeRecipe.time} | Category: ${activeRecipe.category}`, 20, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Ingredients:", 20, 45);
    doc.setFont("helvetica", "normal");
    let y = 55;
    activeRecipe.ingredients.forEach((ing) => {
      doc.text(`- ${ing}`, 25, y);
      y += 8;
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Instructions:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 10;
    const splitInstructions = doc.splitTextToSize(activeRecipe.description, 170);
    doc.text(splitInstructions, 20, y);

    doc.save(`${activeRecipe.title.replace(/\s+/g, '_')}_Recipe.pdf`);
    toast.success('PDF Downloaded');
  };

  useEffect(() => {
    const fetchChef = async () => {
      try {
        setLoading(true);
        const data = await API.getChefDetails(id);
        
        // Map backend data to frontend details
        setChef({
          id: data.chef._id,
          name: data.chef.username,
          specialty: 'Executive Chef', // Can be refined
          location: 'Global', // placeholder
          bio: data.chef.bio || 'Professional chef sharing the art of fine dining and signature recipes on RecipeNest.',
          coverImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
          profileImage: data.chef.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
          recipes: data.recipes.map(r => ({
            id: r._id,
            title: r.title,
            image: r.image || 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            time: r.prepTime ? `${r.prepTime} min` : 'Check directions',
            difficulty: r.difficulty || 'Medium',
            category: r.category || 'Other',
            description: r.instructions,
            ingredients: r.ingredients,
            likes: r.likes || [],
            comments: r.comments || []
          }))
        });
      } catch (error) {
        console.error('Error fetching chef details:', error);
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    fetchChef();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state container" style={{ minHeight: '60vh' }}>
        <ChefHat className="spinner" size={48} color="var(--primary-color)" />
        <p>Loading chef profile...</p>
      </div>
    );
  }

  if (!chef) return <div className="container mt-8 text-center"><h2>Chef not found</h2></div>;

  return (
    <div className="profile-page">
      {/* Profile Header */}
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
            <p><MapPin size={18} /> {chef.location}</p>
            <p><BookOpen size={18} /> {chef.recipes.length} Recipes published</p>
          </div>

          <div className="profile-socials">
            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="Email"><Mail size={20} /></a>
          </div>
          
          <button className="btn-primary w-100 mt-4">Follow Chef</button>
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
                <div key={recipe.id} className="recipe-card">
                  <div className="recipe-img-container">
                    <img src={recipe.image} alt={recipe.title} />
                    <span className="recipe-difficulty">{recipe.difficulty}</span>
                  </div>
                  <div className="recipe-info">
                    <h3>{recipe.title}</h3>
                    <p className="recipe-desc">{recipe.description.substring(0, 60)}...</p>
                    <div className="recipe-footer">
                      <span className="recipe-time">🕒 {recipe.time}</span>
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => setActiveRecipe(recipe)}
                      >
                        Read More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Recipe Modal (Read More feature) */}
      {activeRecipe && (
        <div className="modal-backdrop" onClick={() => setActiveRecipe(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveRecipe(null)}>&times;</button>
            <img src={activeRecipe.image} alt={activeRecipe.title} className="modal-img" />
            <div className="modal-body">
              <h2>{activeRecipe.title}</h2>
              <div className="modal-meta mb-4">
                <span className="badge">{activeRecipe.difficulty}</span>
                <span>⏱️ {activeRecipe.time}</span>
              </div>
              <p className="mb-4">{activeRecipe.description}</p>
              <h4>Ingredients</h4>
              <ul className="mb-4">
                {activeRecipe.ingredients && activeRecipe.ingredients.map((ing, index) => (
                  <li key={index}>{ing}</li>
                ))}
              </ul>
              <h4>Instructions</h4>
              <div className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                {activeRecipe.description}
              </div>
              <div className="modal-interactions mt-8">
                <div className="interaction-counts mb-4 flex-align">
                  <button 
                    className={`btn-icon ${activeRecipe.likes.includes(currentUser?._id) ? 'text-danger' : ''}`}
                    onClick={() => handleLike(activeRecipe.id)}
                  >
                    <Heart size={24} fill={activeRecipe.likes.includes(currentUser?._id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className="ml-2 font-bold">{activeRecipe.likes.length} Likes</span>
                  
                  <div className="ml-8 flex-align">
                    <MessageSquare size={24} className="text-secondary" />
                    <span className="ml-2 font-bold">{activeRecipe.comments.length} Comments</span>
                  </div>
                </div>

                <div className="comment-section">
                  <h4>Comments</h4>
                  <div className="comment-list mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {activeRecipe.comments.map((c, i) => (
                      <div key={i} className="comment-item mb-2 p-2 bg-light rounded">
                        <p className="font-bold text-sm mb-1">{c.username}</p>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    ))}
                    {activeRecipe.comments.length === 0 && <p className="text-secondary text-sm italic">No comments yet. Be the first!</p>}
                  </div>

                  <form className="comment-form flex" onSubmit={handleComment}>
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="form-control mr-2"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                    />
                    <button type="submit" className="btn-primary p-2"><Send size={18} /></button>
                  </form>
                </div>
              </div>

              <div className="modal-actions mt-8">
                <button className="btn-primary" onClick={handleDownloadPDF}>Download PDF</button>
                <button className="btn-outline" onClick={handleShare}>Share Recipe</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefProfile;
