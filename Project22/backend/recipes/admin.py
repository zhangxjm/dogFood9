from django.contrib import admin
from .models import (
    Ingredient, Recipe, RecipeIngredient, Favorite,
    MealPlan, ShoppingList, ShoppingListItem, Supermarket, NutritionGoal
)


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'calories', 'price_per_unit']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'cuisine', 'difficulty', 'cook_time', 'author', 'created_at', 'view_count']
    list_filter = ['cuisine', 'difficulty', 'is_public']
    search_fields = ['title', 'description']
    inlines = [RecipeIngredientInline]


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = ['recipe', 'ingredient', 'quantity', 'unit']
    list_filter = ['recipe', 'ingredient']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'created_at']
    list_filter = ['user', 'created_at']


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'meal_type', 'recipe', 'servings']
    list_filter = ['user', 'date', 'meal_type']


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'created_at', 'is_sent']
    list_filter = ['user', 'is_sent', 'created_at']


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = ['shopping_list', 'ingredient', 'quantity', 'unit', 'is_purchased']
    list_filter = ['is_purchased']


@admin.register(Supermarket)
class SupermarketAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'phone', 'is_active', 'delivery_radius']
    list_filter = ['is_active']
    search_fields = ['name', 'address']


@admin.register(NutritionGoal)
class NutritionGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'daily_calories', 'daily_protein', 'daily_fat', 'daily_carbs']
    list_filter = ['user']
