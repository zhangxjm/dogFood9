from rest_framework import serializers
from .models import Study, StudyAnnotation


class StudySerializer(serializers.ModelSerializer):
    patientId = serializers.IntegerField(source='patient_id', read_only=True)
    patientName = serializers.CharField(source='patient.name', read_only=True)
    studyDate = serializers.DateField(source='study_date', required=False, allow_null=True)
    studyType = serializers.CharField(source='modality')
    bodyPart = serializers.CharField(source='body_part')
    studyDescription = serializers.CharField(source='study_description', required=False, default='')
    dicomFile = serializers.FileField(source='dicom_file', read_only=True, allow_null=True)
    uploadedByName = serializers.CharField(source='uploaded_by.name', read_only=True, default='')
    noduleCount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Study
        fields = ('id', 'patientId', 'patientName', 'studyDate', 'studyType', 'bodyPart', 'studyDescription', 'status', 'dicomFile', 'uploadedByName', 'noduleCount', 'createdAt', 'study_uid')
        read_only_fields = ('id', 'createdAt', 'noduleCount')

    def get_noduleCount(self, obj):
        return obj.nodules.count()


class StudyCreateSerializer(serializers.ModelSerializer):
    studyType = serializers.CharField(source='modality')
    bodyPart = serializers.CharField(source='body_part')
    studyDescription = serializers.CharField(source='study_description', required=False, default='')

    class Meta:
        model = Study
        fields = ('id', 'patient', 'studyType', 'bodyPart', 'studyDescription')
        read_only_fields = ('id',)


class StudyAnnotationSerializer(serializers.ModelSerializer):
    annotatorName = serializers.CharField(source='annotator.name', read_only=True)
    annotationType = serializers.CharField(source='annotation_type')
    annotationData = serializers.JSONField(source='annotation_data')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = StudyAnnotation
        fields = ('id', 'study', 'annotator', 'annotatorName', 'annotationData', 'annotationType', 'createdAt')
        read_only_fields = ('id', 'createdAt', 'annotator')
