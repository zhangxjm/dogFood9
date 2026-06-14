from rest_framework import serializers
from .models import Nodule


class NoduleSerializer(serializers.ModelSerializer):
    studyId = serializers.IntegerField(source='study_id')
    noduleType = serializers.CharField(source='nodule_type')
    size = serializers.FloatField(source='diameter_mm', allow_null=True, required=False)
    volume = serializers.FloatField(source='volume_mm3', allow_null=True, required=False)
    marginFeature = serializers.CharField(source='margin')
    malignancyProbability = serializers.SerializerMethodField()
    malignancyLevel = serializers.CharField(source='malignancy_level')
    detectionMethod = serializers.CharField(source='detected_by')
    bboxX = serializers.FloatField(source='x')
    bboxY = serializers.FloatField(source='y')
    bboxWidth = serializers.FloatField(source='width')
    bboxHeight = serializers.FloatField(source='height')
    detectorName = serializers.CharField(source='detector.name', read_only=True, default='')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Nodule
        fields = ('id', 'studyId', 'noduleType', 'size', 'volume', 'density', 'marginFeature',
                  'malignancyProbability', 'malignancyLevel', 'detectionMethod',
                  'bboxX', 'bboxY', 'bboxWidth', 'bboxHeight',
                  'features', 'detectorName', 'createdAt')
        read_only_fields = ('id', 'createdAt')

    def get_malignancyProbability(self, obj):
        return round(obj.malignancy_score / 100.0, 4) if obj.malignancy_score else 0.0


class NoduleUpdateSerializer(serializers.ModelSerializer):
    noduleType = serializers.CharField(source='nodule_type', required=False)
    malignancyLevel = serializers.CharField(source='malignancy_level', required=False)

    class Meta:
        model = Nodule
        fields = ('noduleType', 'malignancyLevel')
