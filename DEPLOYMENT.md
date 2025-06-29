# デプロイメントガイド

このガイドでは、AudioGen SaaSを本番環境にデプロイする手順を説明します。

## 🚀 推奨デプロイ構成

### フロントエンド
- **Vercel** - 静的サイトホスティング
- **Netlify** - 代替案

### バックエンド
- **Railway** - フルスタックプラットフォーム
- **Render** - 代替案
- **Heroku** - 代替案

### データベース
- **PostgreSQL** - Railway/Render内蔵
- **Supabase** - 外部PostgreSQLサービス

## 📋 デプロイ前準備

### 1. 環境変数の準備

#### バックエンド環境変数
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# データベース
DATABASE_URL=postgresql://user:password@host:port/database

# Redis
REDIS_URL=redis://host:port/0

# Stripe (本番用)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HuggingFace
HUGGINGFACE_TOKEN=hf_...

# メール設定
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

#### フロントエンド環境変数
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Stripe本番設定

1. **Stripeダッシュボード**で本番モードに切り替え
2. **API Keys**から本番用キーを取得
3. **Webhooks**で本番用エンドポイントを設定
4. **Products**で本番用プランを作成

### 3. ドメイン設定

1. **カスタムドメイン**を取得
2. **SSL証明書**を設定
3. **DNS設定**を構成

## 🚀 Vercel デプロイ (フロントエンド)

### 1. Vercel CLI インストール
```bash
npm i -g vercel
```

### 2. プロジェクト設定
```bash
cd frontend/market-palace
vercel login
vercel
```

### 3. 環境変数設定
```bash
vercel env add VITE_API_BASE_URL
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
```

### 4. 本番デプロイ
```bash
vercel --prod
```

## 🚂 Railway デプロイ (バックエンド)

### 1. Railway CLI インストール
```bash
npm i -g @railway/cli
```

### 2. プロジェクト作成
```bash
cd backend
railway login
railway init
```

### 3. 環境変数設定
Railwayダッシュボードで環境変数を設定

### 4. デプロイ
```bash
railway up
```

### 5. カスタムドメイン設定
```bash
railway domain
```

## 🐳 Docker デプロイ

### 1. 本番用Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: audiogen
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/audiogen
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    ports:
      - "8000:8000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 2. Nginx設定
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## 🔧 デプロイ後設定

### 1. データベースマイグレーション
```bash
# Railwayの場合
railway run python manage.py migrate

# Dockerの場合
docker-compose exec backend python manage.py migrate
```

### 2. スーパーユーザー作成
```bash
# Railwayの場合
railway run python manage.py createsuperuser

# Dockerの場合
docker-compose exec backend python manage.py createsuperuser
```

### 3. 静的ファイル収集
```bash
# Railwayの場合
railway run python manage.py collectstatic --noinput

# Dockerの場合
docker-compose exec backend python manage.py collectstatic --noinput
```

### 4. 初期データ作成
```bash
# デフォルトプラン作成
railway run python manage.py create_default_plans
```

## 🔍 デプロイ確認

### 1. ヘルスチェック
```bash
# バックエンド
curl https://your-backend-domain.com/api/health/

# フロントエンド
curl https://your-domain.com/
```

### 2. 機能テスト
- [ ] ユーザー登録・ログイン
- [ ] 音声生成
- [ ] プラン購入
- [ ] API呼び出し
- [ ] 使用量制限

### 3. 監視設定
- **Uptime Robot** - 可用性監視
- **Sentry** - エラー監視
- **Google Analytics** - アクセス解析

## 🔒 セキュリティ設定

### 1. HTTPS強制
```python
# settings.py
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

### 2. セキュリティヘッダー
```python
# settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

### 3. CORS設定
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "https://www.your-domain.com",
]
```

## 📊 パフォーマンス最適化

### 1. キャッシュ設定
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 2. CDN設定
- **Cloudflare** - 静的ファイル配信
- **AWS CloudFront** - 代替案

### 3. データベース最適化
```sql
-- インデックス作成
CREATE INDEX idx_usage_log_user_date ON usage_log(user_id, date);
CREATE INDEX idx_audio_generation_user_created ON audio_generation(user_id, created_at);
```

## 🚨 トラブルシューティング

### よくある問題

1. **CORS エラー**
   - フロントエンドドメインをCORS設定に追加

2. **Stripe Webhook エラー**
   - Webhook URLを本番環境に更新
   - Webhook Secretを確認

3. **データベース接続エラー**
   - DATABASE_URLの形式を確認
   - SSL設定を確認

4. **静的ファイル404**
   - collectstaticを実行
   - 静的ファイル設定を確認

### ログ確認
```bash
# Railway
railway logs

# Docker
docker-compose logs backend
```

## 📈 スケーリング

### 1. 水平スケーリング
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### 2. ロードバランサー
- **Nginx** - リバースプロキシ
- **HAProxy** - 代替案

### 3. データベーススケーリング
- **読み取りレプリカ**設定
- **コネクションプール**設定

---

デプロイが完了したら、[README.md](README.md)のデモリンクを更新してください。 