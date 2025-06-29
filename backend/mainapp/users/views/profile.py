# mainapp/users/views/profile.py

from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from ..serializers.profile import UserProfileSerializer
from ..models import User
from rest_framework.exceptions import PermissionDenied

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    認証済みユーザーのプロフィール取得・更新専用APIView。
    - GET: 自身のプロフィール情報を返す
    - PATCH: display_name, profile_image, bio, を更新する
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        """
        GET リクエスト時は、ユーザーの現在のプロフィール情報を返す。
        - 画像は URL（MEDIA_URL 経由）を返す
        """
        user = self.get_object()

 
        serializer = self.get_serializer(user)
        data = serializer.data

        # profile_image フィールドだけはフルURLで返すよう上書き
        if user.profile_image:
            data['profile_image'] = request.build_absolute_uri(user.profile_image.url)
        else:
            data['profile_image'] = ""

        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        """
        PATCH リクエスト時は、UserProfileSerializer で受け取り、更新後の profile フィールドのみを返す。
        """
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # 更新後のデータを再度シリアライズして返す
        resp_serializer = self.get_serializer(user)
        data = resp_serializer.data

        # profile_image だけはフルURLで返す
        if user.profile_image:
            data['profile_image'] = request.build_absolute_uri(user.profile_image.url)
        else:
            data['profile_image'] = ""

        return Response(data, status=status.HTTP_200_OK)




class UserProfileBySlugAPIView(generics.RetrieveUpdateAPIView):
    """
    slug を URL パラメータから受け取り、該当ユーザーのプロフィールを取得／更新するエンドポイント。

    - GET  /api/users/profile/<slug>/        → 任意のユーザーの display_name, profile_image, bio を返却
    - PATCH /api/users/profile/<slug>/        → ログイン中のユーザーが自分の slug と一致する場合のみ更新を許可
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        通常の get_object() で slug に合致する User インスタンスを返す。
        """
        return super().get_object()

    def check_object_permissions(self, request, obj):
        """
        オブジェクトレベルの権限チェック：
        - GET は誰でも許可（IsAuthenticated なので認証済みユーザーであれば OK）。
        - PATCH（更新）は、URL スラッグとリクエストユーザーの slug が一致しない限り拒否。
        """
        # まず認証済みかどうかは親クラスに任せる
        super().check_object_permissions(request, obj)

        if request.method in ['PATCH', 'PUT']:
            # 更新しようとしているユーザーが、自分自身かどうかを確認
            if request.user.slug != obj.slug:
                raise PermissionDenied("自分のプロフィール以外は更新できません。")


    def retrieve(self, request, *args, **kwargs):
        """
        GET：ユーザーのプロフィールを返す。
        - profile_image は full URL に変換して返す。（既存の UserProfileAPIView と同様）
        """
        user = self.get_object()
        serializer = self.get_serializer(user)
        data = serializer.data

        # profile_image だけはフル URL で返す
        if user.profile_image:
            data['profile_image'] = request.build_absolute_uri(user.profile_image.url)
        else:
            data['profile_image'] = ""

        return Response(data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH：ユーザー自身のプロフィール更新。
        - display_name, profile_image, bio を更新
        - 更新後は更新済みデータを返す（profile_image はフル URL）
        """
        user = self.get_object()
        # 権限チェック（自分自身かどうか）
        self.check_object_permissions(request, user)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # 更新後のデータを再度シリアライズして返す
        resp_serializer = self.get_serializer(user)
        data = resp_serializer.data

        if user.profile_image:
            data['profile_image'] = request.build_absolute_uri(user.profile_image.url)
        else:
            data['profile_image'] = ""

        return Response(data, status=status.HTTP_200_OK)

    # RetrieveUpdateAPIView を使うので、PATCH の実体は partial_update() で定義し、
    # GET は retrieve() が呼ばれる。