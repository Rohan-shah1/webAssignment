import axios from 'axios';

// ── Axios Instance ────────────────────────────────────────────────────────────
// Centralised base URL — reads from .env (VITE_API_URL) or falls back to /api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Before every outgoing request, read the JWT from localStorage and attach it.
// This replaces the per-function token injection in the old fetchWithAuth wrapper.
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo?.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }

    // If we're sending FormData, remove the default Content-Type so that
    // the browser can set the correct multipart boundary automatically.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// Unwrap the response so callers get `data` directly (same as old fetchWithAuth).
// On error, extract the server's message and re-throw a clean Error object.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── Auth APIs ─────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (userData) =>
  api.post('/auth/register', userData);

export const getProfile = () =>
  api.get('/auth/profile');

export const updateProfile = (userData) =>
  api.put('/auth/profile', userData);

export const resendOtp = (email) =>
  api.post('/auth/resend-otp', { email });

export const verifyEmailOtp = (email, otp, role) =>
  api.post('/auth/verify-email-otp', { email, otp, role });

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const verifyResetOtp = (email, otp) =>
  api.post('/auth/verify-reset-otp', { email, otp });

export const resetPassword = (email, otp, newPassword) =>
  api.post('/auth/reset-password', { email, otp, newPassword });

export const googleAuth = (token) =>
  api.post('/auth/google', { idToken: token });

export const verifyGoogleOtp = (email, otp, role) =>
  api.post('/auth/google/verify-otp', { email, otp, role });

export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/change-password', { currentPassword, newPassword });

// ── User / Chef APIs ──────────────────────────────────────────────────────────
export const getChefs = () =>
  api.get('/users/chefs');

export const getChefDetails = (id) =>
  api.get(`/users/chefs/${id}`);

export const getFollowedChefs = () =>
  api.get('/users/followed-chefs');

export const toggleFollowChef = (id) =>
  api.put(`/users/followed-chefs/${id}`);

// ── Recipe APIs ───────────────────────────────────────────────────────────────
export const fetchRecipes = (query = '') =>
  api.get(`/recipes${query}`);

export const fetchRecipeById = (id) =>
  api.get(`/recipes/${id}`);

export const createRecipe = (recipeData) =>
  api.post('/recipes', recipeData);

export const updateRecipe = (id, recipeData) =>
  api.put(`/recipes/${id}`, recipeData);

export const deleteRecipe = (id, data) =>
  api.delete(`/recipes/${id}`, { data });

export const likeRecipe = (id) =>
  api.put(`/recipes/${id}/like`);

export const addComment = (id, text) =>
  api.post(`/recipes/${id}/comment`, { text });

export const reactToComment = (id, commentId, emoji) =>
  api.put(`/recipes/${id}/comment/${commentId}/react`, { emoji });

export const replyToComment = (id, commentId, text) =>
  api.post(`/recipes/${id}/comment/${commentId}/reply`, { text });

// ── Saved Recipes ─────────────────────────────────────────────────────────────
export const getSavedRecipes = () =>
  api.get('/users/saved-recipes');

export const toggleSavedRecipe = (id) =>
  api.put(`/users/saved-recipes/${id}`);

// ── Admin APIs ────────────────────────────────────────────────────────────────
export const adminGetUsers = () =>
  api.get('/admin/users');

export const adminDeleteUser = (id) =>
  api.delete(`/admin/users/${id}`);

export const adminGetRecipes = () =>
  api.get('/admin/recipes');

export const adminUpdateProfile = (userData) =>
  api.put('/admin/profile', userData);

// ── AI Ingredient Scaling ─────────────────────────────────────────────────────
export const normalizeIngredients = (ingredients, baseQty = 1, desiredQty = 1) =>
  api.post('/ingredients/normalize', { ingredients, baseQty, desiredQty });

// ── Default Export ────────────────────────────────────────────────────────────
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
