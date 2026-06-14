from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'gender', 'birth_date', 'phone', 'medical_record_number', 'created_at')
    list_filter = ('gender',)
    search_fields = ('name', 'medical_record_number', 'id_number', 'phone')
    readonly_fields = ('created_at',)
