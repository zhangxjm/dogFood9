from django.urls import path
from . import views

urlpatterns = [
    path('reports/', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('reports/<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('studies/<int:id>/generate-report/', views.GenerateReportView.as_view(), name='generate-report'),
    path('reports/<int:pk>/sign/', views.SignReportView.as_view(), name='sign-report'),
]
