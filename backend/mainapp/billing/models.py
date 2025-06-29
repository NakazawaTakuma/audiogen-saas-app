from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Plan(models.Model):
    """
    プランモデル - サブスクリプションプランの定義
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="プラン名（例: Free, Pro, Enterprise）",
        verbose_name="プラン名"
    )
    
    display_name = models.CharField(
        max_length=100,
        help_text="表示用のプラン名（例: 無料プラン, プロプラン）",
        verbose_name="表示名"
    )
    
    description = models.TextField(
        help_text="プランの説明",
        verbose_name="説明"
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="月額料金（USD）",
        verbose_name="価格"
    )
    
    # 制限設定
    daily_audio_limit = models.IntegerField(
        default=20,
        validators=[MinValueValidator(0)],
        help_text="1日の音声生成制限回数",
        verbose_name="日次音声生成制限"
    )
    
    max_audio_duration = models.IntegerField(
        default=30,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
        help_text="最大音声長（秒）",
        verbose_name="最大音声長"
    )
    
    max_steps = models.IntegerField(
        default=200,
        validators=[MinValueValidator(10), MaxValueValidator(500)],
        help_text="最大ステップ数",
        verbose_name="最大ステップ数"
    )
    
    # 機能フラグ
    can_use_api = models.BooleanField(
        default=False,
        help_text="API使用可能",
        verbose_name="API使用可能"
    )
    
    can_download = models.BooleanField(
        default=True,
        help_text="音声ダウンロード可能",
        verbose_name="ダウンロード可能"
    )
    
    can_edit_audio = models.BooleanField(
        default=False,
        help_text="音声編集機能使用可能",
        verbose_name="音声編集可能"
    )
    
    # Stripe連携
    stripe_price_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="StripeのPrice ID",
        verbose_name="Stripe Price ID"
    )
    
    # 表示設定
    is_active = models.BooleanField(
        default=True,
        help_text="アクティブなプランかどうか",
        verbose_name="アクティブ"
    )
    
    is_popular = models.BooleanField(
        default=False,
        help_text="人気プランとして表示するか",
        verbose_name="人気プラン"
    )
    
    sort_order = models.IntegerField(
        default=0,
        help_text="表示順序（小さい順）",
        verbose_name="表示順序"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'プラン'
        verbose_name_plural = 'プラン'
        ordering = ['sort_order', 'price']
    
    def __str__(self):
        return f"{self.display_name} (${self.price}/月)"
    
    @property
    def is_free(self):
        """無料プランかどうか"""
        return self.price == 0
    
    @property
    def features_list(self):
        """機能リストを取得"""
        features = []
        if self.can_use_api:
            features.append("API使用可能")
        if self.can_download:
            features.append("音声ダウンロード")
        if self.can_edit_audio:
            features.append("音声編集機能")
        features.append(f"1日{self.daily_audio_limit}回まで生成")
        features.append(f"最大{self.max_audio_duration}秒の音声")
        return features

class UserSubscription(models.Model):
    """
    ユーザーサブスクリプションモデル
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='subscription',
        verbose_name="ユーザー"
    )
    
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        verbose_name="プラン"
    )
    
    stripe_customer_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="StripeのCustomer ID",
        verbose_name="Stripe Customer ID"
    )
    
    stripe_subscription_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="StripeのSubscription ID",
        verbose_name="Stripe Subscription ID"
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'アクティブ'),
            ('canceled', 'キャンセル済み'),
            ('past_due', '支払い遅延'),
            ('unpaid', '未払い'),
            ('trialing', 'トライアル中'),
        ],
        default='active',
        verbose_name="ステータス"
    )
    
    current_period_start = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="現在期間開始日"
    )
    
    current_period_end = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="現在期間終了日"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'ユーザーサブスクリプション'
        verbose_name_plural = 'ユーザーサブスクリプション'
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"
    
    @property
    def is_active(self):
        """アクティブなサブスクリプションかどうか"""
        return self.status == 'active' or self.status == 'trialing'
    
    @property
    def days_remaining(self):
        """残り日数を取得"""
        if not self.current_period_end:
            return None
        remaining = self.current_period_end - timezone.now()
        return max(0, remaining.days)

class UsageLog(models.Model):
    """
    使用量ログモデル
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='usage_logs',
        verbose_name="ユーザー"
    )
    
    date = models.DateField(
        auto_now_add=True,
        verbose_name="使用日"
    )
    
    audio_generations = models.IntegerField(
        default=0,
        verbose_name="音声生成回数"
    )
    
    api_calls = models.IntegerField(
        default=0,
        verbose_name="API呼び出し回数"
    )
    
    total_duration = models.IntegerField(
        default=0,
        verbose_name="総音声長（秒）"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '使用量ログ'
        verbose_name_plural = '使用量ログ'
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.email} - {self.date} ({self.audio_generations}回生成)" 