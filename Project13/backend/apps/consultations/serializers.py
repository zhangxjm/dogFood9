from rest_framework import serializers
from .models import Consultation, ConsultationComment


class ConsultationCommentSerializer(serializers.ModelSerializer):
    authorId = serializers.IntegerField(source='author_id', read_only=True)
    authorName = serializers.CharField(source='author.name', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ConsultationComment
        fields = ('id', 'consultation', 'authorId', 'authorName', 'content', 'attachments', 'createdAt')
        read_only_fields = ('id', 'authorId', 'authorName', 'createdAt')


class ConsultationSerializer(serializers.ModelSerializer):
    studyId = serializers.IntegerField(source='study_id', read_only=True)
    patientId = serializers.IntegerField(source='study.patient_id', read_only=True)
    initiatorId = serializers.IntegerField(source='initiator_id', read_only=True)
    initiatorName = serializers.CharField(source='initiator.name', read_only=True)
    expertNames = serializers.SerializerMethodField()
    comments = ConsultationCommentSerializer(many=True, read_only=True)
    patientName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Consultation
        fields = ('id', 'studyId', 'patientId', 'initiatorId', 'initiatorName', 'expertNames',
                  'title', 'description', 'status', 'result', 'comments', 'patientName', 'createdAt', 'updatedAt')
        read_only_fields = ('id', 'studyId', 'patientId', 'initiatorId', 'initiatorName', 'createdAt', 'updatedAt')

    def get_expertNames(self, obj):
        return [expert.name for expert in obj.experts.all()]

    def get_patientName(self, obj):
        return obj.study.patient.name if obj.study and obj.study.patient else ''


class ConsultationCreateSerializer(serializers.ModelSerializer):
    studyId = serializers.IntegerField(write_only=True)
    expertIds = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    class Meta:
        model = Consultation
        fields = ('id', 'studyId', 'title', 'description', 'expertIds')
        read_only_fields = ('id',)

    def validate_studyId(self, value):
        from apps.studies.models import Study
        if not Study.objects.filter(pk=value).exists():
            raise serializers.ValidationError('影像检查不存在')
        return value

    def create(self, validated_data):
        study_id = validated_data.pop('studyId')
        expert_ids = validated_data.pop('expertIds')
        from apps.studies.models import Study
        study = Study.objects.get(pk=study_id)
        consultation = Consultation.objects.create(study=study, **validated_data)
        consultation.experts.set(expert_ids)
        return consultation
