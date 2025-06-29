from rest_framework import serializers
from .models import Plan, UserSubscription, UsageLog

class PlanSerializer(serializers.ModelSerializer):
    """プランシリアライザー"""
    features_list = serializers.ReadOnlyField()
    is_free = serializers.ReadOnlyField()
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'display_name', 'description', 'price',
            'daily_audio_limit', 'max_audio_duration', 'max_steps',
            'can_use_api', 'can_download', 'can_edit_audio',
            'is_active', 'is_popular', 'sort_order',
            'features_list', 'is_free'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserSubscriptionSerializer(serializers.ModelSerializer):
    """ユーザーサブスクリプションシリアライザー"""
    plan = PlanSerializer(read_only=True)
    plan_id = serializers.IntegerField(write_only=True)
    days_remaining = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'plan_id', 'status',
            'current_period_start', 'current_period_end',
            'days_remaining', 'is_active', 'created_at'
        ]
        read_only_fields = [
            'id', 'user', 'stripe_customer_id', 'stripe_subscription_id',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        plan_id = validated_data.pop('plan_id')
        validated_data['plan_id'] = plan_id
        return super().create(validated_data)

class UsageLogSerializer(serializers.ModelSerializer):
    """使用量ログシリアライザー"""
    class Meta:
        model = UsageLog
        fields = [
            'id', 'user', 'date', 'audio_generations',
            'api_calls', 'total_duration', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'date', 'created_at', 'updated_at']

class PlanComparisonSerializer(serializers.Serializer):
    """プラン比較用シリアライザー"""
    current_plan = PlanSerializer()
    available_plans = PlanSerializer(many=True)
    current_usage = serializers.DictField()
    usage_limit = serializers.IntegerField()
    usage_percentage = serializers.FloatField()

class SubscriptionStatusSerializer(serializers.Serializer):
    """サブスクリプション状況シリアライザー"""
    has_subscription = serializers.BooleanField()
    plan = PlanSerializer(required=False)
    status = serializers.CharField(required=False)
    days_remaining = serializers.IntegerField(required=False)
    current_usage = serializers.DictField()
    usage_limit = serializers.IntegerField()
    usage_percentage = serializers.FloatField() 