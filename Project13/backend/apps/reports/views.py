from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Report
from .serializers import ReportSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Report.objects.all()
        patient_id = self.request.query_params.get('patient', '')
        study_id = self.request.query_params.get('study', '')
        report_type = self.request.query_params.get('report_type', '')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if study_id:
            queryset = queryset.filter(study_id=study_id)
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    queryset = Report.objects.all()


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.studies.models import Study
        try:
            study = Study.objects.get(pk=pk)
        except Study.DoesNotExist:
            return Response({'detail': '检查不存在'}, status=status.HTTP_404_NOT_FOUND)

        from apps.ml_engine.inference import InferenceEngine
        engine = InferenceEngine()
        report_data = engine.generate_report_data(
            list(study.nodules.all()),
            study,
            study.patient
        )

        report = Report.objects.create(
            study=study,
            patient=study.patient,
            author=request.user,
            report_type='initial',
            findings=report_data.get('findings', ''),
            conclusion=report_data.get('conclusion', ''),
            recommendation=report_data.get('recommendation', ''),
            nodules_summary=report_data.get('nodules_summary', {}),
        )

        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


class SignReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'detail': '报告不存在'}, status=status.HTTP_404_NOT_FOUND)

        if report.is_signed:
            return Response({'detail': '报告已签发'}, status=status.HTTP_400_BAD_REQUEST)

        report.is_signed = True
        report.signed_by = request.user
        report.signed_at = timezone.now()
        report.save()

        return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
