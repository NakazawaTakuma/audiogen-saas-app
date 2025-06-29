import React from "react";
import Layout from "@/components/common/organisms/Layout/Layout";
import SectionTitle from "@/components/common/atoms/SectionTitle";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shadcn-ui/card";
import { Badge } from "@/components/shadcn-ui/badge";
import { Button } from "@/components/shadcn-ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import { 
  Code, 
  Key, 
  AlertCircle, 
  Play, 
  Copy,
  CheckCircle,
  ExternalLink
} from "lucide-react";

const DocsPage: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // トースト通知を表示（実装済みのtoastを使用）
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <SectionTitle>API ドキュメント</SectionTitle>
          <p className="text-lg text-muted-foreground">
            AudioGen SaaS APIの使用方法とサンプルコード
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="auth">認証</TabsTrigger>
            <TabsTrigger value="endpoints">エンドポイント</TabsTrigger>
            <TabsTrigger value="examples">サンプル</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  API概要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  AudioGen SaaS APIは、AI音声生成機能をRESTful APIとして提供します。
                  高品質な音声を簡単に生成し、アプリケーションに組み込むことができます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800">Base URL</h4>
                    <code className="text-sm text-blue-600">https://api.audiogen.com</code>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">認証方式</h4>
                    <code className="text-sm text-green-600">Bearer Token</code>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800">レスポンス形式</h4>
                    <code className="text-sm text-purple-600">Audio/WAV</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  認証方法
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  APIを使用するには、JWTアクセストークンが必要です。
                  トークンはAuthorizationヘッダーにBearer形式で含めてください。
                </p>
                <div className="bg-gray-100 rounded p-4 font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">リクエストヘッダー例:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('Authorization: Bearer your_access_token')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code>Authorization: Bearer your_access_token</code>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">注意事項</h4>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• トークンは15分で期限切れになります</li>
                        <li>• リフレッシュトークンで新しいアクセストークンを取得してください</li>
                        <li>• APIキーは機密情報として扱い、公開しないでください</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  音声生成エンドポイント
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-lg font-mono">/api/audio/generate/</code>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">リクエストパラメータ</h4>
                    <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Form Data:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`prompt: "さわやかな朝のBGM"
duration: 5
steps: 100
neg_prompt: "Low quality."`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre>{`prompt: "さわやかな朝のBGM"
duration: 5
steps: 100
neg_prompt: "Low quality."`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">パラメータ詳細</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">必須</Badge>
                          <code className="text-sm">prompt</code>
                        </div>
                        <p className="text-sm text-gray-600">音声生成のためのプロンプト（文字列）</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">任意</Badge>
                          <code className="text-sm">duration</code>
                        </div>
                        <p className="text-sm text-gray-600">音声の長さ（秒、1-30）</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">任意</Badge>
                          <code className="text-sm">steps</code>
                        </div>
                        <p className="text-sm text-gray-600">生成ステップ数（10-200）</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">任意</Badge>
                          <code className="text-sm">neg_prompt</code>
                        </div>
                        <p className="text-sm text-gray-600">除外したい要素のプロンプト</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">レスポンス</h4>
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">成功時</span>
                      </div>
                      <p className="text-sm text-green-700">
                        WAV形式の音声ファイルが直接返されます。
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">エラーレスポンス</h4>
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-800">エラー時</span>
                      </div>
                      <pre className="text-sm text-red-700">{`{
  "detail": "エラーメッセージ",
  "error_type": "auth|network|generation|limit"
}`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  サンプルコード
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Python</h4>
                  <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Python Example:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`import requests

url = "https://api.audiogen.com/api/audio/generate/"
headers = {
    "Authorization": "Bearer your_access_token"
}
data = {
    "prompt": "さわやかな朝のBGM",
    "duration": 5,
    "steps": 100,
    "neg_prompt": "Low quality."
}

response = requests.post(url, headers=headers, data=data)

if response.status_code == 200:
    with open("generated_audio.wav", "wb") as f:
        f.write(response.content)
    print("音声ファイルを保存しました")
else:
    print("エラー:", response.json())`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  <pre>{`import requests

url = "https://api.audiogen.com/api/audio/generate/"
headers = {
    "Authorization": "Bearer your_access_token"
}
data = {
    "prompt": "さわやかな朝のBGM",
    "duration": 5,
    "steps": 100,
    "neg_prompt": "Low quality."
}

response = requests.post(url, headers=headers, data=data)

if response.status_code == 200:
    with open("generated_audio.wav", "wb") as f:
        f.write(response.content)
    print("音声ファイルを保存しました")
else:
    print("エラー:", response.json())`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">JavaScript (Fetch)</h4>
                  <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">JavaScript Example:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`const generateAudio = async () => {
  const url = "https://api.audiogen.com/api/audio/generate/";
  const formData = new FormData();
  formData.append("prompt", "さわやかな朝のBGM");
  formData.append("duration", "5");
  formData.append("steps", "100");
  formData.append("neg_prompt", "Low quality.");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer your_access_token"
      },
      body: formData
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      // 音声を再生またはダウンロード
      console.log("音声生成成功:", audioUrl);
    } else {
      const error = await response.json();
      console.error("エラー:", error);
    }
  } catch (error) {
    console.error("リクエストエラー:", error);
  }
};`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  <pre>{`const generateAudio = async () => {
  const url = "https://api.audiogen.com/api/audio/generate/";
  const formData = new FormData();
  formData.append("prompt", "さわやかな朝のBGM");
  formData.append("duration", "5");
  formData.append("steps", "100");
  formData.append("neg_prompt", "Low quality.");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer your_access_token"
      },
      body: formData
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      // 音声を再生またはダウンロード
      console.log("音声生成成功:", audioUrl);
    } else {
      const error = await response.json();
      console.error("エラー:", error);
    }
  } catch (error) {
    console.error("リクエストエラー:", error);
  }
};`}</pre>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">SDK・ライブラリ</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        公式SDKやクライアントライブラリは現在開発中です。
                        詳細は公式GitHubリポジトリをご確認ください。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DocsPage;
