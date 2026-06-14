from django.urls import path
from . import views

urlpatterns = [
    path('studies/', views.StudyListCreateView.as_view(), name='study-list-create'),
    path('studies/<int:pk>/', views.StudyDetailView.as_view(), name='study-detail'),
    path('studies/<int:pk>/upload/', views.StudyUploadView.as_view(), name='study-upload'),
    path('studies/<int:pk>/analyze/', views.StudyAnalyzeView.as_view(), name='study-analyze'),
    path('studies/<int:pk>/download/', views.StudyDownloadView.as_view(), name='study-download'),
    path('annotations/', views.AnnotationListCreateView.as_view(), name='annotation-list-create'),
    path('annotations/<int:pk>/', views.AnnotationDetailView.as_view(), name='annotation-detail'),
]
