// Centralized API Base URL configuration
// Using Vite's env variables for flexibility between dev and production
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom Fetch Wrapper
 * This function handles common API tasks like:
 * 1. Attaching the JWT token from localStorage for authenticated requests.
 * 2. Setting correct Content-Type headers.
 * 3. Handling both JSON and FormData (for image uploads).
 * 4. Centralized error handling.
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  // Pull user info (including the token) from persistent storage
  const userInfo = localStorage.getItem('userInfo') 
    ? JSON.parse(localStorage.getItem('userInfo')) 
    : null;

  const headers = {
    ...options.headers,
  };

  /**
   * Header Management
   * Important: We don't set 'Content-Type' if the body is FormData.
   * The browser needs to set the 'boundary' string itself for file uploads to work.
   */
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // If a user is logged in, attach their token to the 'Authorization' header
  if (userInfo && userInfo.token) {
    headers.Authorization = `Bearer ${userInfo.token}`;
  }

  // Debug log to keep track of network activity during development
  console.log(`API Call: ${options.method || 'GET'} ${BASE_URL}${endpoint}`);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Handle non-2xx status codes globally
  if (!response.ok) {
    throw new Error(data.message || 'An unexpected error occurred during the API call.');
  }

  return data;
};

// --- Auth APIs --- //
export const login = (email, password) => 
  fetchWithAuth('/auth/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password }) 
  });

export const register = (userData) => 
  fetchWithAuth('/auth/register', { 
    method: 'POST', 
    body: JSON.stringify(userData) 
  });

export const getProfile = () => fetchWithAuth('/auth/profile');
export const updateProfile = (userData) => 
  fetchWithAuth('/auth/profile', { 
    method: 'PUT', 
    body: userData // This can be FormData or JSON
  });

export const resendOtp = (email) => 
  fetchWithAuth('/auth/resend-otp', { 
    method: 'POST', 
    body: JSON.stringify({ email }) 
  });

export const verifyEmailOtp = (email, otp, role) => 
  fetchWithAuth('/auth/verify-otp', { 
    method: 'POST', 
    body: JSON.stringify({ email, otp, role }) 
  });

export const forgotPassword = (email) => 
  fetchWithAuth('/auth/forgot-password', { 
    method: 'POST', 
    body: JSON.stringify({ email }) 
  });

export const verifyResetOtp = (email, otp) => 
  fetchWithAuth('/auth/verify-reset-otp', { 
    method: 'POST', 
    body: JSON.stringify({ email, otp }) 
  });

export const resetPassword = (email, otp, newPassword) => 
  fetchWithAuth('/auth/reset-password', { 
    method: 'POST', 
    body: JSON.stringify({ email, otp, newPassword }) 
  });

export const googleAuth = (token) => 
  fetchWithAuth('/auth/google', { 
    method: 'POST', 
    body: JSON.stringify({ idToken: token }) 
  });

export const verifyGoogleOtp = (email, otp, role) => 
  fetchWithAuth('/auth/google/verify-otp', { 
    method: 'POST', 
    body: JSON.stringify({ email, otp, role }) 
  });

export const changePassword = (currentPassword, newPassword) => 
  fetchWithAuth('/auth/change-password', { 
    method: 'PUT', 
    body: JSON.stringify({ currentPassword, newPassword }) 
  });

// User/Chef APIs
export const getChefs = () => fetchWithAuth('/users/chefs');
export const getChefDetails = (id) => fetchWithAuth(`/users/chefs/${id}`);
export const getFollowedChefs = () => fetchWithAuth('/users/followed-chefs');
export const toggleFollowChef = (id) => fetchWithAuth(`/users/followed-chefs/${id}`, { method: 'PUT' });

// --- Recipe APIs --- //
export const fetchRecipes = (query = '') => fetchWithAuth(`/recipes${query}`);
export const fetchRecipeById = (id) => fetchWithAuth(`/recipes/${id}`);
export const createRecipe = (recipeData) => 
  fetchWithAuth('/recipes', { 
    method: 'POST', 
    body: recipeData instanceof FormData ? recipeData : JSON.stringify(recipeData)
  });

export const updateRecipe = (id, recipeData) => 
  fetchWithAuth(`/recipes/${id}`, { 
    method: 'PUT', 
    body: recipeData instanceof FormData ? recipeData : JSON.stringify(recipeData) 
  });

export const deleteRecipe = (id, data) => 
  fetchWithAuth(`/recipes/${id}`, { 
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined
  });

export const likeRecipe = (id) => 
  fetchWithAuth(`/recipes/${id}/like`, { method: 'PUT' });

export const addComment = (id, text) => 
  fetchWithAuth(`/recipes/${id}/comment`, { 
    method: 'POST', 
    body: JSON.stringify({ text }) 
  });

export const reactToComment = (id, commentId, emoji) => 
  fetchWithAuth(`/recipes/${id}/comment/${commentId}/react`, { 
    method: 'PUT', 
    body: JSON.stringify({ emoji }) 
  });

export const replyToComment = (id, commentId, text) => 
  fetchWithAuth(`/recipes/${id}/comment/${commentId}/reply`, { 
    method: 'POST', 
    body: JSON.stringify({ text }) 
  });

export const getSavedRecipes = () => fetchWithAuth('/users/saved-recipes');
export const toggleSavedRecipe = (id) => 
  fetchWithAuth(`/users/saved-recipes/${id}`, { method: 'PUT' });

// Admin APIs
export const adminGetUsers = () => fetchWithAuth('/admin/users');
export const adminDeleteUser = (id) => fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
export const adminGetRecipes = () => fetchWithAuth('/admin/recipes');
export const adminUpdateProfile = (userData) => 
  fetchWithAuth('/admin/profile', { 
    method: 'PUT', 
    body: userData 
  });

// Ingredients (optional AI normalization)
export const normalizeIngredients = (ingredients, baseQty = 1, desiredQty = 1) =>
  fetchWithAuth('/ingredients/normalize', {
    method: 'POST',
    body: JSON.stringify({ ingredients, baseQty, desiredQty }),
  });

const API = {
  login,
  register,
  getProfile,
  updateProfile,
  getChefs,
  getChefDetails,
  getFollowedChefs,
  toggleFollowChef,
  fetchRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  addComment,
  reactToComment,
  replyToComment,
  getSavedRecipes,
  toggleSavedRecipe,
  resendOtp,
  verifyEmailOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleAuth,
  verifyGoogleOtp,
  changePassword,
  adminGetUsers,
  adminDeleteUser,
  adminGetRecipes,
  adminUpdateProfile,
  normalizeIngredients,
};

export default API;
