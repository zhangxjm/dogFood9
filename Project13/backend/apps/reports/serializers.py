from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    studyId = serializers.IntegerField(source='study_id', read_only=True)
    patientId = serializers.IntegerField(source='patient_id', read_only=True)
    patientName = serializers.CharField(source='patient.name', read_only=True)
    authorName = serializers.CharField(source='author.name', read_only=True)
    reportType = serializers.CharField(source='report_type')
    nodulesSummary = serializers.JSONField(source='nodules_summary')
    isSigned = serializers.BooleanField(source='is_signed', read_only=True)
    signedByName = serializers.CharField(source='signed_by.name', read_only=True, default='')
    signedAt = serializers.DateTimeField(source='signed_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Report
        fields = ('id', 'studyId', 'patientId', 'patientName', 'authorName', 'reportType',
                  'findings', 'conclusion', 'recommendation', 'nodulesSummary',
                  'isSigned', 'signedByName', 'signedAt', 'createdAt', 'updatedAt')
        read_only_fields = ('id', 'authorName', 'isSigned', 'signedByName', 'signedAt', 'createdAt', 'updatedAt')
