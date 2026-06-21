import django_filters
from .models import Recipe, Ingredient


class RecipeFilter(django_filters.FilterSet):
    cuisine = django_filters.CharFilter(lookup_expr='exact')
    difficulty = django_filters.CharFilter(lookup_expr='exact')
    cook_time_min = django_filters.NumberFilter(field_name='cook_time', lookup_expr='gte')
    cook_time_max = django_filters.NumberFilter(field_name='cook_time', lookup_expr='lte')
    ingredient = django_filters.CharFilter(method='filter_by_ingredient')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    class Meta:
        model = Recipe
        fields = ['cuisine', 'difficulty', 'is_public']

    def filter_by_ingredient(self, queryset, name, value):
        return queryset.filter(
            recipe_ingredients__ingredient__name__icontains=value
        ).distinct()


class IngredientFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='exact')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Ingredient
        fields = ['category']
