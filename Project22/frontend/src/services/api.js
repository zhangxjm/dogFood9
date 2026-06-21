import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const recipeApi = {
  getRecipes: (params) => api.get('/recipes/', { params }),
  getRecipe: (id) => api.get(`/recipes/${id}/`),
  createRecipe: (data) => api.post('/recipes/', data),
  likeRecipe: (id) => api.post(`/recipes/${id}/like/`),
  getPopularRecipes: () => api.get('/recipes/popular/'),
  getRecommendRecipes: () => api.get('/recipes/recommend/'),
};

export const ingredientApi = {
  getIngredients: (params) => api.get('/ingredients/', { params }),
  getIngredient: (id) => api.get(`/ingredients/${id}/`),
};

export const favoriteApi = {
  getFavorites: () => api.get('/favorites/'),
  addFavorite: (recipeId) => api.post('/favorites/', { recipe_id: recipeId }),
  toggleFavorite: (recipeId) => api.post('/favorites/toggle/', { recipe_id: recipeId }),
  removeFavorite: (id) => api.delete(`/favorites/${id}/`),
};

export const mealPlanApi = {
  getMealPlans: (params) => api.get('/meal-plans/', { params }),
  addMealPlan: (data) => api.post('/meal-plans/', data),
  updateMealPlan: (id, data) => api.put(`/meal-plans/${id}/`, data),
  deleteMealPlan: (id) => api.delete(`/meal-plans/${id}/`),
  getWeeklyPlans: () => api.get('/meal-plans/weekly/'),
  getNutritionSummary: (date) => api.get('/meal-plans/nutrition_summary/', { params: { date } }),
};

export const shoppingListApi = {
  getShoppingLists: () => api.get('/shopping-lists/'),
  getShoppingList: (id) => api.get(`/shopping-lists/${id}/`),
  createShoppingList: (data) => api.post('/shopping-lists/', data),
  generateFromMealPlan: (data) => api.post('/shopping-lists/generate_from_meal_plan/', data),
  sendToSupermarket: (id, supermarketId) => api.post(`/shopping-lists/${id}/send_to_supermarket/`, { supermarket_id: supermarketId }),
  addItem: (id, data) => api.post(`/shopping-lists/${id}/add_item/`, data),
};

export const supermarketApi = {
  getSupermarkets: () => api.get('/supermarkets/'),
  getNearbySupermarkets: (lat, lng) => api.get('/supermarkets/nearby/', { params: { lat, lng } }),
};

export const nutritionGoalApi = {
  getGoal: () => api.get('/nutrition-goals/1/'),
  updateGoal: (data) => api.put('/nutrition-goals/1/', data),
  getProgress: () => api.get('/nutrition-goals/progress/'),
};

export default api;
