from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer, PatientCreateSerializer
from apps.studies.serializers import StudySerializer
from apps.studies.models import Study


class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientSerializer

    queryset = Patient.objects.all()

    def get_queryset(self):
        queryset = Patient.objects.all()
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__contains=search) | Q(medical_record_number__contains=search)
            )
        return queryset


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.all()


class PatientStudiesView(generics.ListAPIView):
    serializer_class = StudySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Study.objects.filter(patient_id=self.kwargs['pk'])
