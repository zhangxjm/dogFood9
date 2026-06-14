from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'name', 'role', 'department', 'phone', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'department')
    search_fields = ('username', 'name', 'phone', 'email')
    readonly_fields = ('created_at',)
