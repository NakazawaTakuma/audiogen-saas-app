import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, Group, Permission
from PIL import Image
import io
from django.core.files.base import ContentFile
from django.utils.text import slugify

class User(AbstractUser):
    """
    コア認証ユーザーモデル
    """
    username = models.CharField(
        max_length=22,
        unique=True,
        help_text="一意のユーザー名を指定します",
        verbose_name="ユーザー名",
    )

    email = models.EmailField(unique=True, help_text="一意のメールアドレスを使用します")

    # スラッグフィールドを追加
    slug = models.SlugField(
        max_length=22,
        unique=True,
        help_text="URL用の一意のスラッグ",
        verbose_name="スラッグ",
    )

    # ──────────────────────────────────────────────────────────────
    # プロフィール関連フィールド
    display_name = models.CharField(
        max_length=40,
        blank=True,
        help_text="画面上に表示される名前",
        verbose_name="表示名",
    )
    profile_image = models.ImageField(
        upload_to='profile_images/',
        blank=True,
        null=True,
        help_text="プロフィール画像をアップロード（JPEG/PNG/GIF, 最大10MBまで）",
        verbose_name="プロフィール画像",
    )
    bio = models.TextField(
        blank=True,
        help_text="自己紹介文",
        verbose_name="自己紹介",
    )

    # ──────────────────────────────────────────────────────────────

    groups = models.ManyToManyField(
        Group,
        related_name='mainapp_users',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='mainapp_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    plan_type = models.CharField(
        max_length=20,
        default="free",
        choices=[("free", "無料"), ("pro", "有料")],
        verbose_name="プラン種別"
    )

    api_key = models.CharField(
        max_length=40,
        unique=True,
        blank=True,
        null=True,
        help_text="外部API連携用のAPIキー"
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
        ordering = ['-date_joined']

    def save(self, *args, **kwargs):
        # email を必ず小文字化
        if self.email:
            self.email = self.email.strip().lower()

        # 新規作成時に display_name が空なら username をコピー
        if not self.pk:
            if not self.display_name:
                self.display_name = self.username
            
            # スラッグが空の場合、usernameから生成
            if not self.slug:
                self.slug = slugify(self.username)
            # APIキーが空なら自動生成
            if not self.api_key:
                self.api_key = uuid.uuid4().hex

        super().save(*args, **kwargs)








class PendingUser(models.Model):
    """
    仮登録ユーザーモデル
    - 本登録前にトークンを付与してメール送信し、
      確認後に本登録の User テーブルに移行する。
    """
    username = models.CharField(max_length=150, help_text="一意のユーザー名を指定します")
    email = models.EmailField(help_text="一意のメールアドレスを使用します")
    password_hash = models.CharField(max_length=128, help_text="ハッシュ化済みパスワードを保存")

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, help_text="メール確認用の一意トークン")
    created_at = models.DateTimeField(auto_now_add=True, help_text="仮登録日時")
    # たとえば 24 時間以内に確認がなければバッチで削除する前提

    class Meta:
        verbose_name = '仮登録ユーザー'
        verbose_name_plural = '仮登録ユーザー'
        indexes = [
            models.Index(fields=['email'], name='pending_email_idx'),
        ]

    def is_expired(self, hours=24):
        """
        仮登録が「hours」時間を過ぎていれば期限切れとみなす
        """
        return timezone.now() > self.created_at + timezone.timedelta(hours=hours)

    def __str__(self):
        return f"PendingUser(email={self.email}, created_at={self.created_at})"
