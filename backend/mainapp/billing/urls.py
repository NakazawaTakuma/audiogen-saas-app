from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateCheckoutSessionView, StripeWebhookView, PlanViewSet, UserSubscriptionViewSet, UsageLogViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', UserSubscriptionViewSet, basename='subscription')
router.register(r'usage', UsageLogViewSet, basename='usage')

urlpatterns = [
    # Stripe関連
    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # プラン管理API
    path('api/', include(router.urls)),
] 