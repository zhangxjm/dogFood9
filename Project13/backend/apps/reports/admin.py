from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('patient', 'study', 'author', 'report_type', 'is_signed', 'signed_by', 'created_at')
    list_filter = ('report_type', 'is_signed')
    search_fields = ('patient__name', 'study__study_uid', 'conclusion')
    readonly_fields = ('created_at', 'updated_at')
