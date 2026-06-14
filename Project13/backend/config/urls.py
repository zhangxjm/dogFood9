from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.studies.models import Study
        from apps.reports.models import Report
        from apps.consultations.models import Consultation

        today = datetime.now().date()
        today_exams = Study.objects.filter(study_date=today).count()
        pending_analysis = Study.objects.filter(status='pending').count()
        pending_reports = Report.objects.filter(is_signed=False).count()
        pending_consultations = Consultation.objects.filter(status='pending').count()

        return Response({
            'todayExams': today_exams,
            'pendingAnalysis': pending_analysis,
            'pendingReports': pending_reports,
            'pendingConsultations': pending_consultations,
        })


class DashboardWeeklyTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.studies.models import Study
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        labels = []
        data = []
        today = datetime.now().date()

        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            labels.append(date.strftime('%m-%d'))
            count = Study.objects.filter(study_date=date).count()
            data.append(count)

        return Response({
            'labels': labels,
            'data': data,
        })


class DashboardRecentStudiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.studies.models import Study
        from apps.studies.serializers import StudySerializer

        recent_studies = Study.objects.order_by('-created_at')[:5]
        serializer = StudySerializer(recent_studies, many=True)
        return Response(serializer.data)


class DashboardRecentReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.reports.models import Report
        from apps.reports.serializers import ReportSerializer

        recent_reports = Report.objects.order_by('-created_at')[:5]
        serializer = ReportSerializer(recent_reports, many=True)
        return Response(serializer.data)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.patients.urls')),
    path('api/', include('apps.studies.urls')),
    path('api/', include('apps.nodules.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/', include('apps.consultations.urls')),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/weekly-trend/', DashboardWeeklyTrendView.as_view(), name='dashboard-weekly-trend'),
    path('api/dashboard/recent-studies/', DashboardRecentStudiesView.as_view(), name='dashboard-recent-studies'),
    path('api/dashboard/recent-reports/', DashboardRecentReportsView.as_view(), name='dashboard-recent-reports'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
