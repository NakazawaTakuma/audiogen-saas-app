from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PendingUser

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'username',
        'slug',
        'email',
        'display_name',
        'profile_image_tag',
        'is_staff',
        'is_superuser',
        'date_joined',
    )
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'slug', 'email', 'display_name')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'slug', 'email', 'password')}),
        ('Personal Info', {'fields': ('display_name', 'profile_image', 'profile_image_tag', 'bio')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    readonly_fields = ('profile_image_tag',)

    def profile_image_tag(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" width="75" height="75" style="object-fit: cover; border-radius: 50%;"/>',
                obj.profile_image.url
            )
        return '-'
    profile_image_tag.short_description = 'Profile Image'


@admin.register(PendingUser)
class PendingUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'created_at', 'is_expired')
    search_fields = ('email', 'username')
    readonly_fields = ('token', 'created_at')

    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired?'
