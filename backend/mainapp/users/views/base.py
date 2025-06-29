# mainapp/users/views.py
import uuid 
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str  # Django 4.0+ なら force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from rest_framework import viewsets, permissions, generics, status, views
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer

from ..models import User, PendingUser
from ..serializers.base import (
    UserSerializer,
    RegisterSerializer,
    PendingUserRegisterSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
    PasswordResetRequestSerializer,       
    PasswordResetConfirmSerializer,       
    
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView as DefaultTokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]



class UserRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    ログイン中ユーザー情報取得・更新（display_name や profile_image も含めて）
    GET: ユーザー情報全体を返す
    PATCH: 一部更新する
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        """
        PATCH で来た場合、profile_image 変更も考慮して動かす
        """
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmailOrUsernameTokenObtainPairView(DefaultTokenObtainPairView):
    """
    login/ エンドポイントで
    メールアドレス or ユーザー名 + パスワード が受け付けられるようにするビュー
    """
    serializer_class = EmailOrUsernameTokenObtainPairSerializer
    # 常に JSON レンダラーを使用
    renderer_classes = [JSONRenderer]






class RegisterAPIView(generics.CreateAPIView):
    """
    ユーザー仮登録エンドポイント。
    - PendingUser を作成し、確認メールを送信して 201 を返す
    - email, username が既に本登録済みであればエラー
    - 仮登録済み（PendingUser）であれば、username/password_hash も更新してメール再送信
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]
    serializer_class = PendingUserRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        email = validated_data['email']
        username = validated_data['username']
        raw_password = validated_data['password']

        # 1) 本登録済みユーザーがいないかチェック（is_active=True）
        if User.objects.filter(email=email, is_active=True).exists():
            return Response(
                {'error': 'このメールアドレスはすでに登録済みです。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username, is_active=True).exists():
            return Response(
                {'error': 'このユーザー名はすでに登録済みです。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2) 有効期限内の PendingUser がすでにあるかチェック
        pending = PendingUser.objects.filter(email=email).first()
        if pending:
            if pending.is_expired():
                # 期限切れなら古いレコードを削除して新規作成に移る
                pending.delete()
                pending = None
            else:
                # まだ有効期限内 → ここで「username・password_hash も更新」してからトークン再発行
                # (a) 別の PendingUser or 本登録済み User に username が使われていないかチェック
                if User.objects.filter(username=username, is_active=True).exists() \
                   or PendingUser.objects.filter(username=username).exclude(pk=pending.pk).exists():
                    return Response(
                        {'error': 'このユーザー名はすでに使用されています。'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # (b) username と password_hash を上書き
                pending.username = username
                pending.password_hash = make_password(raw_password)

                # (c) トークン・作成日時を更新
                pending.token = uuid.uuid4()
                pending.created_at = timezone.now()
                pending.save()

                # (d) メール再送信して終了
                self._send_verification_email(pending)
                return Response(
                    {'message': '確認メールを再送しました。'},
                    status=status.HTTP_200_OK
                )

        # 3) 新規に PendingUser を作成
        if pending is None:
            # 3-a) username が他の PendingUser や User に使われていないか再チェック
            if User.objects.filter(username=username, is_active=True).exists() \
               or PendingUser.objects.filter(username=username).exists():
                return Response(
                    {'error': 'このユーザー名はすでに使用されています。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pending = PendingUser(
                email=email,
                username=username,
            )
            pending.password_hash = make_password(raw_password)
            pending.token = uuid.uuid4()
            pending.save()

        # 4) 確認メールを送信
        self._send_verification_email(pending)
        return Response(
            {"message": "仮登録が完了しました。確認メールを送信しました。"},
            status=status.HTTP_201_CREATED
        )

    def _send_verification_email(self, pending: PendingUser):
        """
        PendingUser に対して確認メールを送信するユーティリティ
        """
        uidb64 = urlsafe_base64_encode(force_bytes(pending.pk))
        token = str(pending.token)
        current_site = settings.SITE_DOMAIN.rstrip('/')
        verify_path = reverse('email-verify')  # URL /api/users/verify-email/?uid=...&token=...
        verification_link = f"{current_site}{verify_path}?uid={uidb64}&token={token}"

        subject = "【YourSite】メールアドレス確認のお願い"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = pending.email

        html_content = render_to_string('users/email_verification_email.html', {
            'username': pending.username,
            'verification_link': verification_link,
        })
        text_content = render_to_string('users/email_verification_email.txt', {
            'username': pending.username,
            'verification_link': verification_link,
        })

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send()

class VerifyEmailAPIView(views.APIView):
    """
    メール内リンクをクリックしたときに飛ぶビュー。
    - uid, token を検証し、有効なら PendingUser → User テーブルに移行し本登録完了ページを返す
    """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [TemplateHTMLRenderer]

    def get(self, request, *args, **kwargs):
        uidb64 = request.GET.get('uid')
        token = request.GET.get('token')
        context = {}

        # uid decode
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            pending = PendingUser.objects.get(pk=uid)
        except Exception:
            context['error'] = "無効な確認リンクです。"
            context['home_url'] = settings.FRONTEND_URL
            return Response(
                context,
                template_name='users/email_verification_invalid.html',
                status=status.HTTP_400_BAD_REQUEST
            )

        # 期限切れチェック
        if pending.is_expired():
            context['error'] = "トークンの有効期限が切れています。再度登録してください。"
            context['home_url'] = settings.FRONTEND_URL
            # 期限切れなので削除しておく
            pending.delete()
            return Response(
                context,
                template_name='users/email_verification_invalid.html',
                status=status.HTTP_400_BAD_REQUEST
            )

        # token チェック
        if str(pending.token) != token:
            context['error'] = "トークンが無効または一致しません。"
            context['home_url'] = settings.FRONTEND_URL
            return Response(
                context,
                template_name='users/email_verification_invalid.html',
                status=status.HTTP_400_BAD_REQUEST
            )

        # 本登録(User テーブルに移行)
        try:
            # すでに同じメール／ユーザー名で登録済み（race condition の確認）
            if User.objects.filter(email=pending.email, is_active=True).exists():
                context['error'] = "このメールアドレスはすでに登録済みです。"
                context['home_url'] = settings.FRONTEND_URL
                pending.delete()
                return Response(
                    context,
                    template_name='users/email_verification_invalid.html',
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_user = User(
                username=pending.username,
                email=pending.email,
                is_active=True
            )
            # 保存前にパスワードハッシュをセット
            new_user.password = pending.password_hash
            new_user.save()

            # PendingUser を削除
            pending.delete()

            # 完了ページ (HTML) を返す
            context['message'] = "メールアドレスの確認が完了しました。"
            context['home_url'] = settings.FRONTEND_URL
            return Response(
                context,
                template_name='users/email_verification_complete.html',
                status=status.HTTP_200_OK
            )

        except Exception:
            context['error'] = "登録処理中にエラーが発生しました。サポートへお問い合わせください。"
            context['home_url'] = settings.FRONTEND_URL
            # 万が一のため PendingUser は残しておく or ログを確認する
            return Response(
                context,
                template_name='users/email_verification_invalid.html',
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendVerificationAPIView(views.APIView):
    """
    確認が済んでいないメールアドレスに対して、確認メールを再送信するエンドポイント。
    POST ボディ: { "email": "xxx@example.com" }
    """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'メールアドレスを入力してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # すでに本登録済みユーザーならエラー
        if User.objects.filter(email=email, is_active=True).exists():
            return Response(
                {'error': 'このメールアドレスはすでに確認済みです。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # PendingUser を探す
        try:
            pending = PendingUser.objects.get(email=email)
        except PendingUser.DoesNotExist:
            return Response(
                {'error': '仮登録されていないメールアドレスです。'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 期限切れチェック
        if pending.is_expired():
            pending.delete()
            return Response(
                {'error': 'トークンの有効期限が切れています。再度新規登録してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 新しいトークンを発行して再送信
        pending.token = uuid.uuid4()
        pending.created_at = timezone.now()
        pending.save()

        # ★修正: RegisterAPIView のインスタンスを生成してメール送信ユーティリティを呼び出す
        #           （他にユーティリティ関数を切り出しても問題ありません）
        RegisterAPIView()._send_verification_email(pending)
        return Response(
            {'message': '確認メールを再送信しました。'},
            status=status.HTTP_200_OK
        )


class CheckEmailVerificationAPIView(views.APIView):
    """
    フロントで「このメールアドレスの確認が完了したか？」を
    ポーリングなどで確認できるようにするエンドポイント。

    - (1) まず User テーブルを検索し、存在すれば is_active を返す
    - (2) User に存在しなければ PendingUser テーブルを検索し、
           レコードがあれば「まだ仮登録中なので未確認」として { verified: false } を返す
    - (3) 両方に存在しなければ「存在しないメールアドレス」として 404 を返す
    """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        email = request.GET.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'メールアドレスを指定してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # (1) User テーブルを探す
        try:
            user = User.objects.get(email=email)
            # User が見つかった時点で is_active を返す（本登録済み or 承認済みかどうか）
            return Response(
                {'verified': bool(user.is_active)},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            pass  # 次に PendingUser を探しに行く

        # (2) PendingUser テーブルを探す
        try:
            pending = PendingUser.objects.get(email=email)
            # 仮登録中のレコードがあれば、未確認（まだ承認リンクをクリックしていない）とみなす
            return Response(
                {'verified': False},
                status=status.HTTP_200_OK
            )
        except PendingUser.DoesNotExist:
            # (3) User も PendingUser も存在しない → 本当に存在しないメール
            return Response(
                {'error': '未登録のメールアドレスです。'},
                status=status.HTTP_404_NOT_FOUND
            )








# =============================================================================
# ① PasswordResetRequestAPIView: メールアドレスを受け取ってメール送信
# =============================================================================
class PasswordResetRequestAPIView(views.APIView):
    """
    クライアントから { "email": "xxx@example.com" } を受け取り、
    そのメールアドレスをもつ active ユーザーが存在すれば
    - uidb64, token を生成
    - 【FRONTEND_URL】/reset-password?uid=xxx&token=yyy
      このリンクを本文に含めたメールを送信する
    """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.get(email=email, is_active=True)

        # 1) UID (base64),  トークン (PasswordResetTokenGenerator) を生成
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)

        # 2) パスワードリセット用リンクを生成
        #    フロントの URL（/reset-password?uid=...&token=...）を参照する
        frontend_base = settings.FRONTEND_URL.rstrip("/")  # ex. http://localhost:5173
        reset_path = "/reset-password"  # フロントで作成したルート
        reset_link = f"{frontend_base}{reset_path}?uid={uidb64}&token={token}"

        # 3) メール送信
        subject = "【YourSite】パスワードリセットのご案内"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = user.email

        html_content = render_to_string("users/password_reset_email.html", {
            "username": user.username,
            "reset_link": reset_link,
        })
        text_content = render_to_string("users/password_reset_email.txt", {
            "username": user.username,
            "reset_link": reset_link,
        })

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send()

        return Response({"message": "パスワードリセット用メールを送信しました。"}, status=status.HTTP_200_OK)


# =============================================================================
# ② PasswordResetConfirmAPIView: UID, token, 新パスワード でパスワードを更新
# =============================================================================
class PasswordResetConfirmAPIView(views.APIView):
    """
    フロントから送られてきた
      { uid, token, new_password, re_new_password }
    を受け取り、トークン検証後にユーザーのパスワードを更新する。
    """
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # save() 内でパスワード更新を行う
        serializer.save()
        return Response({"message": "パスワードが正常に更新されました。"}, status=status.HTTP_200_OK)


        
class PasswordResetVerifyAPIView(views.APIView):
    """
    フロントから uid/token を GET で受け取り、トークンが有効かチェックするエンドポイント。
    成功: {"valid": true} を返す（ステータス 200）。
    失敗: 400 または 401 でエラーメッセージを返す。
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        uidb64 = request.GET.get("uid", "")
        token = request.GET.get("token", "")

        if not uidb64 or not token:
            return Response(
                {"detail": "uid または token が指定されていません。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # (1) uid デコード
        try:
            # 足りない = を自動パディング
            padded = uidb64 + "=" * ((4 - len(uidb64) % 4) % 4)
            uid_int = force_str(urlsafe_base64_decode(padded))
            user = User.objects.get(pk=uid_int, is_active=True)
        except Exception:
            return Response(
                {"detail": "無効なリンクです。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # (2) トークン検証
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"detail": "リンクの有効期限が切れているか、無効なリンクです。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 成功: トークン有効
        return Response({"valid": True}, status=status.HTTP_200_OK)

class ReissueApiKeyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.api_key = uuid.uuid4().hex
        user.save()
        return Response({"api_key": user.api_key})

class DeleteApiKeyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.api_key = None
        user.save()
        return Response({'message': 'APIキーを削除しました。', 'api_key': None})