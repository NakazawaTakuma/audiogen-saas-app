from django.urls import path
from .views.base import (
    RegisterAPIView,
    EmailOrUsernameTokenObtainPairView as TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
    UserRetrieveUpdateAPIView,
    VerifyEmailAPIView,
    ResendVerificationAPIView,
    CheckEmailVerificationAPIView,
    PasswordResetRequestAPIView,      
    PasswordResetConfirmAPIView,     
    PasswordResetVerifyAPIView,
    ReissueApiKeyView,
    DeleteApiKeyView,
)
from .views.profile import (UserProfileAPIView,UserProfileBySlugAPIView)


urlpatterns = [
     # ── 仮登録・本登録関連 ──
    path('register/', RegisterAPIView.as_view(), name='register'),

    # ── JWT トークン関連 ──
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # ── メール確認関連 ──
    path('resend-verification/', ResendVerificationAPIView.as_view(), name='resend-verification'),
    path('verify-email/', VerifyEmailAPIView.as_view(), name='email-verify'),
    path('check-verification/', CheckEmailVerificationAPIView.as_view(), name='check-verification'),

    # ── パスワードリセット関連 ──
    path('password-reset/', PasswordResetRequestAPIView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmAPIView.as_view(), name='password-reset-confirm'),
    path("password-reset-verify/", PasswordResetVerifyAPIView.as_view(), name="password-reset-verify"),

    # ── ユーザープロフィール取得・更新 ──
    path('profile/', UserProfileAPIView.as_view(),  name='user-profile' ),#ログイン中ユーザー
    path('profile/<slug:slug>/', UserProfileBySlugAPIView.as_view(), name='user-profile-by-slug'),# slug から
   
    # ── ユーザー全情報取得・更新 ──
    path('me/', UserRetrieveUpdateAPIView.as_view(), name='user-me'),#ログイン中ユーザー

    path('reissue-api-key/', ReissueApiKeyView.as_view(), name='reissue-api-key'),
    path('delete-api-key/', DeleteApiKeyView.as_view(), name='delete-api-key'),
]

