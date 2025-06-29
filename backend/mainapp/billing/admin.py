from django.contrib import admin
from django.utils.html import format_html
from .models import Plan, UserSubscription, UsageLog

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'display_name', 'price', 'daily_audio_limit', 
        'max_audio_duration', 'is_active', 'is_popular', 'sort_order'
    ]
    list_filter = ['is_active', 'is_popular', 'can_use_api', 'can_download', 'can_edit_audio']
    search_fields = ['name', 'display_name', 'description']
    list_editable = ['is_active', 'is_popular', 'sort_order']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本情報', {
            'fields': ('name', 'display_name', 'description', 'price')
        }),
        ('制限設定', {
            'fields': ('daily_audio_limit', 'max_audio_duration', 'max_steps')
        }),
        ('機能設定', {
            'fields': ('can_use_api', 'can_download', 'can_edit_audio')
        }),
        ('Stripe連携', {
            'fields': ('stripe_price_id',),
            'classes': ('collapse',)
        }),
        ('表示設定', {
            'fields': ('is_active', 'is_popular', 'sort_order')
        }),
        ('日時', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).order_by('sort_order', 'price')

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'plan', 'status', 'current_period_end', 
        'days_remaining_display', 'created_at'
    ]
    list_filter = ['status', 'plan', 'created_at']
    search_fields = ['user__email', 'user__username', 'stripe_customer_id']
    readonly_fields = ['created_at', 'updated_at', 'days_remaining_display']
    
    fieldsets = (
        ('ユーザー情報', {
            'fields': ('user', 'plan')
        }),
        ('Stripe情報', {
            'fields': ('stripe_customer_id', 'stripe_subscription_id'),
            'classes': ('collapse',)
        }),
        ('サブスクリプション情報', {
            'fields': ('status', 'current_period_start', 'current_period_end')
        }),
        ('日時', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def days_remaining_display(self, obj):
        """残り日数を表示"""
        days = obj.days_remaining
        if days is None:
            return "不明"
        elif days == 0:
            return format_html('<span style="color: red;">期限切れ</span>')
        elif days <= 7:
            return format_html('<span style="color: orange;">{}日</span>', days)
        else:
            return f"{days}日"
    days_remaining_display.short_description = "残り日数"

@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'date', 'audio_generations', 'api_calls', 
        'total_duration', 'created_at'
    ]
    list_filter = ['date', 'created_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('ユーザー情報', {
            'fields': ('user', 'date')
        }),
        ('使用量', {
            'fields': ('audio_generations', 'api_calls', 'total_duration')
        }),
        ('日時', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ) 