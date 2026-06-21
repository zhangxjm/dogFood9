from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Ingredient(models.Model):
    CATEGORY_CHOICES = [
        ('vegetable', '蔬菜'),
        ('fruit', '水果'),
        ('meat', '肉类'),
        ('seafood', '海鲜'),
        ('dairy', '乳制品'),
        ('grain', '谷物'),
        ('seasoning', '调料'),
        ('other', '其他'),
    ]

    name = models.CharField('食材名称', max_length=100, unique=True)
    category = models.CharField('分类', max_length=20, choices=CATEGORY_CHOICES, default='other')
    unit = models.CharField('单位', max_length=20, default='克')
    
    calories = models.FloatField('热量(kcal)', default=0)
    protein = models.FloatField('蛋白质(g)', default=0)
    fat = models.FloatField('脂肪(g)', default=0)
    carbs = models.FloatField('碳水化合物(g)', default=0)
    fiber = models.FloatField('膳食纤维(g)', default=0)
    vitamin_c = models.FloatField('维生素C(mg)', default=0)
    calcium = models.FloatField('钙(mg)', default=0)
    iron = models.FloatField('铁(mg)', default=0)
    
    image = models.ImageField('图片', upload_to='ingredients/', null=True, blank=True)
    description = models.TextField('描述', blank=True)
    price_per_unit = models.FloatField('单价(元)', default=0)

    class Meta:
        verbose_name = '食材'
        verbose_name_plural = '食材'
        ordering = ['name']

    def __str__(self):
        return self.name


class Recipe(models.Model):
    CUISINE_CHOICES = [
        ('sichuan', '川菜'),
        ('cantonese', '粤菜'),
        ('shandong', '鲁菜'),
        ('jiangsu', '苏菜'),
        ('fujian', '闽菜'),
        ('zhejiang', '浙菜'),
        ('hunan', '湘菜'),
        ('anhui', '徽菜'),
        ('chinese_home', '家常菜'),
        ('western', '西餐'),
        ('japanese', '日料'),
        ('korean', '韩餐'),
        ('other', '其他'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', '简单'),
        ('medium', '中等'),
        ('hard', '困难'),
    ]

    title = models.CharField('菜谱名称', max_length=200)
    description = models.TextField('简介', blank=True)
    cuisine = models.CharField('菜系', max_length=20, choices=CUISINE_CHOICES, default='chinese_home')
    difficulty = models.CharField('难度', max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    cook_time = models.IntegerField('烹饪时间(分钟)', default=30)
    servings = models.IntegerField('份量(人份)', default=2)
    
    image = models.ImageField('菜谱图片', upload_to='recipes/', null=True, blank=True)
    steps = models.TextField('烹饪步骤')
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes', verbose_name='作者')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    is_public = models.BooleanField('是否公开', default=True)
    view_count = models.IntegerField('浏览次数', default=0)
    like_count = models.IntegerField('点赞数', default=0)

    ingredients = models.ManyToManyField(Ingredient, through='RecipeIngredient', related_name='recipes')

    class Meta:
        verbose_name = '菜谱'
        verbose_name_plural = '菜谱'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def total_calories(self):
        total = 0
        for ri in self.recipe_ingredients.all():
            total += ri.ingredient.calories * ri.quantity / 100
        return round(total, 1)

    def total_nutrition(self):
        nutrition = {
            'calories': 0,
            'protein': 0,
            'fat': 0,
            'carbs': 0,
            'fiber': 0,
            'vitamin_c': 0,
            'calcium': 0,
            'iron': 0,
        }
        for ri in self.recipe_ingredients.all():
            factor = ri.quantity / 100
            nutrition['calories'] += ri.ingredient.calories * factor
            nutrition['protein'] += ri.ingredient.protein * factor
            nutrition['fat'] += ri.ingredient.fat * factor
            nutrition['carbs'] += ri.ingredient.carbs * factor
            nutrition['fiber'] += ri.ingredient.fiber * factor
            nutrition['vitamin_c'] += ri.ingredient.vitamin_c * factor
            nutrition['calcium'] += ri.ingredient.calcium * factor
            nutrition['iron'] += ri.ingredient.iron * factor
        
        for key in nutrition:
            nutrition[key] = round(nutrition[key], 2)
        return nutrition


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='recipe_ingredients', verbose_name='菜谱')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='recipe_ingredients', verbose_name='食材')
    quantity = models.FloatField('用量', default=100)
    unit = models.CharField('单位', max_length=20, default='克')

    class Meta:
        verbose_name = '菜谱食材'
        verbose_name_plural = '菜谱食材'
        unique_together = ['recipe', 'ingredient']

    def __str__(self):
        return f'{self.recipe.title} - {self.ingredient.name}'


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites', verbose_name='用户')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='favorites', verbose_name='菜谱')
    created_at = models.DateTimeField('收藏时间', auto_now_add=True)

    class Meta:
        verbose_name = '收藏'
        verbose_name_plural = '收藏'
        unique_together = ['user', 'recipe']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.recipe.title}'


class MealPlan(models.Model):
    MEAL_TYPE_CHOICES = [
        ('breakfast', '早餐'),
        ('lunch', '午餐'),
        ('dinner', '晚餐'),
        ('snack', '加餐'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_plans', verbose_name='用户')
    date = models.DateField('日期')
    meal_type = models.CharField('餐次', max_length=20, choices=MEAL_TYPE_CHOICES)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='meal_plans', verbose_name='菜谱')
    servings = models.IntegerField('份量', default=1)
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '饮食计划'
        verbose_name_plural = '饮食计划'
        ordering = ['date', 'meal_type']

    def __str__(self):
        return f'{self.date} {self.get_meal_type_display()} - {self.recipe.title}'


class ShoppingList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shopping_lists', verbose_name='用户')
    name = models.CharField('清单名称', max_length=200)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    is_sent = models.BooleanField('是否已发送到超市', default=False)
    sent_at = models.DateTimeField('发送时间', null=True, blank=True)
    supermarket = models.ForeignKey('Supermarket', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='超市')

    class Meta:
        verbose_name = '购物清单'
        verbose_name_plural = '购物清单'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.name}'

    def total_price(self):
        total = 0
        for item in self.items.all():
            if item.ingredient.price_per_unit:
                total += item.ingredient.price_per_unit * item.quantity / 100
        return round(total, 2)


class ShoppingListItem(models.Model):
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items', verbose_name='购物清单')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='shopping_items', verbose_name='食材')
    quantity = models.FloatField('数量', default=0)
    unit = models.CharField('单位', max_length=20, default='克')
    is_purchased = models.BooleanField('是否已购买', default=False)

    class Meta:
        verbose_name = '购物清单项'
        verbose_name_plural = '购物清单项'

    def __str__(self):
        return f'{self.ingredient.name} - {self.quantity}{self.unit}'


class Supermarket(models.Model):
    name = models.CharField('超市名称', max_length=200)
    address = models.CharField('地址', max_length=500)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    latitude = models.FloatField('纬度', null=True, blank=True)
    longitude = models.FloatField('经度', null=True, blank=True)
    is_active = models.BooleanField('是否营业', default=True)
    delivery_radius = models.FloatField('配送范围(公里)', default=5)

    class Meta:
        verbose_name = '超市'
        verbose_name_plural = '超市'
        ordering = ['name']

    def __str__(self):
        return self.name


class NutritionGoal(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nutrition_goal', verbose_name='用户')
    daily_calories = models.FloatField('每日热量目标(kcal)', default=2000)
    daily_protein = models.FloatField('每日蛋白质目标(g)', default=60)
    daily_fat = models.FloatField('每日脂肪目标(g)', default=65)
    daily_carbs = models.FloatField('每日碳水目标(g)', default=300)

    class Meta:
        verbose_name = '营养目标'
        verbose_name_plural = '营养目标'

    def __str__(self):
        return f'{self.user.username}的营养目标'
