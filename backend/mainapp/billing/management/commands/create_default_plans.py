from django.core.management.base import BaseCommand
from mainapp.billing.models import Plan

class Command(BaseCommand):
    help = 'デフォルトプランを作成します'

    def handle(self, *args, **options):
        # 既存のプランを削除（オプション）
        if options.get('clear_existing'):
            Plan.objects.all().delete()
            self.stdout.write(self.style.WARNING('既存のプランを削除しました'))

        # 無料プラン
        free_plan, created = Plan.objects.get_or_create(
            name='free',
            defaults={
                'display_name': '無料プラン',
                'description': '気軽にAI音声を体験できる無料プランです。',
                'price': 0.00,
                'daily_audio_limit': 20,
                'max_audio_duration': 30,
                'max_steps': 200,
                'can_use_api': False,
                'can_download': True,
                'can_edit_audio': False,
                'is_active': True,
                'is_popular': False,
                'sort_order': 1,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'無料プランを作成しました: {free_plan.display_name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'無料プランは既に存在します: {free_plan.display_name}')
            )

        # プロプラン
        pro_plan, created = Plan.objects.get_or_create(
            name='pro',
            defaults={
                'display_name': 'プロプラン',
                'description': '本格的なAI音声生成ができるプロプランです。',
                'price': 9.99,
                'daily_audio_limit': 100,
                'max_audio_duration': 60,
                'max_steps': 300,
                'can_use_api': True,
                'can_download': True,
                'can_edit_audio': True,
                'is_active': True,
                'is_popular': True,
                'sort_order': 2,
                'stripe_price_id': 'price_1ReAElCcYSfBLhAP3hlvsL42',  # 実際のStripe Price IDに変更してください
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'プロプランを作成しました: {pro_plan.display_name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'プロプランは既に存在します: {pro_plan.display_name}')
            )

        # エンタープライズプラン
        enterprise_plan, created = Plan.objects.get_or_create(
            name='enterprise',
            defaults={
                'display_name': 'エンタープライズプラン',
                'description': '大規模なプロジェクトに対応するエンタープライズプランです。',
                'price': 29.99,
                'daily_audio_limit': 500,
                'max_audio_duration': 120,
                'max_steps': 500,
                'can_use_api': True,
                'can_download': True,
                'can_edit_audio': True,
                'is_active': True,
                'is_popular': False,
                'sort_order': 3,
                'stripe_price_id': 'price_1OqX2X2X2X2X2X2X2X2X2X2X',  # 実際のStripe Price IDに変更してください
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'エンタープライズプランを作成しました: {enterprise_plan.display_name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'エンタープライズプランは既に存在します: {enterprise_plan.display_name}')
            )

        self.stdout.write(
            self.style.SUCCESS('デフォルトプランの作成が完了しました！')
        )
        
        # 作成されたプランの一覧を表示
        self.stdout.write('\n作成されたプラン一覧:')
        for plan in Plan.objects.filter(is_active=True).order_by('sort_order'):
            self.stdout.write(
                f'  - {plan.display_name}: ${plan.price}/月 '
                f'(制限: {plan.daily_audio_limit}回/日, '
                f'最大{plan.max_audio_duration}秒)'
            ) 