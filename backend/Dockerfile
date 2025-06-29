FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システム依存関係をインストール
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# 静的ファイルを収集
RUN python manage.py collectstatic --noinput

# ポート8000を公開
EXPOSE 8000

# アプリケーションを起動
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"] 