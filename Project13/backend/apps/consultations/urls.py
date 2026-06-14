from django.urls import path
from . import views

urlpatterns = [
    path('consultations/', views.ConsultationListCreateView.as_view(), name='consultation-list-create'),
    path('consultations/experts/', views.ConsultationExpertsView.as_view(), name='consultation-experts'),
    path('consultations/<int:pk>/', views.ConsultationDetailView.as_view(), name='consultation-detail'),
    path('consultations/<int:pk>/respond/', views.ConsultationRespondView.as_view(), name='consultation-respond'),
    path('consultations/<int:pk>/close/', views.ConsultationCloseView.as_view(), name='consultation-close'),
    path('consultations/<int:pk>/comments/', views.ConsultationCommentsView.as_view(), name='consultation-comments'),
]
