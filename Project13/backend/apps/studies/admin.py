from django.contrib import admin
from .models import Study, StudyAnnotation


@admin.register(Study)
class StudyAdmin(admin.ModelAdmin):
    list_display = ('study_uid', 'patient', 'modality', 'body_part', 'status', 'study_date', 'uploaded_by', 'created_at')
    list_filter = ('modality', 'body_part', 'status')
    search_fields = ('study_uid', 'study_description', 'patient__name')
    readonly_fields = ('created_at',)


@admin.register(StudyAnnotation)
class StudyAnnotationAdmin(admin.ModelAdmin):
    list_display = ('study', 'annotator', 'annotation_type', 'created_at')
    list_filter = ('annotation_type',)
    readonly_fields = ('created_at',)
