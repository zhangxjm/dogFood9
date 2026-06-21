from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recipes.models import (
    Ingredient, Recipe, RecipeIngredient, Supermarket
)


class Command(BaseCommand):
    help = 'Initialize database with sample data including ingredients, recipes, and supermarkets'

    def handle(self, *args, **options):
        self.stdout.write('Initializing database...')
        
        self.create_superuser()
        self.create_ingredients()
        self.create_recipes()
        self.create_supermarkets()
        
        self.stdout.write(self.style.SUCCESS('Database initialization complete!'))

    def create_superuser(self):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write('Superuser created: admin / admin123')
        else:
            self.stdout.write('Superuser already exists')

    def create_ingredients(self):
        ingredients_data = [
            {'name': '猪肉', 'category': 'meat', 'unit': '克', 'calories': 395, 'protein': 13.6, 'fat': 37, 'carbs': 2.4, 'fiber': 0, 'vitamin_c': 0, 'calcium': 6, 'iron': 1.6, 'price_per_unit': 35},
            {'name': '牛肉', 'category': 'meat', 'unit': '克', 'calories': 125, 'protein': 19.9, 'fat': 4.2, 'carbs': 2, 'fiber': 0, 'vitamin_c': 0, 'calcium': 23, 'iron': 3.3, 'price_per_unit': 60},
            {'name': '鸡胸肉', 'category': 'meat', 'unit': '克', 'calories': 133, 'protein': 19.4, 'fat': 5, 'carbs': 2.5, 'fiber': 0, 'vitamin_c': 0, 'calcium': 16, 'iron': 0.7, 'price_per_unit': 25},
            {'name': '鸡蛋', 'category': 'dairy', 'unit': '克', 'calories': 144, 'protein': 13.3, 'fat': 8.8, 'carbs': 2.8, 'fiber': 0, 'vitamin_c': 0, 'calcium': 56, 'iron': 2, 'price_per_unit': 10},
            {'name': '牛奶', 'category': 'dairy', 'unit': '毫升', 'calories': 54, 'protein': 3, 'fat': 3.2, 'carbs': 3.4, 'fiber': 0, 'vitamin_c': 1, 'calcium': 104, 'iron': 0.3, 'price_per_unit': 8},
            {'name': '米饭', 'category': 'grain', 'unit': '克', 'calories': 116, 'protein': 2.6, 'fat': 0.3, 'carbs': 25.9, 'fiber': 0.3, 'vitamin_c': 0, 'calcium': 7, 'iron': 1.3, 'price_per_unit': 6},
            {'name': '面条', 'category': 'grain', 'unit': '克', 'calories': 284, 'protein': 8.3, 'fat': 0.7, 'carbs': 61.9, 'fiber': 0.8, 'vitamin_c': 0, 'calcium': 11, 'iron': 3.6, 'price_per_unit': 8},
            {'name': '西红柿', 'category': 'vegetable', 'unit': '克', 'calories': 20, 'protein': 0.9, 'fat': 0.2, 'carbs': 4, 'fiber': 0.5, 'vitamin_c': 19, 'calcium': 10, 'iron': 0.4, 'price_per_unit': 6},
            {'name': '黄瓜', 'category': 'vegetable', 'unit': '克', 'calories': 16, 'protein': 0.8, 'fat': 0.2, 'carbs': 2.9, 'fiber': 0.5, 'vitamin_c': 9, 'calcium': 24, 'iron': 0.5, 'price_per_unit': 5},
            {'name': '土豆', 'category': 'vegetable', 'unit': '克', 'calories': 77, 'protein': 2, 'fat': 0.2, 'carbs': 17.2, 'fiber': 0.7, 'vitamin_c': 27, 'calcium': 8, 'iron': 0.8, 'price_per_unit': 4},
            {'name': '胡萝卜', 'category': 'vegetable', 'unit': '克', 'calories': 37, 'protein': 1, 'fat': 0.2, 'carbs': 8.8, 'fiber': 1.1, 'vitamin_c': 13, 'calcium': 32, 'iron': 0.5, 'price_per_unit': 5},
            {'name': '白菜', 'category': 'vegetable', 'unit': '克', 'calories': 17, 'protein': 1.5, 'fat': 0.1, 'carbs': 3.2, 'fiber': 0.8, 'vitamin_c': 28, 'calcium': 90, 'iron': 1.9, 'price_per_unit': 3},
            {'name': '菠菜', 'category': 'vegetable', 'unit': '克', 'calories': 28, 'protein': 2.6, 'fat': 0.3, 'carbs': 4.5, 'fiber': 1.7, 'vitamin_c': 32, 'calcium': 66, 'iron': 2.9, 'price_per_unit': 8},
            {'name': '青椒', 'category': 'vegetable', 'unit': '克', 'calories': 22, 'protein': 1, 'fat': 0.2, 'carbs': 5.4, 'fiber': 0.8, 'vitamin_c': 72, 'calcium': 14, 'iron': 0.8, 'price_per_unit': 7},
            {'name': '洋葱', 'category': 'vegetable', 'unit': '克', 'calories': 40, 'protein': 1.1, 'fat': 0.2, 'carbs': 9.3, 'fiber': 0.9, 'vitamin_c': 8, 'calcium': 24, 'iron': 0.6, 'price_per_unit': 4},
            {'name': '大蒜', 'category': 'seasoning', 'unit': '克', 'calories': 128, 'protein': 4.5, 'fat': 0.2, 'carbs': 27.6, 'fiber': 1.1, 'vitamin_c': 7, 'calcium': 39, 'iron': 1.2, 'price_per_unit': 15},
            {'name': '生姜', 'category': 'seasoning', 'unit': '克', 'calories': 41, 'protein': 1.3, 'fat': 0.6, 'carbs': 10.3, 'fiber': 0.9, 'vitamin_c': 4, 'calcium': 27, 'iron': 1.4, 'price_per_unit': 12},
            {'name': '葱', 'category': 'seasoning', 'unit': '克', 'calories': 30, 'protein': 1.7, 'fat': 0.3, 'carbs': 5.2, 'fiber': 1.3, 'vitamin_c': 17, 'calcium': 29, 'iron': 0.7, 'price_per_unit': 6},
            {'name': '酱油', 'category': 'seasoning', 'unit': '毫升', 'calories': 63, 'protein': 5.6, 'fat': 0.1, 'carbs': 10.1, 'fiber': 0.2, 'vitamin_c': 0, 'calcium': 66, 'iron': 8.6, 'price_per_unit': 12},
            {'name': '盐', 'category': 'seasoning', 'unit': '克', 'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0, 'fiber': 0, 'vitamin_c': 0, 'calcium': 22, 'iron': 1, 'price_per_unit': 3},
            {'name': '糖', 'category': 'seasoning', 'unit': '克', 'calories': 396, 'protein': 0, 'fat': 0, 'carbs': 99.9, 'fiber': 0, 'vitamin_c': 0, 'calcium': 20, 'iron': 0.2, 'price_per_unit': 8},
            {'name': '食用油', 'category': 'seasoning', 'unit': '克', 'calories': 899, 'protein': 0, 'fat': 99.9, 'carbs': 0, 'fiber': 0, 'vitamin_c': 0, 'calcium': 2, 'iron': 0, 'price_per_unit': 20},
            {'name': '草鱼', 'category': 'seafood', 'unit': '克', 'calories': 113, 'protein': 16.6, 'fat': 5.2, 'carbs': 0, 'fiber': 0, 'vitamin_c': 0, 'calcium': 38, 'iron': 0.8, 'price_per_unit': 18},
            {'name': '虾', 'category': 'seafood', 'unit': '克', 'calories': 93, 'protein': 18.6, 'fat': 0.8, 'carbs': 2.8, 'fiber': 0, 'vitamin_c': 0, 'calcium': 62, 'iron': 1.5, 'price_per_unit': 45},
            {'name': '苹果', 'category': 'fruit', 'unit': '克', 'calories': 54, 'protein': 0.2, 'fat': 0.2, 'carbs': 13.5, 'fiber': 1.2, 'vitamin_c': 4, 'calcium': 4, 'iron': 0.6, 'price_per_unit': 10},
            {'name': '香蕉', 'category': 'fruit', 'unit': '克', 'calories': 91, 'protein': 1.4, 'fat': 0.2, 'carbs': 22, 'fiber': 1.2, 'vitamin_c': 8, 'calcium': 7, 'iron': 0.4, 'price_per_unit': 8},
            {'name': '豆腐', 'category': 'other', 'unit': '克', 'calories': 81, 'protein': 8.1, 'fat': 3.7, 'carbs': 4.2, 'fiber': 0.4, 'vitamin_c': 0, 'calcium': 164, 'iron': 1.9, 'price_per_unit': 6},
            {'name': '木耳', 'category': 'vegetable', 'unit': '克', 'calories': 21, 'protein': 1.5, 'fat': 0.2, 'carbs': 6, 'fiber': 2.6, 'vitamin_c': 1, 'calcium': 34, 'iron': 5.5, 'price_per_unit': 20},
            {'name': '香菇', 'category': 'vegetable', 'unit': '克', 'calories': 26, 'protein': 2.2, 'fat': 0.3, 'carbs': 5.2, 'fiber': 2.5, 'vitamin_c': 1, 'calcium': 2, 'iron': 0.3, 'price_per_unit': 25},
            {'name': '辣椒', 'category': 'vegetable', 'unit': '克', 'calories': 32, 'protein': 1.3, 'fat': 0.4, 'carbs': 8.9, 'fiber': 3.2, 'vitamin_c': 144, 'calcium': 16, 'iron': 0.7, 'price_per_unit': 9},
        ]
        
        for data in ingredients_data:
            Ingredient.objects.get_or_create(name=data['name'], defaults=data)
        
        self.stdout.write(f'Created/updated {len(ingredients_data)} ingredients')

    def create_recipes(self):
        admin = User.objects.get(username='admin')

        recipes_data = [
            {
                'title': '西红柿炒鸡蛋',
                'description': '经典家常菜，酸甜可口，营养丰富，简单易做。',
                'cuisine': 'chinese_home',
                'difficulty': 'easy',
                'cook_time': 15,
                'servings': 2,
                'steps': '1. 西红柿洗净切块，鸡蛋打散备用。\n2. 锅中放油烧热，倒入蛋液炒至凝固盛出。\n3. 锅中再放少许油，放入西红柿翻炒出汁。\n4. 加入盐、糖调味。\n5. 倒入炒好的鸡蛋，翻炒均匀即可出锅。',
                'ingredients': [
                    {'name': '西红柿', 'quantity': 200},
                    {'name': '鸡蛋', 'quantity': 100},
                    {'name': '食用油', 'quantity': 20},
                    {'name': '盐', 'quantity': 3},
                    {'name': '糖', 'quantity': 5},
                    {'name': '葱', 'quantity': 10},
                ]
            },
            {
                'title': '青椒炒肉丝',
                'description': '下饭神器，青椒爽脆，肉丝嫩滑。',
                'cuisine': 'chinese_home',
                'difficulty': 'medium',
                'cook_time': 25,
                'servings': 2,
                'steps': '1. 猪肉切丝，用料酒、生抽、淀粉腌制10分钟。\n2. 青椒切丝，葱姜蒜切末。\n3. 锅中放油烧热，放入肉丝滑炒至变色盛出。\n4. 锅中留底油，爆香葱姜蒜。\n5. 放入青椒丝翻炒至断生。\n6. 倒入肉丝，加酱油、盐调味，翻炒均匀即可。',
                'ingredients': [
                    {'name': '猪肉', 'quantity': 150},
                    {'name': '青椒', 'quantity': 200},
                    {'name': '食用油', 'quantity': 25},
                    {'name': '酱油', 'quantity': 15},
                    {'name': '盐', 'quantity': 2},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '生姜', 'quantity': 5},
                    {'name': '葱', 'quantity': 10},
                ]
            },
            {
                'title': '土豆炖牛肉',
                'description': '经典硬菜，牛肉软烂，土豆入味。',
                'cuisine': 'chinese_home',
                'difficulty': 'hard',
                'cook_time': 90,
                'servings': 4,
                'steps': '1. 牛肉切块，冷水下锅焯水去血沫。\n2. 土豆去皮切块，胡萝卜切块。\n3. 锅中放油，爆香葱姜蒜、八角、桂皮。\n4. 放入牛肉翻炒，加酱油、料酒、糖上色。\n5. 加开水没过牛肉，大火烧开后转小火炖1小时。\n6. 放入土豆和胡萝卜，继续炖20分钟。\n7. 大火收汁，加盐调味即可。',
                'ingredients': [
                    {'name': '牛肉', 'quantity': 500},
                    {'name': '土豆', 'quantity': 300},
                    {'name': '胡萝卜', 'quantity': 150},
                    {'name': '食用油', 'quantity': 30},
                    {'name': '酱油', 'quantity': 30},
                    {'name': '盐', 'quantity': 5},
                    {'name': '糖', 'quantity': 10},
                    {'name': '大蒜', 'quantity': 15},
                    {'name': '生姜', 'quantity': 10},
                    {'name': '葱', 'quantity': 15},
                ]
            },
            {
                'title': '麻婆豆腐',
                'description': '川菜经典，麻辣鲜香，嫩滑可口。',
                'cuisine': 'sichuan',
                'difficulty': 'medium',
                'cook_time': 20,
                'servings': 2,
                'steps': '1. 豆腐切块，用淡盐水浸泡。\n2. 猪肉切末，葱姜蒜切末。\n3. 锅中放油，爆香豆瓣酱、辣椒面。\n4. 放入肉末炒散。\n5. 加入适量水烧开，放入豆腐。\n6. 小火煮5分钟，让豆腐入味。\n7. 水淀粉勾芡，撒上花椒粉和葱花即可。',
                'ingredients': [
                    {'name': '豆腐', 'quantity': 300},
                    {'name': '猪肉', 'quantity': 80},
                    {'name': '食用油', 'quantity': 20},
                    {'name': '酱油', 'quantity': 10},
                    {'name': '盐', 'quantity': 2},
                    {'name': '辣椒', 'quantity': 5},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '生姜', 'quantity': 5},
                    {'name': '葱', 'quantity': 10},
                ]
            },
            {
                'title': '白灼虾',
                'description': '粤式经典，保留虾的原汁原味，鲜甜弹牙。',
                'cuisine': 'cantonese',
                'difficulty': 'easy',
                'cook_time': 10,
                'servings': 2,
                'steps': '1. 鲜虾剪去虾须，挑去虾线洗净。\n2. 锅中加水，放入姜片、葱段、料酒。\n3. 水开后放入虾，煮约2分钟至虾身变红弯曲。\n4. 捞出虾，过冰水保持弹牙口感。\n5. 准备蘸料：姜末、蒜末、酱油、少许醋。\n6. 虾摆盘，蘸料食用。',
                'ingredients': [
                    {'name': '虾', 'quantity': 300},
                    {'name': '生姜', 'quantity': 15},
                    {'name': '葱', 'quantity': 15},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '酱油', 'quantity': 20},
                ]
            },
            {
                'title': '宫保鸡丁',
                'description': '川菜经典，鸡肉滑嫩，花生酥脆，酸甜微辣。',
                'cuisine': 'sichuan',
                'difficulty': 'medium',
                'cook_time': 20,
                'servings': 2,
                'steps': '1. 鸡胸肉切丁，用盐、料酒、淀粉腌制15分钟。\n2. 花生米炸至金黄酥脆备用。\n3. 调制酱汁：酱油、醋、糖、淀粉、水。\n4. 锅中放油烧热，爆香干辣椒和花椒。\n5. 放入鸡丁滑炒至变色。\n6. 加入葱丁、黄瓜丁翻炒。\n7. 倒入调好的酱汁，翻炒均匀。\n8. 出锅前加入花生米拌匀即可。',
                'ingredients': [
                    {'name': '鸡胸肉', 'quantity': 200},
                    {'name': '花生', 'category': 'other', 'quantity': 50, 'calories': 563, 'protein': 24.8, 'fat': 44.3, 'carbs': 21.7, 'price_per_unit': 25},
                    {'name': '黄瓜', 'quantity': 80},
                    {'name': '辣椒', 'quantity': 10},
                    {'name': '食用油', 'quantity': 25},
                    {'name': '酱油', 'quantity': 15},
                    {'name': '盐', 'quantity': 2},
                    {'name': '糖', 'quantity': 10},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '生姜', 'quantity': 5},
                    {'name': '葱', 'quantity': 15},
                ]
            },
            {
                'title': '蒜蓉菠菜',
                'description': '简单快手的素菜，蒜香浓郁，菠菜翠绿。',
                'cuisine': 'chinese_home',
                'difficulty': 'easy',
                'cook_time': 10,
                'servings': 2,
                'steps': '1. 菠菜洗净，开水焯烫30秒捞出过凉水。\n2. 挤干菠菜水分，切段装盘。\n3. 大蒜切末，撒在菠菜上。\n4. 锅中烧热油，淋在蒜末上激出香味。\n5. 加少许盐、酱油拌匀即可。',
                'ingredients': [
                    {'name': '菠菜', 'quantity': 250},
                    {'name': '大蒜', 'quantity': 20},
                    {'name': '食用油', 'quantity': 15},
                    {'name': '盐', 'quantity': 2},
                    {'name': '酱油', 'quantity': 5},
                ]
            },
            {
                'title': '番茄牛肉汤',
                'description': '营养丰富的汤品，酸甜开胃，牛肉软烂。',
                'cuisine': 'chinese_home',
                'difficulty': 'medium',
                'cook_time': 60,
                'servings': 4,
                'steps': '1. 牛肉切块，冷水下锅焯水。\n2. 西红柿切块，洋葱切块。\n3. 锅中放油，炒香洋葱。\n4. 放入西红柿炒出汤汁。\n5. 加入牛肉和开水，大火烧开转小火炖40分钟。\n6. 加盐、少许糖调味。\n7. 撒上葱花即可出锅。',
                'ingredients': [
                    {'name': '牛肉', 'quantity': 250},
                    {'name': '西红柿', 'quantity': 300},
                    {'name': '洋葱', 'quantity': 100},
                    {'name': '土豆', 'quantity': 150},
                    {'name': '食用油', 'quantity': 20},
                    {'name': '盐', 'quantity': 5},
                    {'name': '糖', 'quantity': 5},
                    {'name': '葱', 'quantity': 10},
                    {'name': '生姜', 'quantity': 5},
                ]
            },
            {
                'title': '香煎鸡胸肉',
                'description': '低脂高蛋白，健身人士首选，外焦里嫩。',
                'cuisine': 'western',
                'difficulty': 'easy',
                'cook_time': 20,
                'servings': 1,
                'steps': '1. 鸡胸肉用刀背拍松，加黑胡椒、盐、橄榄油腌制20分钟。\n2. 平底锅烧热，放入鸡胸肉。\n3. 每面煎3-4分钟至金黄。\n4. 加入蒜片和迷迭香增香。\n5. 取出静置3分钟后切片。\n6. 搭配蔬菜即可食用。',
                'ingredients': [
                    {'name': '鸡胸肉', 'quantity': 200},
                    {'name': '食用油', 'quantity': 10},
                    {'name': '盐', 'quantity': 2},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '生菜', 'category': 'vegetable', 'quantity': 100, 'calories': 13, 'protein': 1.3, 'fat': 0.3, 'carbs': 1.3, 'fiber': 0.7, 'vitamin_c': 20, 'calcium': 34, 'iron': 0.9, 'price_per_unit': 6},
                ]
            },
            {
                'title': '香菇青菜',
                'description': '清淡素菜，香菇鲜美，青菜翠绿。',
                'cuisine': 'chinese_home',
                'difficulty': 'easy',
                'cook_time': 10,
                'servings': 2,
                'steps': '1. 香菇泡发切片，青菜洗净切段。\n2. 锅中放油烧热，爆香蒜末。\n3. 放入香菇翻炒出香味。\n4. 加入青菜翻炒至断生。\n5. 加盐调味，淋入水淀粉勾薄芡即可。',
                'ingredients': [
                    {'name': '白菜', 'quantity': 250},
                    {'name': '香菇', 'quantity': 50},
                    {'name': '食用油', 'quantity': 15},
                    {'name': '盐', 'quantity': 2},
                    {'name': '大蒜', 'quantity': 10},
                    {'name': '糖', 'quantity': 2},
                ]
            },
            {
                'title': '糖醋里脊',
                'description': '酸甜可口，外酥里嫩，老少皆宜。',
                'cuisine': 'chinese_home',
                'difficulty': 'medium',
                'cook_time': 30,
                'servings': 3,
                'steps': '1. 猪里脊切条，用料酒、盐腌制10分钟。\n2. 淀粉、面粉、水调成面糊。\n3. 里脊条挂糊，油温六成热下锅炸至金黄。\n4. 升高油温复炸至酥脆。\n5. 锅中留底油，加入番茄酱、糖、醋、水调汁。\n6. 水淀粉勾芡，倒入炸好的里脊快速翻炒均匀即可。',
                'ingredients': [
                    {'name': '猪肉', 'quantity': 300},
                    {'name': '番茄酱', 'category': 'seasoning', 'quantity': 30, 'calories': 81, 'protein': 1.5, 'fat': 0.2, 'carbs': 18.6, 'fiber': 0.6, 'vitamin_c': 5, 'calcium': 29, 'iron': 1.1, 'price_per_unit': 15},
                    {'name': '糖', 'quantity': 20},
                    {'name': '食用油', 'quantity': 50},
                    {'name': '盐', 'quantity': 2},
                    {'name': '面粉', 'category': 'grain', 'quantity': 50, 'calories': 344, 'protein': 11.2, 'fat': 1.5, 'carbs': 73.6, 'fiber': 2.1, 'vitamin_c': 0, 'calcium': 31, 'iron': 3.5, 'price_per_unit': 5},
                ]
            },
            {
                'title': '凉拌黄瓜',
                'description': '清爽开胃的凉拌菜，简单又好吃。',
                'cuisine': 'chinese_home',
                'difficulty': 'easy',
                'cook_time': 5,
                'servings': 2,
                'steps': '1. 黄瓜洗净拍扁切段。\n2. 加少许盐腌制5分钟，挤出水分。\n3. 大蒜切末，加入酱油、醋、糖、香油调成料汁。\n4. 将料汁浇在黄瓜上，拌匀即可。',
                'ingredients': [
                    {'name': '黄瓜', 'quantity': 300},
                    {'name': '大蒜', 'quantity': 15},
                    {'name': '酱油', 'quantity': 10},
                    {'name': '盐', 'quantity': 2},
                    {'name': '糖', 'quantity': 5},
                ]
            },
        ]

        for recipe_data in recipes_data:
            ingredients_data = recipe_data.pop('ingredients')
            
            recipe, created = Recipe.objects.get_or_create(
                title=recipe_data['title'],
                defaults={**recipe_data, 'author': admin}
            )
            
            if created:
                for ing_data in ingredients_data:
                    ing_name = ing_data['name']
                    
                    ing_defaults = {
                        'category': ing_data.get('category', 'other'),
                        'unit': '克',
                        'calories': ing_data.get('calories', 0),
                        'protein': ing_data.get('protein', 0),
                        'fat': ing_data.get('fat', 0),
                        'carbs': ing_data.get('carbs', 0),
                        'fiber': ing_data.get('fiber', 0),
                        'vitamin_c': ing_data.get('vitamin_c', 0),
                        'calcium': ing_data.get('calcium', 0),
                        'iron': ing_data.get('iron', 0),
                        'price_per_unit': ing_data.get('price_per_unit', 0),
                    }
                    
                    ingredient, _ = Ingredient.objects.get_or_create(
                        name=ing_name,
                        defaults=ing_defaults
                    )
                    
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=ingredient,
                        quantity=ing_data['quantity'],
                        unit='克'
                    )
                
                self.stdout.write(f'Created recipe: {recipe.title}')
        
        self.stdout.write(f'Recipe initialization complete')

    def create_supermarkets(self):
        supermarkets_data = [
            {'name': '永辉超市', 'address': '北京市朝阳区建国路88号', 'phone': '010-12345678', 'latitude': 39.9042, 'longitude': 116.4074, 'is_active': True, 'delivery_radius': 5},
            {'name': '沃尔玛超市', 'address': '北京市海淀区中关村大街1号', 'phone': '010-87654321', 'latitude': 39.9847, 'longitude': 116.3046, 'is_active': True, 'delivery_radius': 3},
            {'name': '盒马鲜生', 'address': '北京市东城区王府井大街201号', 'phone': '010-55667788', 'latitude': 39.9151, 'longitude': 116.4031, 'is_active': True, 'delivery_radius': 4},
            {'name': '物美超市', 'address': '北京市西城区西单北大街120号', 'phone': '010-33445566', 'latitude': 39.9139, 'longitude': 116.3748, 'is_active': True, 'delivery_radius': 3},
            {'name': '家乐福', 'address': '北京市丰台区南三环西路16号', 'phone': '010-99887766', 'latitude': 39.8589, 'longitude': 116.3711, 'is_active': True, 'delivery_radius': 5},
        ]
        
        for data in supermarkets_data:
            Supermarket.objects.get_or_create(name=data['name'], defaults=data)
        
        self.stdout.write(f'Created/updated {len(supermarkets_data)} supermarkets')
