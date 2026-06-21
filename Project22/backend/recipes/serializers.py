from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Ingredient, Recipe, RecipeIngredient, Favorite,
    MealPlan, ShoppingList, ShoppingListItem, Supermarket, NutritionGoal
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class IngredientSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Ingredient
        fields = '__all__'


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    ingredient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'ingredient_id', 'quantity', 'unit']


class RecipeListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    cuisine_name = serializers.CharField(source='get_cuisine_display', read_only=True)
    difficulty_name = serializers.CharField(source='get_difficulty_display', read_only=True)
    total_calories = serializers.FloatField(read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'cuisine', 'cuisine_name',
            'difficulty', 'difficulty_name', 'cook_time', 'servings',
            'image', 'author', 'created_at', 'total_calories',
            'view_count', 'like_count', 'is_public', 'is_favorited'
        ]

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, recipe=obj).exists()
        return False


class RecipeDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    cuisine_name = serializers.CharField(source='get_cuisine_display', read_only=True)
    difficulty_name = serializers.CharField(source='get_difficulty_display', read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    total_nutrition = serializers.DictField(read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'cuisine', 'cuisine_name',
            'difficulty', 'difficulty_name', 'cook_time', 'servings',
            'image', 'steps', 'author', 'created_at', 'updated_at',
            'recipe_ingredients', 'total_nutrition', 'view_count',
            'like_count', 'is_public', 'is_favorited'
        ]

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, recipe=obj).exists()
        return False


class RecipeCreateSerializer(serializers.ModelSerializer):
    ingredients_data = RecipeIngredientSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'cuisine', 'difficulty', 'cook_time',
            'servings', 'image', 'steps', 'is_public', 'ingredients_data'
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients_data', [])
        recipe = Recipe.objects.create(**validated_data)
        for ing_data in ingredients_data:
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient_id=ing_data['ingredient_id'],
                quantity=ing_data.get('quantity', 100),
                unit=ing_data.get('unit', '克')
            )
        return recipe


class FavoriteSerializer(serializers.ModelSerializer):
    recipe = RecipeListSerializer(read_only=True)
    recipe_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'recipe', 'recipe_id', 'created_at']


class MealPlanSerializer(serializers.ModelSerializer):
    recipe = RecipeListSerializer(read_only=True)
    recipe_id = serializers.IntegerField(write_only=True)
    meal_type_name = serializers.CharField(source='get_meal_type_display', read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'date', 'meal_type', 'meal_type_name', 'recipe', 'recipe_id', 'servings', 'notes']


class ShoppingListItemSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)

    class Meta:
        model = ShoppingListItem
        fields = ['id', 'ingredient', 'quantity', 'unit', 'is_purchased']


class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, read_only=True)
    total_price = serializers.FloatField(read_only=True)

    class Meta:
        model = ShoppingList
        fields = ['id', 'name', 'created_at', 'is_sent', 'sent_at', 'supermarket', 'items', 'total_price']


class SupermarketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supermarket
        fields = '__all__'


class NutritionGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields = '__all__'
