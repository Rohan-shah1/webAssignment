const BASE_URL = 'http://localhost:5000/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  const userInfo = localStorage.getItem('userInfo') 
    ? JSON.parse(localStorage.getItem('userInfo')) 
    : null;

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type if the body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (userInfo && userInfo.token) {
    headers.Authorization = `Bearer ${userInfo.token}`;
  }

  console.log(`API Request: ${options.method || 'GET'} ${BASE_URL}${endpoint}`);
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth APIs
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

// User/Chef APIs
export const getChefs = () => fetchWithAuth('/users/chefs');
export const getChefDetails = (id) => fetchWithAuth(`/users/chefs/${id}`);

// Recipe APIs
export const fetchRecipes = () => fetchWithAuth('/recipes');
export const fetchRecipeById = (id) => fetchWithAuth(`/recipes/${id}`);
export const createRecipe = (recipeData) => 
  fetchWithAuth('/recipes', { 
    method: 'POST', 
    body: JSON.stringify(recipeData) 
  });

export const updateRecipe = (id, recipeData) => 
  fetchWithAuth(`/recipes/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(recipeData) 
  });

export const deleteRecipe = (id) => 
  fetchWithAuth(`/recipes/${id}`, { method: 'DELETE' });

export const likeRecipe = (id) => 
  fetchWithAuth(`/recipes/${id}/like`, { method: 'PUT' });

export const addComment = (id, text) => 
  fetchWithAuth(`/recipes/${id}/comment`, { 
    method: 'POST', 
    body: JSON.stringify({ text }) 
  });

// Admin APIs
export const adminGetUsers = () => fetchWithAuth('/admin/users');
export const adminDeleteUser = (id) => fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
export const adminGetRecipes = () => fetchWithAuth('/admin/recipes');
export const adminUpdateProfile = (userData) => 
  fetchWithAuth('/admin/profile', { 
    method: 'PUT', 
    body: userData 
  });

const API = {
  login,
  register,
  getProfile,
  updateProfile,
  getChefs,
  getChefDetails,
  fetchRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  addComment,
  adminGetUsers,
  adminDeleteUser,
  adminGetRecipes,
  adminUpdateProfile,
};

export default API;
