import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from datetime import date
from .models import Plan, UserSubscription, UsageLog
from .serializers import (
    PlanSerializer, UserSubscriptionSerializer, UsageLogSerializer,
    PlanComparisonSerializer, SubscriptionStatusSerializer
)
from django.db import transaction

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'error': 'プランIDが必要です'}, status=400)
        
        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({'error': '指定されたプランが見つかりません'}, status=404)
        
        if not plan.stripe_price_id:
            return Response({'error': 'このプランは現在利用できません'}, status=400)
        
        YOUR_DOMAIN = "http://localhost:5173"
        
        # 既存のサブスクリプションがある場合は取得
        existing_subscription = None
        try:
            existing_subscription = request.user.subscription
        except UserSubscription.DoesNotExist:
            pass
        
        session_data = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price': plan.stripe_price_id,
                'quantity': 1,
            }],
            'mode': 'subscription',
            'customer_email': request.user.email,
            'success_url': YOUR_DOMAIN + '/mypage?success=true',
            'cancel_url': YOUR_DOMAIN + '/pricing?canceled=true',
            'metadata': {
                'user_id': str(request.user.id),
                'plan_id': str(plan.id),
            }
        }
        
        # 既存のサブスクリプションがある場合は、StripeのCustomer IDを使用
        if existing_subscription and existing_subscription.stripe_customer_id:
            session_data['customer'] = existing_subscription.stripe_customer_id
        
        session = stripe.checkout.Session.create(**session_data)
        return Response({'id': session.id, 'url': session.url})

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = []  # 認証不要

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
        if not endpoint_secret:
            return HttpResponse(status=500)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'checkout.session.completed':
            self.handle_checkout_completed(data_object)
        elif event_type == 'customer.subscription.created':
            self.handle_subscription_event(data_object)
        elif event_type == 'customer.subscription.updated':
            self.handle_subscription_event(data_object)
        elif event_type == 'customer.subscription.deleted':
            self.handle_subscription_event(data_object, deleted=True)
        elif event_type == 'invoice.payment_failed':
            self.handle_payment_failed(data_object)

        return HttpResponse(status=200)

    def handle_checkout_completed(self, session):
        # ここでは主にcustomer_email, customer, subscription, metadataを取得
        customer_email = session.get('customer_email')
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        metadata = session.get('metadata', {})
        from mainapp.users.models import User
        try:
            user = User.objects.get(email=customer_email)
        except User.DoesNotExist:
            return
        # サブスク作成イベントで本登録するのでここではcustomer_idだけ保存しておく
        with transaction.atomic():
            sub, _ = UserSubscription.objects.get_or_create(
                user=user,
                defaults={
                    'stripe_customer_id': customer_id,
                    'status': 'trialing',
                }
            )
            if not sub.stripe_customer_id:
                sub.stripe_customer_id = customer_id
                sub.save()

    def handle_subscription_event(self, subscription, deleted=False):
        # Stripeのサブスク情報からユーザー・プラン・期間・ステータスを更新
        customer_id = subscription.get('customer')
        subscription_id = subscription.get('id')
        status = subscription.get('status')
        current_period_start = subscription.get('current_period_start')
        current_period_end = subscription.get('current_period_end')
        plan_price_id = None
        plan_obj = None
        # サブスクのプランIDを取得
        items = subscription.get('items', {}).get('data', [])
        if items:
            plan_price_id = items[0]['price']['id']
            try:
                plan_obj = Plan.objects.get(stripe_price_id=plan_price_id)
            except Plan.DoesNotExist:
                plan_obj = None
        from mainapp.users.models import User
        # 顧客IDからユーザー特定
        user = None
        try:
            user_sub = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
            user = user_sub.user
        except UserSubscription.DoesNotExist:
            # 顧客IDからユーザーを特定
            try:
                user_sub = UserSubscription.objects.get(stripe_customer_id=customer_id)
                user = user_sub.user
            except UserSubscription.DoesNotExist:
                # 顧客IDからUserを特定
                try:
                    customer = stripe.Customer.retrieve(customer_id)
                    customer_email = customer.get('email')
                    user = User.objects.get(email=customer_email)
                except Exception:
                    return
        if not user:
            return
        # サブスクリプションを作成・更新
        with transaction.atomic():
            sub, _ = UserSubscription.objects.get_or_create(
                user=user,
                defaults={
                    'plan': plan_obj,
                    'stripe_customer_id': customer_id,
                    'stripe_subscription_id': subscription_id,
                    'status': status,
                    'current_period_start': timezone.datetime.fromtimestamp(current_period_start, tz=timezone.utc) if current_period_start else None,
                    'current_period_end': timezone.datetime.fromtimestamp(current_period_end, tz=timezone.utc) if current_period_end else None,
                }
            )
            # 更新
            if plan_obj:
                sub.plan = plan_obj
            sub.stripe_customer_id = customer_id
            sub.stripe_subscription_id = subscription_id
            sub.status = 'canceled' if deleted else status
            if current_period_start:
                sub.current_period_start = timezone.datetime.fromtimestamp(current_period_start, tz=timezone.utc)
            if current_period_end:
                sub.current_period_end = timezone.datetime.fromtimestamp(current_period_end, tz=timezone.utc)
            sub.save()

    def handle_payment_failed(self, invoice):
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return
        try:
            sub = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
            sub.status = 'past_due'
            sub.save()
        except UserSubscription.DoesNotExist:
            pass

class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """プラン管理ビューセット"""
    queryset = Plan.objects.filter(is_active=True).order_by('sort_order', 'price')
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]  # 認証不要に変更
    
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """プラン比較情報を取得"""
        # 認証が必要なため、認証チェックを追加
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = request.user
        
        # 現在のプランを取得
        try:
            subscription = user.subscription
            current_plan = subscription.plan
        except UserSubscription.DoesNotExist:
            current_plan = None
        
        # 利用可能なプランを取得
        available_plans = self.get_queryset()
        
        # 現在の使用量を取得
        today = date.today()
        try:
            usage_log = UsageLog.objects.get(user=user, date=today)
            current_usage = {
                'audio_generations': usage_log.audio_generations,
                'api_calls': usage_log.api_calls,
                'total_duration': usage_log.total_duration
            }
        except UsageLog.DoesNotExist:
            current_usage = {
                'audio_generations': 0,
                'api_calls': 0,
                'total_duration': 0
            }
        
        # 制限値を取得
        if current_plan:
            usage_limit = current_plan.daily_audio_limit
        else:
            # デフォルトプランの制限
            usage_limit = 20
        
        # 使用率を計算
        usage_percentage = (current_usage['audio_generations'] / usage_limit * 100) if usage_limit > 0 else 0
        
        data = {
            'current_plan': PlanSerializer(current_plan).data if current_plan else None,
            'available_plans': PlanSerializer(available_plans, many=True).data,
            'current_usage': current_usage,
            'usage_limit': usage_limit,
            'usage_percentage': round(usage_percentage, 1)
        }
        
        serializer = PlanComparisonSerializer(data)
        return Response(serializer.data)

class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """ユーザーサブスクリプション管理ビューセット"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """サブスクリプション状況を取得"""
        user = request.user
        
        try:
            subscription = user.subscription
            has_subscription = True
            plan = subscription.plan
            status = subscription.status
            days_remaining = subscription.days_remaining
        except UserSubscription.DoesNotExist:
            has_subscription = False
            plan = None
            status = None
            days_remaining = None
        
        # 現在の使用量を取得
        today = date.today()
        try:
            usage_log = UsageLog.objects.get(user=user, date=today)
            current_usage = {
                'audio_generations': usage_log.audio_generations,
                'api_calls': usage_log.api_calls,
                'total_duration': usage_log.total_duration
            }
        except UsageLog.DoesNotExist:
            current_usage = {
                'audio_generations': 0,
                'api_calls': 0,
                'total_duration': 0
            }
        
        # 制限値を取得
        if plan:
            usage_limit = plan.daily_audio_limit
        else:
            usage_limit = 20  # デフォルト制限
        
        # 使用率を計算
        usage_percentage = (current_usage['audio_generations'] / usage_limit * 100) if usage_limit > 0 else 0
        
        data = {
            'has_subscription': has_subscription,
            'plan': PlanSerializer(plan).data if plan else None,
            'status': status,
            'days_remaining': days_remaining,
            'current_usage': current_usage,
            'usage_limit': usage_limit,
            'usage_percentage': round(usage_percentage, 1)
        }
        
        serializer = SubscriptionStatusSerializer(data)
        return Response(serializer.data)

class UsageLogViewSet(viewsets.ReadOnlyModelViewSet):
    """使用量ログ管理ビューセット"""
    serializer_class = UsageLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UsageLog.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def increment_audio_generation(self, request):
        """音声生成回数を増加"""
        user = request.user
        duration = request.data.get('duration', 0)
        
        today = date.today()
        usage_log, created = UsageLog.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'audio_generations': 0,
                'api_calls': 0,
                'total_duration': 0
            }
        )
        
        usage_log.audio_generations += 1
        usage_log.total_duration += duration
        usage_log.save()
        
        return Response({
            'message': '使用量を更新しました',
            'current_usage': {
                'audio_generations': usage_log.audio_generations,
                'api_calls': usage_log.api_calls,
                'total_duration': usage_log.total_duration
            }
        })
    
    @action(detail=False, methods=['post'])
    def increment_api_call(self, request):
        """API呼び出し回数を増加"""
        user = request.user
        
        today = date.today()
        usage_log, created = UsageLog.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'audio_generations': 0,
                'api_calls': 0,
                'total_duration': 0
            }
        )
        
        usage_log.api_calls += 1
        usage_log.save()
        
        return Response({
            'message': 'API使用量を更新しました',
            'current_usage': {
                'audio_generations': usage_log.audio_generations,
                'api_calls': usage_log.api_calls,
                'total_duration': usage_log.total_duration
            }
        }) 