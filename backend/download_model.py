#!/usr/bin/env python3
"""
HuggingFaceのStableAudioPipelineモデルを事前にダウンロードするスクリプト
"""

import torch
from diffusers import StableAudioPipeline
import os
from huggingface_hub import login

def download_model():
    """モデルをダウンロードしてキャッシュする"""
    print("StableAudioPipelineモデルをダウンロード中...")
    
    # HuggingFaceトークンでログイン
    hf_token = os.environ.get("HF_TOKEN")
    if hf_token:
        print("HuggingFaceトークンでログイン中...")
        login(token=hf_token)
    else:
        print("警告: HF_TOKENが設定されていません。公開モデルのみダウンロード可能です。")
    
    # キャッシュディレクトリを確認・作成
    cache_dir = "./model_cache"
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
        print(f"キャッシュディレクトリを作成: {cache_dir}")
    
    try:
        # モデルをダウンロード
        pipe = StableAudioPipeline.from_pretrained(
            "stabilityai/stable-audio-open-1.0",
            torch_dtype=torch.float16,
            cache_dir=cache_dir,
            local_files_only=False,  # 強制的にダウンロード
            token=hf_token
        )
        
        # デバイスに移動
        device = "cuda" if torch.cuda.is_available() else "cpu"
        pipe = pipe.to(device)
        
        print(f"モデルのダウンロードが完了しました！")
        print(f"デバイス: {device}")
        print(f"キャッシュディレクトリ: {cache_dir}")
        
        # 簡単なテスト
        print("モデルの動作テスト中...")
        test_prompt = "A simple test sound"
        result = pipe(
            test_prompt,
            negative_prompt="Low quality.",
            num_inference_steps=10,  # テスト用に少ないステップ数
            audio_end_in_s=2.0,  # テスト用に短い長さ
            num_waveforms_per_prompt=1
        )
        print("テスト成功！モデルが正常に動作します。")
        
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        print("ネットワーク接続やトークンを確認してください。")
        return False
    
    return True

if __name__ == "__main__":
    success = download_model()
    if success:
        print("モデルのダウンロードとテストが完了しました。")
    else:
        print("モデルのダウンロードに失敗しました。") 