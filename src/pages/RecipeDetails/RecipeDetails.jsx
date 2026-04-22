import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import './RecipeDetails.css';

// Socket initialization — using same origin for simplicity in local dev
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

const REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

const aggregateReactions = (reactions = []) =>
  reactions.reduce((acc, r) => { 
    acc[r.emoji] = (acc[r.emoji] || 0) + 1; 
    return acc; 
  }, {});

const Icon = ({ name, size = 20, filter = 'var(--icon-filter)', className = "" }) => (
  <img 
    src={`https://unpkg.com/lucide-static@latest/icons/${name}.svg`} 
    alt={name} 
    style={{ width: size, height: size, filter }} 
    className={className}
  />
);

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo: currentUser } = useAuth();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [desiredQty, setDesiredQty] = useState(1);
  const [desiredQtyInput, setDesiredQtyInput] = useState('1');
  const [aiIngredients, setAiIngredients] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setReactionPickerFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await API.fetchRecipeById(id);
        setRecipe(data);
        const initialQty = Number(data.baseQty) > 0 ? Number(data.baseQty) : 1;
        setDesiredQty(initialQty);
        setDesiredQtyInput(String(initialQty));
        setAiIngredients(null);
        setAiError('');

        if (currentUser) {
          const saved = await API.getSavedRecipes();
          setSavedRecipes(saved.map(r => typeof r === 'string' ? r : r._id));
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        toast.error('Recipe not found');
        navigate('/recipes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Join a dedicated room for this recipe to receive real-time updates
    socket.emit('join_recipe', id);
    
    const handleSocketUpdate = (updatedRecipe) => {
      if (updatedRecipe._id === id) {
        setRecipe(updatedRecipe);
      }
    };

    socket.on('recipe_updated', handleSocketUpdate);

    window.scrollTo(0, 0);
    
    return () => {
      socket.off('recipe_updated', handleSocketUpdate);
    };
  }, [id, currentUser, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!recipe) return;
      try {
        setAiLoading(true);
        setAiError('');
        const res = await API.normalizeIngredients(recipe.ingredients, recipe.baseQty || 1, desiredQty || 1);
        setAiIngredients(res.items || []);
      } catch (error) {
        setAiIngredients([]);
        setAiError(error?.message || 'AI could not format ingredients right now.');
      } finally {
        setAiLoading(false);
      }
    };
    run();
  }, [recipe, desiredQty]);

  const handleLike = async () => {
    if (!currentUser) { toast.error('Please login to like recipes'); return; }
    try {
      const likes = await API.likeRecipe(id);
      setRecipe(prev => ({ ...prev, likes }));
    } catch { toast.error('Error liking recipe'); }
  };

  const handleSaveRecipe = async () => {
    if (!currentUser) { toast.error('Please login to save recipes'); return; }
    try {
      const updatedSaved = await API.toggleSavedRecipe(id);
      setSavedRecipes(updatedSaved);
      toast[updatedSaved.includes(id) ? 'success' : 'info'](
        updatedSaved.includes(id) ? 'Recipe bookmarked!' : 'Recipe removed from bookmarks'
      );
    } catch { toast.error('Error saving recipe'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.error('Please login to comment'); return; }
    if (!commentText.trim()) return;
    try {
      const updatedRecipe = await API.addComment(id, commentText);
      setRecipe(updatedRecipe);
      setCommentText('');
      toast.success('Comment added!');
    } catch { toast.error('Error adding comment'); }
  };

  const handleReaction = async (commentId, emoji) => {
    if (!currentUser) { toast.error('Please login to react'); return; }
    try {
      const updatedRecipe = await API.reactToComment(id, commentId, emoji);
      setRecipe(updatedRecipe);
    } catch { toast.error('Error adding reaction'); }
    setReactionPickerFor(null);
  };

  const handleReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const updatedRecipe = await API.replyToComment(id, commentId, replyText);
      setRecipe(updatedRecipe);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted!');
    } catch (err) { toast.error(err.message || 'Error posting reply'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: recipe.title, 
          text: `Check out this recipe for ${recipe.title}!`, 
          url: window.location.href 
        }); 
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="loading-state ds-empty-state container" style={{ minHeight: '60vh' }}>
        <Icon name="chef-hat" size={48} className="ds-spinner" />
        <p>Preparing the signature recipe...</p>
      </div>
    );
  }

  if (!recipe) return <div className="container mt-8 text-center"><h2>Recipe not found</h2></div>;

  const isOwner = currentUser && (currentUser._id === recipe.chef?._id || currentUser._id === recipe.chef);
  const handleQtyInputChange = (e) => {
    const raw = e.target.value;
    // Allow empty during editing so backspace feels natural.
    if (raw === '') {
      setDesiredQtyInput('');
      return;
    }

    // Allow only decimal number input.
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setDesiredQtyInput(raw);

    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      setDesiredQty(parsed);
    }
  };

  const commitQtyInput = () => {
    const parsed = parseFloat(desiredQtyInput);
    if (Number.isFinite(parsed) && parsed > 0) {
      setDesiredQty(parsed);
      setDesiredQtyInput(String(parsed));
      return;
    }

    // Reset invalid/empty input back to current valid quantity.
    setDesiredQtyInput(String(desiredQty));
  };

  return (
    <div className="recipe-details-page">
      <div className="recipe-hero">
        <img src={recipe.image || 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} alt={recipe.title} className="hero-img" />
        <div className="hero-overlay"></div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <Icon name="arrow-left" size={24} filter="white" />
        </button>
      </div>

      <div className="container recipe-container">
        <div className="recipe-header">
          <div className="title-section">
            <span className="recipe-category">{recipe.category}</span>
            <h1>{recipe.title}</h1>
            <div className="chef-info">
              <Link to={`/chef/${recipe.chef?._id}`}>
                {recipe.chef?.profilePicture ? (
                  <img src={recipe.chef.profilePicture} alt={recipe.chef.username} className="chef-avatar" />
                ) : (
                  <div className="chef-avatar-placeholder">
                    <Icon name="chef-hat" size={16} filter="var(--text-secondary)" />
                  </div>
                )}
                <span>By Chef {recipe.chef?.username || 'Unknown'}</span>
              </Link>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className={`btn-action like ${recipe.likes?.includes(currentUser?._id) ? 'active' : ''}`}
              onClick={handleLike}
            >
              <Icon name="heart" size={20} filter={recipe.likes?.includes(currentUser?._id) ? 'var(--toast-error)' : 'var(--icon-filter)'} />
              <span>{recipe.likes?.length || 0}</span>
            </button>
            <button 
              className={`btn-action save ${savedRecipes.includes(id) ? 'active' : ''}`}
              onClick={handleSaveRecipe}
            >
              <Icon name="bookmark" size={20} filter={savedRecipes.includes(id) ? 'var(--primary-color)' : 'var(--icon-filter)'} />
            </button>
            <button className="btn-action share" onClick={handleShare}>
              <Icon name="share-2" size={20} />
            </button>
          </div>
        </div>

        <div className="recipe-stats">
          <div className="stat-item">
            <Icon name="clock" size={20} />
            <div>
              <span className="stat-label">Prep Time</span>
              <span className="stat-value">{recipe.prepTime} min</span>
            </div>
          </div>
          <div className="stat-item">
            <Icon name="bar-chart" size={20} />
            <div>
              <span className="stat-label">Difficulty</span>
              <span className="stat-value">{recipe.difficulty}</span>
            </div>
          </div>
          <div className="stat-item ai-stat">
            <Icon name="sparkles" size={20} filter="var(--primary-filter)" />
            <div>
              <span className="stat-label">AI Intelligence</span>
              <span className="stat-value">Smart Scaling</span>
            </div>
          </div>
        </div>

        <div className="recipe-content-grid">
          <div className="recipe-main">
            <section className="ingredients-section card-box">
              <div className="section-title-alt">
                <h2>Ingredients <span className="ai-badge">AI</span></h2>
                <div className="scaling-control">
                  <span>Scale quantity:</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={desiredQtyInput}
                    onChange={handleQtyInputChange}
                    onBlur={commitQtyInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitQtyInput();
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="1"
                    aria-label="Desired quantity in kilograms"
                  />
                  <span>kg</span>
                </div>
              </div>
              <div className="ingredients-table-head">
                <span>Name</span>
                <span>Quantity</span>
              </div>
              <ul className="ingredients-list">
                {aiIngredients?.map((ing, i) => (
                  <li key={i} className="ingredient-row">
                    <span className="ingredient-name">• {ing?.name || ing?.raw || 'Unknown ingredient'}</span>
                    <span className="ingredient-qty">{ing?.quantityDisplay || 'as needed'}</span>
                  </li>
                ))}
              </ul>
              {aiLoading && (
                <p className="text-secondary text-sm mt-4">AI is analyzing ingredients and quantities...</p>
              )}
              {!aiLoading && aiIngredients?.length === 0 && (
                <p className="text-secondary text-sm mt-4">{aiError || 'AI could not format ingredients. Please check recipe ingredient text.'}</p>
              )}
            </section>

            <section className="instructions-section mt-8 card-box">
              <h2>Instructions</h2>
              <div className="instructions-text">
                {recipe.instructions}
              </div>
            </section>

            <section className="comments-section mt-8 card-box">
              <div className="section-title-alt">
                <h2>Community Feed</h2>
                <span className="count-badge">{recipe.comments?.length || 0}</span>
              </div>

              <form className="comment-input-area" onSubmit={handleComment}>
                <input 
                  type="text" 
                  placeholder={currentUser ? "Share your thoughts..." : "Login to join the discussion"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser}
                />
                <button type="submit" disabled={!currentUser || !commentText.trim()}>
                  <Icon name="send" size={18} filter="white" />
                </button>
              </form>

              <div className="comments-list">
                {!recipe.comments || recipe.comments.length === 0 ? (
                  <div className="empty-comments">
                    <Icon name="message-square" size={40} filter="var(--text-secondary)" />
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  [...recipe.comments].reverse().map((comment) => {
                    const myReaction = currentUser
                      ? comment.reactions?.find(r => r.user === currentUser._id || r.user?._id === currentUser._id)
                      : null;
                    const counts = aggregateReactions(comment.reactions);

                    return (
                      <div key={comment._id} className="comment-card">
                        <div className="comment-header">
                          {comment.profilePicture ? (
                            <img src={comment.profilePicture} alt={comment.username} className="user-avatar" />
                          ) : (
                            <div className="user-avatar-placeholder">{comment.username?.[0] || 'U'}</div>
                          )}
                          <div className="user-meta">
                            <span className="username">{comment.username}</span>
                            <span className="time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <p className="comment-text">{comment.text}</p>

                        <div className="comment-footer">
                          {Object.entries(counts).length > 0 && (
                            <div className="reaction-counts">
                              {Object.entries(counts).map(([emoji, count]) => (
                                <button key={emoji} onClick={() => handleReaction(comment._id, emoji)} className="reaction-badge">
                                  {emoji} {count}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="comment-actions">
                            <div className="reaction-trigger">
                              <button 
                                className={`action-link ${myReaction ? 'has-reacted' : ''}`}
                                onClick={() => setReactionPickerFor(reactionPickerFor === comment._id ? null : comment._id)}
                              >
                                {myReaction ? myReaction.emoji : 'React'}
                              </button>
                              
                              {reactionPickerFor === comment._id && (
                                <div className="reaction-picker" ref={pickerRef} style={{ zIndex: 100 }}>
                                  {REACTIONS.map(emoji => (
                                    <button key={emoji} onClick={() => handleReaction(comment._id, emoji)}>{emoji}</button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {isOwner && (
                              <button 
                                className="action-link reply"
                                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                              >
                                <Icon name="corner-down-right" size={14} className="mr-1" /> Reply
                              </button>
                            )}
                          </div>
                        </div>

                        {comment.replies?.map((reply, ri) => (
                          <div key={ri} className="chef-reply">
                            <div className="reply-header">
                              <span className="chef-badge">CHEF</span>
                              <span className="username">{reply.username}</span>
                            </div>
                            <p>{reply.text}</p>
                          </div>
                        ))}

                        {isOwner && replyingTo === comment._id && (
                          <form className="reply-form" onSubmit={(e) => handleReply(e, comment._id)}>
                            <input 
                              type="text" 
                              placeholder="Write a reply..." 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              autoFocus 
                            />
                            <button type="submit"><Icon name="send" size={14} filter="white" /></button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <aside className="recipe-sidebar">
            <div className="chef-card-box card-box">
              <h3>About the Chef</h3>
              <div className="sidebar-chef-info">
                <img src={recipe.chef?.profilePicture || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'} alt={recipe.chef?.username} />
                <h4>{recipe.chef?.username}</h4>
                <p>{recipe.chef?.bio?.substring(0, 100) || "Professional chef sharing signature recipes."}...</p>
                <Link to={`/chef/${recipe.chef?._id || recipe.chef}`} className="btn-pill outline w-100 mt-4">View Profile</Link>
              </div>
            </div>
            
            <div className="ai-feature-card card-box mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="sparkles" size={24} filter="var(--primary-filter)" />
                <h3 className="m-0">AI Intelligence</h3>
              </div>
              <p className="text-secondary text-sm">
                This recipe features <strong>Smart Ingredient Scaling</strong>. 
                Adjust the quantity in the ingredients section, and our AI will automatically 
                calculate the perfect proportions for you!
              </p>
            </div>

            <div className="tips-card card-box mt-4">
              <h3>Cooking Tips</h3>
              <p className="text-secondary text-sm">
                Ensure all ingredients are at room temperature for the best results. 
                Don't overmix the batter to keep it light and airy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
