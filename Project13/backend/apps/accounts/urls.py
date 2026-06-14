from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/user/', views.CurrentUserView.as_view(), name='current-user'),
    path('auth/users/', views.UserListView.as_view(), name='user-list'),
]
