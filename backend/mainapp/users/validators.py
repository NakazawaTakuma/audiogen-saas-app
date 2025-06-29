# mainapp/users/validators.py

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import password_validation as dj_password_validation

# ─────────────────────────────────────────────────────────────────────────────
# ユーザー名 (username) 用バリデータ
#
# ルール:
#  - 半角英数字 (A–Z, a–z, 0–9)、ドット (.)、アンダースコア (_)、ハイフン (-) のみ
#  - 先頭・末尾は必ず英数字
#  - .,_,- が連続して並ぶのは禁止
#  - 長さは 3～20 文字
#  - 日本語（全角）禁止、ASCII 範囲のみ
# ─────────────────────────────────────────────────────────────────────────────

# 許可する記号一覧（文字クラスとして使う）
_ALLOWED_SYMBOLS = r"\._-"

def validate_username(value):
    """
    ユーザー名バリデーション（個別チェック版）：
      1. 長さ 3～20 文字
      2. 日本語（全角）禁止（ASCII 印字可能文字のみ）
      3. 半角英数字 + . _ - のみ許可
      4. 先頭・末尾は必ず英数字
      5. .,_,- が連続して並ぶのは禁止
    """
    # 1) 長さチェック
    length = len(value)
    if length < 3 or length > 20:
        raise ValidationError(
            _("ユーザー名は 3～20 文字で入力してください。現在の長さ: %(length)d"),
            code='username_length',
            params={'length': length},
        )

    # 2) 全角文字禁止チェック（ASCII 印字可能文字のみ許可）
    #    全角文字を含む例: Unicodeの範囲外文字列を検出
    #    ここでは「ASCII 33–126 とタブ/改行以外」を許可とし、
    #    半角スペースも禁止とするため、ASCII 範囲でも制限したほうが明確ですが、
    #    よくある方法として「\u0000–\u007F 以外が含まれたら NG」としています。
    if any(ord(ch) > 0x7F for ch in value):
        raise ValidationError(
            _("ユーザー名に全角文字や非 ASCII 文字を含めることはできません。"),
            code='username_ascii_only'
        )

    # 3) 許可文字チェック
    #    半角英数字 と . _ - のみを許可
    if not all(re.match(r"[A-Za-z0-9" + _ALLOWED_SYMBOLS + r"]", ch) for ch in value):
        raise ValidationError(
            _("ユーザー名には半角英数字と「._-」のみ使用できます。"),
            code='username_invalid_chars'
        )

    # 4) 先頭・末尾チェック
    #    先頭・末尾は必ず英数字
    if not re.match(r"^[A-Za-z0-9].*[A-Za-z0-9]$", value):
        raise ValidationError(
            _("ユーザー名の先頭および末尾は英数字である必要があります。"),
            code='username_start_end'
        )

    # 5) 連続禁止チェック
    #    .,_,- が連続で並ぶのは禁止
    if re.search(r"[._-]{2,}", value):
        raise ValidationError(
            _("ユーザー名内で「.」「_」「-」を連続して並べることはできません。"),
            code='username_consecutive_symbols'
        )

# ─────────────────────────────────────────────────────────────────────────────
# パスワード (password) 用バリデータ
#
# ルール:
#  - 長さ 8～64 文字
#  - 全角文字（日本語）禁止 ⇒ 半角印字可能 ASCII (!–~) のみ
#  - 空白文字（スペース・タブなど）禁止
#  - 半角英大文字 ([A-Z])、半角英小文字 ([a-z])、数字 (\d)、半角記号 (例: !, @, #, …) のうち、
#    少なくとも 2 種類以上 を含む
#  - （必要なら Django 標準パスワードバリデータも併用可）
# ─────────────────────────────────────────────────────────────────────────────
def validate_password_strength(value):
    """
    パスワード強度バリデーション：
      - 文字数 8～64 文字
      - 全角禁止（ASCII印字可能文字のみ）
      - 空白禁止
      - 半角英大文字・半角英小文字・数字・半角記号 のうち 2 種類以上を含む
      - （任意）Django 標準パスワードバリデータも併用
    """
    # 1) 長さチェック
    if len(value) < 8:
        raise ValidationError(
            _("パスワードが短すぎます。最低 8 文字以上必要です。"),
            code='password_too_short'
        )
    if len(value) > 64:
        raise ValidationError(
            _("パスワードは最大 64 文字までです。"),
            code='password_too_long'
        )

    # 2) 空白含まないチェック
    if re.search(r'\s', value):
        raise ValidationError(
            _("パスワードに空白文字を含めることはできません。"),
            code='password_no_whitespace'
        )

    # 3) 全角文字禁止チェック（ASCII 印字可能文字のみ：\x21–\x7E）
    if not re.fullmatch(r'^[\x21-\x7E]+$', value):
        raise ValidationError(
            _("パスワードは全角文字を含まず、半角英数字および半角記号のみで入力してください。"),
            code='password_invalid_chars'
        )

    # 4) 文字種カテゴリチェック（大文字・小文字・数字・記号 のうち少なくとも 2 種類）
    categories = 0
    if re.search(r'[A-Z]', value):
        categories += 1
    if re.search(r'[a-z]', value):
        categories += 1
    if re.search(r'[0-9]', value):
        categories += 1
    if re.search(r'[!-/:-@[-`{-~]', value):  # 半角記号の範囲
        categories += 1

    if categories < 2:
        raise ValidationError(
            _("パスワードは半角英大文字・半角英小文字・数字・半角記号の中から、"
              "少なくとも 2 種類以上を含めてください。"),
            code='password_not_enough_categories'
        )

    # 5) （オプション）Django 標準パスワードバリデータも併用する例
    try:
        dj_password_validation.validate_password(value)
    except ValidationError as e:
        # Django のメッセージを再送出
        raise ValidationError(e.messages)


# ● メールアドレスやユーザー名との類似度チェック
def validate_password_not_too_similar_to_user(value, user_instance=None):
    """
    パスワードとユーザー名 / メールアドレスがあまりに類似していないかチェックする。
    user_instance を渡せば、user_instance.username / user_instance.email と比較。
    """
    if user_instance:
        username = user_instance.username or ""
        email = user_instance.email or ""
        # 「パスワードにユーザー名が部分一致」または「メールアドレス local-part が含まれる」などを禁止
        if username and username.lower() in value.lower():
            raise ValidationError(
                _("パスワードがユーザー名に似すぎています。別のパスワードを選んでください。"),
                code='password_too_similar_username'
            )
        local_part = email.split('@')[0]
        if local_part and local_part.lower() in value.lower():
            raise ValidationError(
                _("パスワードがメールアドレスに似すぎています。別のパスワードを選んでください。"),
                code='password_too_similar_email'
            )
