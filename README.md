# AudioGen SaaS - AI音声生成プラットフォーム

![AudioGen SaaS](https://img.shields.io/badge/AudioGen-SaaS-blue)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)
![Django](https://img.shields.io/badge/Django-4.2+-092E20?logo=django)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![Stripe](https://img.shields.io/badge/Stripe-Payment-6772E5?logo=stripe)

AI音声生成機能を提供するSaaSプラットフォームです。高品質な音声を簡単に生成し、APIを通じてアプリケーションに組み込むことができます。

## 🚀 デモ

- **ライブデモ**:未実装
- **API ドキュメント**: 未実装

## 📱 ページプレビュー

| ページ | 説明 | スクリーンショット |
|--------|------|-------------------|
| **ホームページ** | サービス概要、機能紹介、デモ音声 | ![HomePage](image/HomePage.png) |
| **価格プラン** | 複数プランの比較、サブスクリプション管理 | ![PricingPage](image/PricingPage.png) |
| **マイページ** | ユーザーダッシュボード、使用量管理 | ![MyPage](image/MyPage.png) |
| **API ドキュメント** | 包括的なAPI仕様、サンプルコード | ![DocsPage](image/DocsPage.png) |

## ✨ 主な機能

### 🎵 音声生成
- **AI音声生成**: HuggingFace StableAudioPipelineを使用した高品質音声生成
- **カスタマイズ可能**: プロンプト、長さ、品質パラメータの調整
- **リアルタイム生成**: 数秒で音声ファイルを生成
- **複数フォーマット**: WAV形式での出力

### 💳 サブスクリプション管理
- **複数プラン**: 無料、ベーシック、プロ、エンタープライズ
- **使用量制限**: 日次生成回数、音声長、API呼び出し制限
- **Stripe決済**: 安全な決済処理とサブスクリプション管理
- **使用量追跡**: リアルタイム使用量表示と制限管理

### 🔐 認証・セキュリティ
- **JWT認証**: セキュアなトークンベース認証
- **パスワードリセット**: メールベースのパスワードリセット
- **APIキー管理**: セキュアなAPIアクセス
- **使用量制限**: プラン別の適切な制限管理

### 📱 モダンUI/UX
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップ対応
- **ダークモード対応**: ユーザー設定に応じたテーマ切り替え
- **リアルタイムフィードバック**: ローディング状態、エラーハンドリング
- **アクセシビリティ**: WCAG準拠のアクセシブルデザイン

## 🛠 技術スタック

### フロントエンド
- **React 18** - ユーザーインターフェース
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS
- **Shadcn/ui** - モダンなUIコンポーネント
- **React Router** - クライアントサイドルーティング
- **React Hook Form** - フォーム管理
- **Zod** - スキーマバリデーション

### バックエンド
- **Django 4.2** - Webフレームワーク
- **Django REST Framework** - API開発
- **PostgreSQL** - リレーショナルデータベース
- **Redis** - キャッシュ・セッション管理
- **Celery** - 非同期タスク処理
- **Stripe** - 決済処理
- **HuggingFace Transformers** - AI音声生成

### インフラ・デプロイ
- **Docker** - コンテナ化
- **Nginx** - リバースプロキシ
- **Gunicorn** - WSGIサーバー
- **Vercel** - フロントエンドホスティング
- **Railway/Render** - バックエンドホスティング

## 📦 セットアップ

### 前提条件
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 6+

### 1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/audiogen-saas.git
cd audiogen-saas
```

### 2. バックエンドセットアップ
```bash
cd backend

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .envファイルを編集して必要な設定を追加

# データベースマイグレーション
python manage.py migrate

# スーパーユーザー作成
python manage.py createsuperuser

# 開発サーバー起動
python manage.py runserver
```

### 3. フロントエンドセットアップ
```bash
cd frontend/mainapp

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localファイルを編集

# 開発サーバー起動
npm run dev
```

### 4. 必要な環境変数

#### バックエンド (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/audiogen
REDIS_URL=redis://localhost:6379/0

# Stripe設定
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HuggingFace設定
HUGGINGFACE_TOKEN=hf_...

# メール設定
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

#### フロントエンド (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🚀 デプロイ

### フロントエンド (Vercel)
```bash
cd frontend/market-palace
npm run build
vercel --prod
```

### バックエンド (Railway/Render)
```bash
cd backend
# Railway CLIまたはRenderダッシュボードでデプロイ
```

## 📚 API ドキュメント

### 音声生成エンドポイント
```http
POST /api/audio/generate/
Authorization: Bearer <your-access-token>
Content-Type: multipart/form-data

{
  "prompt": "さわやかな朝のBGM",
  "duration": 5,
  "steps": 100,
  "neg_prompt": "Low quality."
}
```

### レスポンス
- **成功時**: WAV形式の音声ファイル
- **エラー時**: JSON形式のエラー情報

詳細なAPIドキュメントは [こちら](https://audiogen-saas.vercel.app/docs) をご覧ください。

## 🏗 プロジェクト構造

```
saas-app/
├── backend/                 # Django バックエンド
│   ├── config/             # Django設定
│   ├── mainapp/            # メインアプリケーション
│   │   ├── audio/          # 音声生成機能
│   │   ├── billing/        # 決済・プラン管理
│   │   └── users/          # ユーザー管理
│   └── requirements.txt    # Python依存関係
├── frontend/               # React フロントエンド
│   └── mainapp/            # メインアプリケーション
│       ├── src/
│       │   ├── components/ # UIコンポーネント
│       │   ├── pages/      # ページコンポーネント
│       │   ├── hooks/      # カスタムフック
│       │   └── services/   # APIサービス
│       └── package.json    # Node.js依存関係
└── README.md              # このファイル
```
