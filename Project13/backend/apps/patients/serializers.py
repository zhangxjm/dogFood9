from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    birthDate = serializers.DateField(source='birth_date', required=False, allow_null=True)
    idNumber = serializers.CharField(source='id_number', required=False, default='')
    medicalRecordNumber = serializers.CharField(source='medical_record_number')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    studyCount = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ('id', 'name', 'gender', 'birthDate', 'idNumber', 'phone', 'address', 'medicalRecordNumber', 'allergies', 'createdAt', 'studyCount')
        read_only_fields = ('id', 'createdAt', 'studyCount')

    def get_studyCount(self, obj):
        return obj.studies.count()


class PatientCreateSerializer(serializers.ModelSerializer):
    birthDate = serializers.DateField(source='birth_date', required=False, allow_null=True)
    idNumber = serializers.CharField(source='id_number', required=False, default='')
    medicalRecordNumber = serializers.CharField(source='medical_record_number')

    class Meta:
        model = Patient
        fields = ('id', 'name', 'gender', 'birthDate', 'idNumber', 'phone', 'address', 'medicalRecordNumber', 'allergies')
        read_only_fields = ('id',)
