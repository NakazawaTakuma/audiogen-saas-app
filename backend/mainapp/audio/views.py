from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
import os
import tempfile
import torch
import soundfile as sf
from diffusers import StableAudioPipeline
# from pydub import AudioSegment
from rest_framework.authentication import BaseAuthentication
from mainapp.users.models import User
from mainapp.billing.models import UserSubscription, Plan, UsageLog
from datetime import date

# グローバルでモデルを一度だけ初期化（キャッシュして使い回し）
_pipe = None

def get_audio_pipeline():
    """モデルを一度だけ初期化してキャッシュする"""
    global _pipe
    if _pipe is None:
        print("Initializing StableAudioPipeline...")
        _pipe = StableAudioPipeline.from_pretrained(
            "stabilityai/stable-audio-open-1.0",
            torch_dtype=torch.float16,
            cache_dir="./model_cache"  # モデルをローカルにキャッシュ
        )
        _pipe = _pipe.to("cuda" if torch.cuda.is_available() else "cpu")
        print("StableAudioPipeline initialized successfully!")
    return _pipe

class ApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('X-API-KEY')
        if not api_key:
            return None
        try:
            user = User.objects.get(api_key=api_key)
            return (user, None)
        except User.DoesNotExist:
            return None

def get_user_plan_limits(user):
    """ユーザーのプラン制限を取得"""
    try:
        subscription = user.subscription
        if subscription.is_active:
            plan = subscription.plan
            return {
                'daily_audio_limit': plan.daily_audio_limit,
                'max_audio_duration': plan.max_audio_duration,
                'max_steps': plan.max_steps,
                'can_use_api': plan.can_use_api,
                'can_download': plan.can_download,
                'can_edit_audio': plan.can_edit_audio,
            }
    except UserSubscription.DoesNotExist:
        pass
    
    # デフォルトプラン（無料プラン）の制限
    default_plan = Plan.objects.filter(is_active=True, price=0).first()
    if default_plan:
        return {
            'daily_audio_limit': default_plan.daily_audio_limit,
            'max_audio_duration': default_plan.max_audio_duration,
            'max_steps': default_plan.max_steps,
            'can_use_api': default_plan.can_use_api,
            'can_download': default_plan.can_download,
            'can_edit_audio': default_plan.can_edit_audio,
        }
    
    # フォールバック
    return {
        'daily_audio_limit': 20,
        'max_audio_duration': 30,
        'max_steps': 200,
        'can_use_api': False,
        'can_download': True,
        'can_edit_audio': False,
    }

def check_usage_limit(user):
    """使用量制限をチェック"""
    today = date.today()
    
    # 使用量ログを取得または作成
    usage_log, created = UsageLog.objects.get_or_create(
        user=user,
        date=today,
        defaults={
            'audio_generations': 0,
            'api_calls': 0,
            'total_duration': 0
        }
    )
    
    # プラン制限を取得
    limits = get_user_plan_limits(user)
    daily_limit = limits['daily_audio_limit']
    
    # 制限チェック
    if usage_log.audio_generations >= daily_limit:
        return False, usage_log.audio_generations, daily_limit
    
    return True, usage_log.audio_generations, daily_limit

def increment_usage(user, duration=0):
    """使用量を増加"""
    today = date.today()
    usage_log, created = UsageLog.objects.get_or_create(
        user=user,
        date=today,
        defaults={
            'audio_generations': 0,
            'api_calls': 0,
            'total_duration': 0
        }
    )
    
    usage_log.audio_generations += 1
    usage_log.total_duration += duration
    usage_log.save()
    
    return usage_log

# Create your views here.

class AudioGenerateView(APIView):
    authentication_classes = [ApiKeyAuthentication] + APIView.authentication_classes
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # 使用量制限をチェック
        can_generate, current_usage, daily_limit = check_usage_limit(user)
        if not can_generate:
            return Response({
                "detail": f"プランの1日上限（{daily_limit}回）に達しました。",
                "current_usage": current_usage,
                "daily_limit": daily_limit
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        prompt = request.data.get('prompt')
        duration = float(request.data.get('duration', 5.0))
        steps = int(request.data.get('steps', 100))
        neg_prompt = request.data.get('neg_prompt', 'Low quality.')
        
        if not prompt:
            return Response({"detail": "promptは必須です。"}, status=status.HTTP_400_BAD_REQUEST)

        # プラン制限をチェック
        limits = get_user_plan_limits(user)
        
        # 音声長の制限チェック
        if duration > limits['max_audio_duration']:
            return Response({
                "detail": f"音声長は最大{limits['max_audio_duration']}秒までです。",
                "requested_duration": duration,
                "max_duration": limits['max_audio_duration']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ステップ数の制限チェック
        if steps > limits['max_steps']:
            return Response({
                "detail": f"ステップ数は最大{limits['max_steps']}までです。",
                "requested_steps": steps,
                "max_steps": limits['max_steps']
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # キャッシュされたモデルを取得
            pipe = get_audio_pipeline()
            
            import random
            seed = random.randint(0, 2**32 - 1)
            gen = torch.Generator(pipe.device).manual_seed(seed)
            result = pipe(
                prompt,
                negative_prompt=neg_prompt,
                num_inference_steps=steps,
                audio_end_in_s=duration,
                num_waveforms_per_prompt=1,
                generator=gen
            )
            audio_np = result.audios[0].T.float().cpu().numpy()
            
            # 一時ファイルに保存
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmpfile:
                sf.write(tmpfile.name, audio_np, pipe.vae.sampling_rate)
                out_path = tmpfile.name
            
            # 使用量を増加
            usage_log = increment_usage(user, int(duration))
            
            # ファイルをレスポンス
            with open(out_path, "rb") as f:
                data = f.read()
            os.remove(out_path)
            
            # HttpResponseを使用してバイナリデータを直接返す
            response = HttpResponse(data, content_type="audio/wav")
            response["Content-Disposition"] = f'attachment; filename="audio_{seed}.wav"'
            
            # レスポンスヘッダーに使用量情報を追加
            response["X-Usage-Count"] = str(usage_log.audio_generations)
            response["X-Usage-Limit"] = str(daily_limit)
            response["X-Usage-Remaining"] = str(daily_limit - usage_log.audio_generations)
            
            return response
            
        except Exception as e:
            return Response({"detail": f"音声生成エラー: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
