# mainapp/users/tokens.py

import six
from django.contrib.auth.tokens import PasswordResetTokenGenerator

class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    メール確認用トークンジェネレータ。
    user.pk + timestamp + user.is_active を基にハッシュを生成することで、
    一度アクティベートされたあとに同じトークンが無効化される。
    """
    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk) +
            six.text_type(timestamp) +
            six.text_type(user.is_active)
        )

email_verification_token = EmailVerificationTokenGenerator()
