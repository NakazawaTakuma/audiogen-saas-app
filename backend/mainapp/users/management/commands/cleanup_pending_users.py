# /users/management/commands/cleanup_pending_users.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from mainapp.users.models import PendingUser

class Command(BaseCommand):
    help = '期限切れの PendingUser を一括削除する（標準設定だと 24 時間以上経過したもの）'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timezone.timedelta(hours=24)
        expired = PendingUser.objects.filter(created_at__lt=cutoff)
        count = expired.count()
        expired.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} expired PendingUser records."))
