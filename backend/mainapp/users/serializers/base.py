from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from ..models import PendingUser
from ..validators import validate_username, validate_password_strength
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

User = get_user_model()  # カスタムユーザーモデル対応

# 既存のパスワードバリデータの日本語化
def validate_password_jp(value):
    try:
        validate_password(value)
    except DjangoValidationError as e:
        error_messages = {
            'This password is too short. It must contain at least 8 characters.': 'パスワードが短すぎます。8文字以上必要です。',
            'This password is too common.': 'このパスワードは一般的すぎます。',
            'This password is entirely numeric.': 'パスワードは数字のみではいけません。',
            'This password is too similar to your username.': 'パスワードがユーザー名と似すぎています。',
            'This password is too similar to your email.': 'パスワードがメールアドレスと似すぎています。',
        }
        raise serializers.ValidationError([error_messages.get(str(msg), str(msg)) for msg in e.messages])



class UserSerializer(serializers.ModelSerializer):
    """
    本登録済みユーザー表示用シリアライザ。
    ユーザーそのものの情報（id, username, email, display_name, profile_image フィールド等）を返す。
    """
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'display_name', 'profile_image',
            'bio', 
            'is_active', 'is_staff', 'date_joined', 'last_login',
            'api_key',
        ]
        read_only_fields = ['id', 'username', 'slug', 'email', 'date_joined', 'last_login', 'is_active', 'is_staff']

    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return request.build_absolute_uri(obj.profile_image.url)
        return ""



class PendingUserRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=User.objects.filter(is_active=True),
            message="このメールアドレスはすでに使用されています。"
        )]
    )
    username = serializers.CharField(
        required=True,
        validators=[
            validate_username,   # 上記で作成したバリデータを使う
            UniqueValidator(
                queryset=User.objects.filter(is_active=True),
                message="このユーザー名は既に使用されています。"
            )
        ]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password_strength],
        help_text="8文字以上、半角英大文字・英小文字・数字・記号のうち少なくとも2種類を含めてください（全角禁止）。"
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": "パスワードと確認用パスワードが一致しません。"}
            )
        return super().validate(attrs)

        
class RegisterSerializer(serializers.ModelSerializer):
    """
    ユーザー登録用シリアライザ。
    パスワード・パスワード確認・バリデーションはここで行う。
    """
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="このメールアドレスは既に使用されています。"
            )
        ]
    )
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="このユーザー名は既に使用されています。"
            )
        ]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password_jp])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "パスワードが一致しません。"})
        return super().validate(attrs)

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # create_user()→デフォルトで is_active=True になる場合があるので、
        # 後で View 側で is_active=False に上書きすることにする。
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    EmailまたはUsernameでログインを試みるカスタムシリアライザ
    """
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 親クラスで定義された username_field の必須設定をオフにする
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        # identifier と password の取得
        identifier = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')

        # 入力チェック
        if not identifier or not password:
            raise AuthenticationFailed('ユーザー名またはメールアドレスとパスワードは両方必要です。')

        # ユーザー検索
        user = User.objects.filter(username=identifier).first()
        if not user:
            user = User.objects.filter(email=identifier).first()

        # 認証チェック
        if not user or not user.check_password(password):
            raise AuthenticationFailed('入力されたログイン情報が正しくありません。')

        # username_field に実際の username をセットして親に渡す
        attrs[self.username_field] = user.get_username()
        return super().validate(attrs)






# =============================================================================
# ① PasswordResetRequestSerializer （メールアドレス入力用）
# =============================================================================
class PasswordResetRequestSerializer(serializers.Serializer):
    """
    メールアドレスを受け取り、パスワードリセット用メールを送信するためのシリアライザ
    """
    email = serializers.EmailField(
        required=True,
        help_text=_("パスワードリセット用のメールを送信するための、登録済みメールアドレスを指定してください。")
    )

    def validate_email(self, value):
        """
        - ユーザーが存在しない場合は、同様に 404 を返すのではなく
          「エラー」として扱わず、あえて汎用メッセージを返して情報を漏らさない設計もあります。
          ここでは「ユーザーが存在しないときは 404」を返す実装にします。
        """
        email = value.strip().lower()
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(_("未登録のメールアドレスです。"), code="email_not_found")
        return email


# =============================================================================
# ② PasswordResetConfirmSerializer （リセット確定用）
# =============================================================================
class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Frontend から受け取る
      - uid (urlsafe_base64_encode で生成された文字列)
      - token (PasswordResetTokenGenerator で生成された文字列)
      - new_password
      - re_new_password
    をバリデートし、ユーザーのパスワードを変更します。
    """
    uid = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        help_text=_("新しいパスワード（8～64 文字、全角禁止、空白禁止、2種類以上の文字カテゴリを含む）")
    )
    re_new_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        uidb64 = attrs.get("uid")
        token = attrs.get("token")
        new_password = attrs.get("new_password")
        re_new_password = attrs.get("re_new_password")


        # 1) パスワード一致チェック
        if new_password != re_new_password:
            raise serializers.ValidationError({"re_new_password": _("パスワードと確認用パスワードが一致しません。")})

        # 2) UID → ユーザー取得チェック
        try:
            # auto-pad uidb64 (missing '=' characters) before decoding
            padded = uidb64 + "=" * ((4 - len(uidb64) % 4) % 4)
            uid_int = force_str(urlsafe_base64_decode(padded))
            user = User.objects.get(pk=uid_int)

        except Exception:
            raise serializers.ValidationError(_("無効なリンクです。"))

        # 3) トークン検証
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            raise serializers.ValidationError(_("有効期限が切れているか、無効なリンクです。新しいパスワードリセット用のメールを送信してください。"))

        # 4) パスワード強度チェック（上で定義した validate_password_strength() を使う）
        from .validators import validate_password_strength
        try:
            validate_password_strength(new_password)
        except DjangoValidationError as e:
            # DjangoValidationError を DRF の形式に変換
            raise serializers.ValidationError({"new_password": list(e.messages)})

        # 5) Django の標準パスワードバリデータも併用
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        # 問題なければ attrs に user を追加しておく
        attrs["user_instance"] = user
        return attrs

    def save(self, **kwargs):
        """
        validate() が通った後に呼ばれる。
        self.validated_data["user_instance"] がセットされているので、
        そのユーザーのパスワードを new_password に置き換えます。
        """
        user = self.validated_data["user_instance"]
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        return user