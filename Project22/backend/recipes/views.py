from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from .models import (
    Ingredient, Recipe, RecipeIngredient, Favorite,
    MealPlan, ShoppingList, ShoppingListItem, Supermarket, NutritionGoal
)
from .serializers import (
    IngredientSerializer, RecipeListSerializer, RecipeDetailSerializer,
    RecipeCreateSerializer, FavoriteSerializer, MealPlanSerializer,
    ShoppingListSerializer, ShoppingListItemSerializer, SupermarketSerializer,
    NutritionGoalSerializer
)
from .filters import RecipeFilter, IngredientFilter


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    filterset_class = IngredientFilter
    search_fields = ['name']
    ordering_fields = ['name', 'calories', 'price_per_unit']
    pagination_class = StandardResultsSetPagination


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.filter(is_public=True)
    filterset_class = RecipeFilter
    search_fields = ['title', 'description', 'steps']
    ordering_fields = ['created_at', 'cook_time', 'view_count', 'like_count']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            queryset = Recipe.objects.filter(Q(is_public=True) | Q(author=self.request.user))
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RecipeCreateSerializer
        return RecipeDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        recipe = self.get_object()
        recipe.like_count += 1
        recipe.save()
        return Response({'status': 'liked', 'like_count': recipe.like_count})

    @action(detail=False, methods=['get'])
    def popular(self, request):
        recipes = Recipe.objects.filter(is_public=True).order_by('-view_count')[:10]
        serializer = RecipeListSerializer(recipes, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommend(self, request):
        user = request.user
        if not user.is_authenticated:
            recipes = Recipe.objects.filter(is_public=True).order_by('?')[:6]
        else:
            favorites = Favorite.objects.filter(user=user).values_list('recipe__cuisine', flat=True)
            meal_plans = MealPlan.objects.filter(user=user).values_list('recipe__cuisine', flat=True)
            
            preferred_cuisines = list(favorites) + list(meal_plans)
            
            if preferred_cuisines:
                from collections import Counter
                cuisine_counts = Counter(preferred_cuisines)
                top_cuisines = [c[0] for c in cuisine_counts.most_common(3)]
                recipes = Recipe.objects.filter(
                    is_public=True,
                    cuisine__in=top_cuisines
                ).order_by('-view_count')[:6]
            else:
                recipes = Recipe.objects.filter(is_public=True).order_by('?')[:6]
        
        serializer = RecipeListSerializer(recipes, many=True, context={'request': request})
        return Response(serializer.data)


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('recipe')

    def create(self, request, *args, **kwargs):
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {'error': 'recipe_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing = Favorite.objects.filter(user=request.user, recipe_id=recipe_id).first()
        if existing:
            return Response(
                {'error': 'Already favorited'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        favorite = Favorite.objects.create(user=request.user, recipe_id=recipe_id)
        serializer = self.get_serializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response({'error': 'recipe_id is required'}, status=400)
        
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            recipe_id=recipe_id
        )
        
        if not created:
            favorite.delete()
            return Response({'favorited': False})
        
        return Response({'favorited': True, 'id': favorite.id})


class MealPlanViewSet(viewsets.ModelViewSet):
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user).select_related('recipe').order_by('date', 'meal_type')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        plans = MealPlan.objects.filter(
            user=request.user,
            date__range=[start_of_week, end_of_week]
        ).select_related('recipe').order_by('date', 'meal_type')
        
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def nutrition_summary(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            from datetime import datetime
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            plans = MealPlan.objects.filter(user=request.user, date=date).select_related('recipe')
        else:
            today = timezone.now().date()
            plans = MealPlan.objects.filter(user=request.user, date=today).select_related('recipe')
        
        total_nutrition = {
            'calories': 0,
            'protein': 0,
            'fat': 0,
            'carbs': 0,
            'fiber': 0,
            'vitamin_c': 0,
            'calcium': 0,
            'iron': 0,
        }
        
        for plan in plans:
            nutrition = plan.recipe.total_nutrition()
            factor = plan.servings / plan.recipe.servings if plan.recipe.servings else 1
            for key in total_nutrition:
                total_nutrition[key] += nutrition[key] * factor
        
        for key in total_nutrition:
            total_nutrition[key] = round(total_nutrition[key], 2)
        
        return Response(total_nutrition)


class ShoppingListViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user).prefetch_related('items__ingredient')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_from_meal_plan(self, request):
        date_str = request.data.get('date')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        list_name = request.data.get('name', '采购清单')
        
        if date_str:
            from datetime import datetime
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            plans = MealPlan.objects.filter(user=request.user, date=date).select_related('recipe')
        elif start_date and end_date:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            plans = MealPlan.objects.filter(
                user=request.user,
                date__range=[start, end]
            ).select_related('recipe')
        else:
            today = timezone.now().date()
            plans = MealPlan.objects.filter(user=request.user, date=today).select_related('recipe')
        
        ingredient_totals = defaultdict(lambda: {'quantity': 0, 'unit': '克'})
        
        for plan in plans:
            recipe = plan.recipe
            factor = plan.servings / recipe.servings if recipe.servings else 1
            
            for ri in recipe.recipe_ingredients.all():
                ing_id = ri.ingredient_id
                ingredient_totals[ing_id]['quantity'] += ri.quantity * factor
                ingredient_totals[ing_id]['unit'] = ri.unit
                ingredient_totals[ing_id]['ingredient'] = ri.ingredient
        
        shopping_list = ShoppingList.objects.create(user=request.user, name=list_name)
        
        for ing_id, data in ingredient_totals.items():
            ShoppingListItem.objects.create(
                shopping_list=shopping_list,
                ingredient=data['ingredient'],
                quantity=round(data['quantity'], 1),
                unit=data['unit']
            )
        
        serializer = self.get_serializer(shopping_list)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_to_supermarket(self, request, pk=None):
        shopping_list = self.get_object()
        supermarket_id = request.data.get('supermarket_id')
        
        if supermarket_id:
            try:
                supermarket = Supermarket.objects.get(id=supermarket_id)
                shopping_list.supermarket = supermarket
            except Supermarket.DoesNotExist:
                pass
        
        shopping_list.is_sent = True
        shopping_list.sent_at = timezone.now()
        shopping_list.save()
        
        return Response({
            'status': 'sent',
            'message': '购物清单已发送到超市',
            'sent_at': shopping_list.sent_at
        })

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        shopping_list = self.get_object()
        ingredient_id = request.data.get('ingredient_id')
        quantity = request.data.get('quantity', 100)
        unit = request.data.get('unit', '克')
        
        item = ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_id=ingredient_id,
            quantity=quantity,
            unit=unit
        )
        
        serializer = ShoppingListItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SupermarketViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Supermarket.objects.filter(is_active=True)
    serializer_class = SupermarketSerializer
    search_fields = ['name', 'address']
    pagination_class = None

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        latitude = request.query_params.get('lat')
        longitude = request.query_params.get('lng')
        
        supermarkets = Supermarket.objects.filter(is_active=True)
        
        if latitude and longitude:
            try:
                lat = float(latitude)
                lng = float(longitude)
                from django.db.models.functions import Abs
                supermarkets = supermarkets.annotate(
                    lat_diff=Abs('latitude' - lat),
                    lng_diff=Abs('longitude' - lng)
                ).order_by('lat_diff', 'lng_diff')
            except ValueError:
                pass
        
        serializer = self.get_serializer(supermarkets[:5], many=True)
        return Response(serializer.data)


class NutritionGoalViewSet(viewsets.ModelViewSet):
    serializer_class = NutritionGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NutritionGoal.objects.filter(user=self.request.user)

    def get_object(self):
        goal, created = NutritionGoal.objects.get_or_create(user=self.request.user)
        return goal

    @action(detail=False, methods=['get'])
    def progress(self, request):
        goal, _ = NutritionGoal.objects.get_or_create(user=request.user)
        today = timezone.now().date()
        
        plans = MealPlan.objects.filter(user=request.user, date=today).select_related('recipe')
        
        total_nutrition = {
            'calories': 0,
            'protein': 0,
            'fat': 0,
            'carbs': 0,
        }
        
        for plan in plans:
            nutrition = plan.recipe.total_nutrition()
            factor = plan.servings / plan.recipe.servings if plan.recipe.servings else 1
            for key in total_nutrition:
                total_nutrition[key] += nutrition[key] * factor
        
        progress = {
            'calories': {
                'current': round(total_nutrition['calories'], 1),
                'goal': goal.daily_calories,
                'percentage': round(total_nutrition['calories'] / goal.daily_calories * 100, 1) if goal.daily_calories else 0
            },
            'protein': {
                'current': round(total_nutrition['protein'], 1),
                'goal': goal.daily_protein,
                'percentage': round(total_nutrition['protein'] / goal.daily_protein * 100, 1) if goal.daily_protein else 0
            },
            'fat': {
                'current': round(total_nutrition['fat'], 1),
                'goal': goal.daily_fat,
                'percentage': round(total_nutrition['fat'] / goal.daily_fat * 100, 1) if goal.daily_fat else 0
            },
            'carbs': {
                'current': round(total_nutrition['carbs'], 1),
                'goal': goal.daily_carbs,
                'percentage': round(total_nutrition['carbs'] / goal.daily_carbs * 100, 1) if goal.daily_carbs else 0
            },
        }
        
        return Response(progress)
