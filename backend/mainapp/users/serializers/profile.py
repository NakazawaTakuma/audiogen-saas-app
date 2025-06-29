# mainapp/users/serializers/profile.py

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from PIL import Image
from django.core.files.base import ContentFile
import io
User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    認証済みユーザーのプロフィール更新専用シリアライザ
    - display_name, profile_image, bioを受け取る
    - profile_image はアップロードファイル (JPEG/PNG/GIF, <=10MB) とする
    """
    display_name = serializers.CharField(
        max_length=30,   # 最大 30 文字に制限
        required=True,
        help_text=_("画面上に表示される名前（最大 30 文字、先頭末尾の空白は自動で削除）"),
    )
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text=_("プロフィール画像をアップロード（JPEG/PNG/GIF, 最大10MB、最小 30×30px）。"
                    "null を指定すると既存の画像を削除します。"),
    )
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text=_("自己紹介文（最大 300 文字、改行は最大5行まで）"),
    )


    class Meta:
        model = User
        fields = [
            'display_name',
            'profile_image',
            'bio',
        ]

    def validate_display_name(self, value):
        """
        - 先頭・末尾の空白を削除
        - 禁止文字種（例：全角のみ、絵文字など）を排除したい場合はここでチェック
        """
        stripped = value.strip()
        if len(stripped) == 0:
            raise serializers.ValidationError(_("表示名を入力してください。"))
        # 例：ASCII 文字＋日本語文字のみ許可などがあれば追加
        # if not re.fullmatch(r"[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F\u0020-\u007E]+", stripped):
        #     raise serializers.ValidationError(_("表示名に使用できない文字が含まれています。"))
        return stripped

    def validate_profile_image(self, image):
        """
        - ファイルサイズ: 10MB 以下
        - 画像形式: JPEG/PNG/GIF
        - 最小サイズ: 30×30 px
        - 推奨サイズ: 400×400 px（サイズが異なる場合は警告ログ）
        - None の場合はそのまま返す（画像削除を意味する）
        """
        if image is None:
            return None

        # 1) ファイルサイズチェック
        max_size = 10 * 1024 * 1024  # 10MB
        if image.size > max_size:
            raise serializers.ValidationError(_("画像ファイルは10MB以下にしてください。"))

        # 2) 形式チェック
        try:
            img = Image.open(image)
            img_format = img.format.upper()
            if img_format not in ['JPEG', 'JPG', 'PNG', 'GIF']:
                raise serializers.ValidationError(_("JPEG, PNG, GIF のいずれかの形式を選択してください。"))
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError(_("有効な画像ファイルをアップロードしてください。"))

        # 3) サイズ（縦横ピクセル）チェック
        width, height = img.size
        min_side = 30
        if width < min_side or height < min_side:
            raise serializers.ValidationError(
                _("画像サイズが小さすぎます（最小: {min}×{min} px）。").format(min=min_side)
            )

        # 4) 推奨サイズチェック (400×400)
        recommended = 400
        if width != recommended or height != recommended:
            self.context.setdefault('warnings', []).append(
                _("推奨サイズは{rec}×{rec}pxです（現在: {w}×{h}）。比率にご注意ください。").format(
                    rec=recommended, w=width, h=height
                )
            )

        return image

    def validate_bio(self, value):
        """
        - 最大 300 文字（改行を除く）、改行は最大 5 回まで
        """
        # 改行を正規化してからチェック
        text = value or ""
        # CRLF (\r\n) → LF (\n)
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")

        newline_count = normalized.count("\n")
        if newline_count > 5:
            raise serializers.ValidationError(_("自己紹介の改行は最大 5 行までです。"))

        char_count = len(normalized.replace("\n", ""))
        if char_count > 300:
            raise serializers.ValidationError(_("自己紹介は最大 300 文字までです（改行を除く）。"))

        return value


    def update(self, instance, validated_data):

        # 2) display_name, bio の更新
        instance.display_name = validated_data.get("display_name", instance.display_name)
        instance.bio = validated_data.get("bio", instance.bio)

        # 3) profile_image に関する処理
        profile_image = validated_data.get("profile_image", serializers.empty)

        if profile_image is None:
            # null が明示的に送られた場合 → 既存画像を削除
            if instance.profile_image:
                instance.profile_image.delete(save=False)
            instance.profile_image = None

        elif profile_image is not serializers.empty:
            # 新しい画像ファイルが渡された場合 → クロップしてリサイズし直す
            img = Image.open(profile_image)  # Pillow Image
            img = img.convert("RGB")  # JPEG 用に念のため RGB に変換

            # --- 中心を正方形にクロッピング ---
            width, height = img.size
            side = min(width, height)
            left = (width - side) / 2
            top = (height - side) / 2
            right = (width + side) / 2
            bottom = (height + side) / 2
            img_cropped = img.crop((left, top, right, bottom))

            # --- 400×400 にリサイズ ---
            img_resized = img_cropped.resize((400, 400), Image.LANCZOS)

            # --- メモリ上に一時ファイルを作り、Django の ImageField にセット ---
            buffer = io.BytesIO()
            img_resized.save(buffer, format="JPEG", quality=90)
            buffer.seek(0)

            # ファイル名は元ファイル名の拡張子を .jpg に統一
            original_name = getattr(profile_image, "name", "")
            base_name = (
                original_name.rsplit(".", 1)[0]
                if "." in original_name
                else uuid.uuid4().hex
            )
            new_filename = f"{base_name}.jpg"

            content_file = ContentFile(buffer.read(), name=new_filename)
            # 既存画像があれば先に削除
            if instance.profile_image:
                instance.profile_image.delete(save=False)

            instance.profile_image = content_file

        # 4) インスタンスを保存
        instance.save()


        # 6) (オプション) warnings をログ出力する
        warnings = self.context.get("warnings")
        if warnings:
            for w in warnings:
                print(f"[ProfileWarning] {w}")

        return instance
