# Port List

## Service Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Frontend (React) | 3000 | HTTP | User interface web application |
| Backend (Django) | 8000 | HTTP | REST API server and admin panel |

## Detailed Information

### Frontend - Port 3000
- **Service**: React development server
- **URL**: http://localhost:3000
- **Access**: Public (browser)
- **Purpose**: Main user interface for the recipe management system

### Backend - Port 8000
- **Service**: Django REST framework
- **URL**: http://localhost:8000
- **API Base**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **Admin Credentials**: admin / admin123
- **Purpose**: Backend API server providing all data services

## API Endpoints (Port 8000)

### Recipe Endpoints
- `GET /api/recipes/` - List all recipes
- `GET /api/recipes/:id/` - Get recipe detail
- `POST /api/recipes/` - Create new recipe
- `GET /api/recipes/popular/` - Get popular recipes
- `GET /api/recipes/recommend/` - Get recommended recipes
- `POST /api/recipes/:id/like/` - Like a recipe

### Ingredient Endpoints
- `GET /api/ingredients/` - List all ingredients
- `GET /api/ingredients/:id/` - Get ingredient detail

### Favorite Endpoints
- `GET /api/favorites/` - List user favorites
- `POST /api/favorites/` - Add to favorites
- `POST /api/favorites/toggle/` - Toggle favorite status
- `DELETE /api/favorites/:id/` - Remove from favorites

### Meal Plan Endpoints
- `GET /api/meal-plans/` - List meal plans
- `POST /api/meal-plans/` - Create meal plan
- `PUT /api/meal-plans/:id/` - Update meal plan
- `DELETE /api/meal-plans/:id/` - Delete meal plan
- `GET /api/meal-plans/weekly/` - Get weekly plan
- `GET /api/meal-plans/nutrition_summary/` - Get nutrition summary

### Shopping List Endpoints
- `GET /api/shopping-lists/` - List shopping lists
- `POST /api/shopping-lists/` - Create shopping list
- `POST /api/shopping-lists/generate_from_meal_plan/` - Generate from meal plan
- `POST /api/shopping-lists/:id/send_to_supermarket/` - Send to supermarket
- `POST /api/shopping-lists/:id/add_item/` - Add item to list

### Supermarket Endpoints
- `GET /api/supermarkets/` - List all supermarkets
- `GET /api/supermarkets/nearby/` - Get nearby supermarkets

### Nutrition Goal Endpoints
- `GET /api/nutrition-goals/` - Get nutrition goal
- `PUT /api/nutrition-goals/` - Update nutrition goal
- `GET /api/nutrition-goals/progress/` - Get daily progress

## Database
- **Type**: SQLite
- **File**: `backend/db.sqlite3`
- **Port**: N/A (file-based database)

## Docker Network
- **Network Name**: recipe-network
- **Driver**: bridge
- **Internal DNS**: backend, frontend

## Notes
- All services run on localhost by default
- CORS is enabled for all origins in development mode
- The backend serves static files and media files
- SQLite database is stored in the backend directory as a file
