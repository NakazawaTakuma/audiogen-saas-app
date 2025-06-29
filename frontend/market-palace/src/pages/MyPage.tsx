import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/shadcn-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn-ui/card";
import { Icon } from "@/utils/Icon";
import Layout from "@/components/common/organisms/Layout/Layout";
import { Alert } from "@/components/shadcn-ui/alert";
import { fetchMeApi } from "@/services/userService";

function useQuery() {
  return new URLSearchParams(window.location.search);
}

const MyPage: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const [apiKey, setApiKey] = useState(user?.api_key || "");
  const [apiKeyMsg, setApiKeyMsg] = useState("");
  const query = useQuery();
  const success = query.get("success") === "true";
  const canceled = query.get("canceled") === "true";

  const handleReissueApiKey = async () => {
    setApiKeyMsg("");
    try {
      const res = await fetch("/api/users/reissue-api-key/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await res.json();
      if (data.api_key) {
        setApiKey(data.api_key);
        setApiKeyMsg("APIキーを再発行しました。");
        const me = await fetchMeApi();
        setUser(me.data);
      } else {
        setApiKeyMsg("APIキーの再発行に失敗しました。");
      }
    } catch {
      setApiKeyMsg("APIキーの再発行に失敗しました。");
    }
  };

  const handleDeleteApiKey = async () => {
    setApiKeyMsg("");
    try {
      const res = await fetch("/api/users/delete-api-key/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await res.json();
      if (data.api_key === null) {
        setApiKey("");
        setApiKeyMsg("APIキーを削除しました。");
        const me = await fetchMeApi();
        setUser(me.data);
      } else {
        setApiKeyMsg("APIキーの削除に失敗しました。");
      }
    } catch {
      setApiKeyMsg("APIキーの削除に失敗しました。");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">ログインが必要です</p>
              <Button onClick={() => (window.location.href = "/")}>
                ホームに戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* サブスク状態の通知 */}
        {success && (
          <Alert variant="default" className="mb-4 text-pretty">
            有料プランへのアップグレードが完了しました！
          </Alert>
        )}
        {canceled && (
          <Alert variant="destructive" className="mb-4 text-pretty">
            サブスクリプションの手続きがキャンセルされました。
          </Alert>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-gray-600">
            アカウント情報と利用状況を確認できます
          </p>
          <div className="mt-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-white font-bold"
              style={{
                background: user.plan_type === "pro" ? "#6366f1" : "#6b7280",
              }}
            >
              {user.plan_type === "pro" ? "有料プラン" : "無料プラン"}
            </span>
          </div>
        </div>
        {/* APIキー表示・再発行 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="key" />
              APIキー（外部連携用）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {apiKey ? (
                <>
                  <span className="font-mono text-base bg-gray-100 px-3 py-1 rounded select-all break-all">
                    {apiKey}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReissueApiKey}
                  >
                    再発行
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteApiKey}
                  >
                    削除
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReissueApiKey}
                >
                  発行
                </Button>
              )}
            </div>
            {apiKeyMsg && (
              <Alert className="mt-2 text-pretty">{apiKeyMsg}</Alert>
            )}
            <div className="text-xs text-gray-500 mt-2">
              ※APIキーは外部サービスやCLIから音声生成APIを利用する際に使用します。
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* プロフィール情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="settings" />
                プロフィール情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ユーザー名
                </label>
                <p className="text-gray-900">{user.username}</p>
              </div>
              {/* <div>
                <label className="text-sm font-medium text-gray-700">
                  表示名
                </label>
                <p className="text-gray-900">{user.display_name || "未設定"}</p>
              </div> */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {/* <div>
                <label className="text-sm font-medium text-gray-700">
                  自己紹介
                </label>
                <p className="text-gray-900">{user.bio || "未設定"}</p>
              </div> */}
            </CardContent>
          </Card>

          {/* 利用状況 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="clock-history" />
                利用状況
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  アカウント作成日
                </label>
                <p className="text-gray-900">
                  {new Date(user.date_joined).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  最終ログイン
                </label>
                <p className="text-gray-900">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString("ja-JP")
                    : "初回ログイン"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  アカウント状態
                </label>
                <p className="text-gray-900">
                  {user.is_active ? "有効" : "無効"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* アクション */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="settings" />
                アカウント管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline">プロフィール編集</Button>
                <Button variant="outline">パスワード変更</Button>
                <Button variant="destructive" onClick={logout}>
                  ログアウト
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MyPage;
