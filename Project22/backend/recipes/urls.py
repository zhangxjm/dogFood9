from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IngredientViewSet, RecipeViewSet, FavoriteViewSet,
    MealPlanViewSet, ShoppingListViewSet, SupermarketViewSet,
    NutritionGoalViewSet
)

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'meal-plans', MealPlanViewSet, basename='mealplan')
router.register(r'shopping-lists', ShoppingListViewSet, basename='shoppinglist')
router.register(r'supermarkets', SupermarketViewSet, basename='supermarket')
router.register(r'nutrition-goals', NutritionGoalViewSet, basename='nutritiongoal')

urlpatterns = [
    path('', include(router.urls)),
]
