# デモ動画作成ガイド

このガイドでは、AudioGen SaaSのデモ動画を作成するための手順とスクリプトを提供します。

## 🎬 デモ動画構成

### 推奨構成 (3-5分)
1. **オープニング** (30秒) - プロジェクト概要
2. **機能紹介** (2-3分) - 主要機能のデモ
3. **技術スタック** (1分) - 使用技術の説明
4. **クロージング** (30秒) - まとめとリンク

## 📝 デモスクリプト

### 1. オープニング (30秒)
```
「こんにちは！今日は私が開発したAudioGen SaaSをご紹介します。

これは、AI音声生成機能を提供するSaaSプラットフォームです。
React、Django、Stripeを使用して構築されており、
高品質な音声を簡単に生成できるサービスです。」
```

### 2. 機能紹介 (2-3分)

#### 2.1 ホームページ (30秒)
```
「まずはホームページから見ていきましょう。
モダンなデザインで、音声生成の魅力を伝えています。
右上のログインボタンから始めましょう。」
```

#### 2.2 ユーザー登録・ログイン (30秒)
```
「新規ユーザーの方は登録から始められます。
メール認証も実装されており、セキュアな認証システムです。
ログイン後は、ダッシュボードに移動します。」
```

#### 2.3 音声生成機能 (1分)
```
「メイン機能の音声生成です。
プロンプトを入力して、音声の長さや品質を調整できます。
「さわやかな朝のBGM」で試してみましょう。

生成中はリアルタイムで進捗が表示され、
完了すると音声を再生・ダウンロードできます。」
```

#### 2.4 プラン管理 (30秒)
```
「価格プランページでは、複数のプランから選択できます。
無料プランから始めて、必要に応じてアップグレード可能です。
Stripeを使用した安全な決済システムです。」
```

#### 2.5 APIドキュメント (30秒)
```
「開発者向けには、包括的なAPIドキュメントを提供しています。
認証方法、エンドポイント、サンプルコードまで、
APIの使用方法を詳しく説明しています。」
```

### 3. 技術スタック (1分)
```
「技術的な特徴をご紹介します。

フロントエンドはReact 18とTypeScriptを使用し、
Tailwind CSSとShadcn/uiでモダンなUIを実現しています。

バックエンドはDjango REST Frameworkで構築され、
PostgreSQLでデータ管理、Redisでキャッシュを行っています。

AI音声生成にはHuggingFaceのStableAudioPipelineを使用し、
決済処理にはStripeを採用しています。」
```

### 4. クロージング (30秒)
```
「いかがでしたでしょうか？

このプロジェクトは、フルスタック開発のスキルを
包括的にアピールできるSaaSアプリケーションです。

GitHubのリンクは説明欄に記載していますので、
ぜひご覧ください。ご質問があれば、コメントでお聞かせください！」
```

## 🎥 録画手順

### 1. 準備
- **スクリーンレコーダー**: OBS Studio、Loom、ScreenFlow
- **マイク**: クリアな音声録音
- **ブラウザ**: Chrome/Firefox最新版
- **テストデータ**: サンプルユーザーアカウント

### 2. 録画設定
- **解像度**: 1920x1080 (Full HD)
- **フレームレート**: 30fps
- **音声**: 44.1kHz, 16bit
- **形式**: MP4

### 3. 録画時の注意点
- **ゆっくり操作**: 視聴者が追いつける速度
- **説明付き**: 各操作に説明を加える
- **エラー回避**: 事前にテストしてエラーを防ぐ
- **音声品質**: 静かな環境で録音

## 📋 デモ用テストデータ

### テストユーザー
```
Email: demo@example.com
Password: demo123456
```

### テスト音声生成
```
プロンプト: "さわやかな朝のBGM"
長さ: 5秒
ステップ: 100
```

### テストプラン購入
```
プラン: Basic Plan
金額: $9.99/月
```

## 🎨 動画編集

### 1. 編集ソフト
- **無料**: DaVinci Resolve, OpenShot
- **有料**: Adobe Premiere Pro, Final Cut Pro

### 2. 編集ポイント
- **カット編集**: 不要な部分を削除
- **テロップ追加**: 重要なポイントに文字を追加
- **BGM**: 静かなBGMを追加（音量調整）
- **トランジション**: シーン間のスムーズな切り替え

### 3. 出力設定
- **解像度**: 1920x1080
- **フレームレート**: 30fps
- **ビットレート**: 5-10 Mbps
- **形式**: MP4 (H.264)

## 📱 プラットフォーム別最適化

### YouTube
- **サムネイル**: 魅力的なサムネイル画像
- **タイトル**: "AudioGen SaaS - AI音声生成プラットフォーム"
- **説明**: 詳細な説明とリンク
- **タグ**: #SaaS #AI #音声生成 #React #Django

### LinkedIn
- **長さ**: 1-2分に短縮
- **フォーマット**: 正方形 (1080x1080)
- **内容**: 技術的な詳細を重視

### GitHub
- **README**: 動画を埋め込み
- **説明**: 技術スタックと機能を強調

## 🔗 動画に含めるリンク

### 必須リンク
- **GitHub**: https://github.com/NakazawaTakuma/audiogen-saas
- **ライブデモ**: https://audiogen-saas.vercel.app
- **API ドキュメント**: https://audiogen-saas.vercel.app/docs

### オプションリンク
- **ポートフォリオ**: https://your-portfolio.com
- **LinkedIn**: https://linkedin.com/in/your-profile
- **Twitter**: https://x.com/tzero3_

## 📊 効果測定

### メトリクス
- **視聴回数**: 動画の再生回数
- **視聴保持率**: どの程度最後まで見てもらえるか
- **エンゲージメント**: いいね、コメント、シェア
- **クリック率**: リンクのクリック数

### 改善点
- **視聴者の反応**: コメントから改善点を収集
- **A/Bテスト**: 異なるバージョンでテスト
- **最適化**: データに基づいて改善

## 🎯 成功のコツ

1. **簡潔に**: 3-5分に収める
2. **明確に**: 各機能の価値を明確に伝える
3. **技術的に**: 技術スタックを適切にアピール
4. **魅力的に**: 視覚的に魅力的なデモ
5. **行動喚起**: 明確な次のアクションを提示

---

このガイドに従って、魅力的なデモ動画を作成してください！ 