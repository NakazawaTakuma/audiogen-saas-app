from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    username または email でユーザーを検索して認証するバックエンド
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = username or kwargs.get('email')
        if identifier is None or password is None:
            return None
        try:
            user = User.objects.get(Q(username__iexact=identifier) | Q(email__iexact=identifier))
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None