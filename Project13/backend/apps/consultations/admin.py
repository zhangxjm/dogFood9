from django.contrib import admin
from .models import Consultation, ConsultationComment


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('title', 'study', 'initiator', 'status', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('experts',)


@admin.register(ConsultationComment)
class ConsultationCommentAdmin(admin.ModelAdmin):
    list_display = ('consultation', 'author', 'content', 'created_at')
    readonly_fields = ('created_at',)
