# 🔒 セキュリティチェックリスト - GitHub公開前

このチェックリストを使用して、GitHubリポジトリ公開前のセキュリティ確認を行ってください。

## ✅ 機密情報の確認

### 🔑 API キー・トークン
- [x] **Django SECRET_KEY** - 環境変数に移動済み
- [x] **Stripe API Keys** - 環境変数に移動済み
- [x] **Stripe Webhook Secret** - 環境変数に移動済み
- [x] **HuggingFace Token** - 環境変数に移動済み
- [x] **Email Password** - 環境変数に移動済み

### 📧 メール設定
- [x] **Gmail App Password** - 環境変数に移動済み
- [x] **Email Address** - 環境変数に移動済み

### 🗄️ データベース
- [x] **SQLite Database** - 削除済み
- [x] **Database Credentials** - 環境変数で管理

## ✅ ファイル・ディレクトリの確認

### 🗂️ 削除済みファイル
- [x] **db.sqlite3** - 削除済み
- [x] **frontend.zip** - 削除済み
- [x] **structure.txt** - 削除済み
- [x] **.env files** - .gitignoreで除外

### 📁 除外ディレクトリ
- [x] **media/** - .gitignoreで除外
- [x] **staticfiles/** - .gitignoreで除外
- [x] **node_modules/** - .gitignoreで除外
- [x] **.venv/** - .gitignoreで除外

## ✅ 環境変数設定

### 🔧 バックエンド環境変数
```env
# 必須設定
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# データベース
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe設定
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HuggingFace設定
HUGGINGFACE_TOKEN=hf_...

# メール設定
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 🔧 フロントエンド環境変数
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## ✅ コードレビュー

### 🔍 機密情報の検索
```bash
# 以下のパターンで検索して機密情報がないことを確認
grep -r "sk_test_\|sk_live_\|pk_test_\|pk_live_\|hf_\|SECRET_KEY\|password\|token" .
```

### 📝 コメント・ドキュメント
- [x] **機密情報の記載なし** - README.md確認済み
- [x] **環境変数サンプル** - env.example作成済み
- [x] **セットアップ手順** - README.mdに記載済み

## ✅ セキュリティベストプラクティス

### 🔐 認証・認可
- [x] **JWT認証** - 適切に実装済み
- [x] **パスワードハッシュ化** - Django標準使用
- [x] **CSRF保護** - Django標準使用
- [x] **CORS設定** - 適切に設定済み

### 🛡️ データ保護
- [x] **環境変数使用** - 機密情報を環境変数で管理
- [x] **.gitignore設定** - 機密ファイルを除外
- [x] **サンプルファイル** - 実際の値は含まない

## ✅ 公開前最終確認

### 📋 チェック項目
- [ ] **機密情報の完全削除** - 上記項目すべて確認
- [ ] **環境変数サンプル** - env.exampleファイル確認
- [ ] **README.md更新** - セットアップ手順確認
- [ ] **.gitignore確認** - 除外設定確認
- [ ] **テスト実行** - 環境変数設定後の動作確認

### 🚨 注意事項
1. **本番環境では必ず環境変数を設定**
2. **Stripe本番キーは絶対にコミットしない**
3. **データベースパスワードは環境変数で管理**
4. **メールパスワードは環境変数で管理**

## 🔄 公開後の対応

### 📝 ドキュメント更新
- [ ] **README.md** - 実際のデプロイURLに更新
- [ ] **DEMO_GUIDE.md** - 実際のリンクに更新
- [ ] **DEPLOYMENT.md** - 実際の設定例に更新

### 🔗 リンク更新
- [ ] **GitHub Description** - 実際のデモリンク追加
- [ ] **ポートフォリオ** - プロジェクトリンク追加
- [ ] **ソーシャルメディア** - プロジェクト紹介投稿

---

**重要**: このチェックリストを完了してからGitHubに公開してください！ 