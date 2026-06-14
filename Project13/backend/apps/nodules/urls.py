from django.urls import path
from . import views

urlpatterns = [
    path('studies/<int:study_id>/nodules/', views.StudyNodulesView.as_view(), name='study-nodules'),
    path('nodules/', views.NoduleListCreateView.as_view(), name='nodule-list-create'),
    path('nodules/<int:pk>/', views.NoduleDetailView.as_view(), name='nodule-detail'),
]
