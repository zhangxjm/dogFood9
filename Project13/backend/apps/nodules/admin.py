from django.contrib import admin
from .models import Nodule


@admin.register(Nodule)
class NoduleAdmin(admin.ModelAdmin):
    list_display = ('study', 'nodule_type', 'malignancy_score', 'malignancy_level', 'diameter_mm', 'detected_by', 'created_at')
    list_filter = ('nodule_type', 'malignancy_level', 'detected_by', 'margin')
    search_fields = ('study__study_uid',)
    readonly_fields = ('created_at',)
