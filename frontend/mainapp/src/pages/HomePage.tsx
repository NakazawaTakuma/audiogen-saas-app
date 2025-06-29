// pages/HomePage.tsx
import React, { useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/shadcn-ui/card";
import { Alert } from "@/components/shadcn-ui/alert";
import { Label } from "@/components/shadcn-ui/label";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { Progress } from "@/components/shadcn-ui/progress";
import { Sparkles, Music, Link2, ChevronRight, Loader2, AlertCircle, Wifi, Shield, Zap } from "lucide-react";
import Layout from "@/components/common/organisms/Layout/Layout";
import SectionTitle from "@/components/common/atoms/SectionTitle";
import FeatureCard from "@/components/common/molecules/FeatureCard";
import StepCard from "@/components/common/molecules/StepCard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "高品質AI音声",
    desc: "StableAudioPipelineで高精度な音声を即座に生成。多様な用途に対応。",
  },
  {
    title: "無料プラン",
    desc: "1日20回まで無料で利用可能。気軽にAI音声を体験。",
  },
  {
    title: "API連携",
    desc: "API経由で自動化・外部サービス連携も簡単。",
  },
];

const steps = [
  "プロンプトを入力",
  "パラメータを調整（任意）",
  "音声生成ボタンを押す",
  "音声を再生・ダウンロード",
];

const featureIcons = [
  <Music key="music" className="w-8 h-8 text-primary mx-auto mb-2" />,
  <Sparkles key="sparkles" className="w-8 h-8 text-primary mx-auto mb-2" />,
  <Link2 key="link" className="w-8 h-8 text-primary mx-auto mb-2" />,
];

const demoAudios = [
  {
    title: "朝のBGMサンプル",
    url: "/demo-audio/morning.wav", // ダミー
  },
  {
    title: "ナレーションサンプル",
    url: "/demo-audio/narration.wav", // ダミー
  },
];

const HomePage: React.FC = () => {
  const { user, openLogin, accessToken, refreshAccessToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [stepsVal, setStepsVal] = useState(100);
  const [negPrompt, setNegPrompt] = useState("Low quality.");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'generation' | 'limit' | null>(null);
  const [history, setHistory] = useState<
    { url: string; prompt: string; date: string }[]
  >([]);
  const [count, setCount] = useState<number>(0);
  const maxCount = 20;
  const navigate = useNavigate();

  // ローディングステップの定義
  const loadingSteps = [
    "モデルを準備中...",
    "プロンプトを処理中...",
    "音声を生成中...",
    "ファイルを最適化中..."
  ];

  // 生成履歴をlocalStorageから読み込み
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('audioGenerationHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (error) {
        console.error('履歴の読み込みに失敗しました:', error);
      }
    }

    // 使用回数をlocalStorageから読み込み
    const savedCount = localStorage.getItem('audioGenerationCount');
    const savedDate = localStorage.getItem('audioGenerationDate');
    const today = new Date().toDateString();
    
    if (savedDate === today && savedCount) {
      try {
        const parsedCount = parseInt(savedCount, 10);
        setCount(parsedCount);
      } catch (error) {
        console.error('使用回数の読み込みに失敗しました:', error);
      }
    } else {
      // 日付が変わった場合はリセット
      setCount(0);
      localStorage.setItem('audioGenerationDate', today);
      localStorage.setItem('audioGenerationCount', '0');
    }
  }, []);

  // 生成履歴をlocalStorageに保存する関数
  const saveHistory = (newHistory: { url: string; prompt: string; date: string }[]) => {
    setHistory(newHistory);
    localStorage.setItem('audioGenerationHistory', JSON.stringify(newHistory));
  };

  // 使用回数をlocalStorageに保存する関数
  const saveCount = (newCount: number) => {
    setCount(newCount);
    localStorage.setItem('audioGenerationCount', newCount.toString());
    localStorage.setItem('audioGenerationDate', new Date().toDateString());
  };

  const simulateProgress = () => {
    setLoadingProgress(0);
    setLoadingStep(loadingSteps[0]);
    
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5; // 5-20%ずつ増加
        const stepIndex = Math.floor((newProgress / 100) * (loadingSteps.length - 1));
        setLoadingStep(loadingSteps[Math.min(stepIndex, loadingSteps.length - 1)]);
        
        if (newProgress >= 95) { // 95%で停止
          clearInterval(interval);
          return 95;
        }
        return newProgress;
      });
    }, 500);
    
    return interval;
  };

  // エラーメッセージの改善
  const getErrorMessage = (error: string, type: 'auth' | 'network' | 'generation' | 'limit') => {
    const errorMessages = {
      auth: {
        title: "認証エラー",
        message: "セッションが期限切れです。再ログインしてください。",
        solution: "ログインボタンをクリックして再認証してください。"
      },
      network: {
        title: "通信エラー",
        message: "サーバーとの通信に失敗しました。",
        solution: "インターネット接続を確認し、しばらく時間をおいてから再試行してください。"
      },
      generation: {
        title: "音声生成エラー",
        message: "音声の生成に失敗しました。",
        solution: "プロンプトを変更するか、パラメータを調整して再試行してください。"
      },
      limit: {
        title: "使用制限",
        message: "本日の使用制限に達しました。",
        solution: "Proプランにアップグレードするか、明日までお待ちください。"
      }
    };
    
    return errorMessages[type];
  };

  const clearError = () => {
    setError(null);
    setErrorDetails(null);
    setErrorType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 認証チェック
    if (!user) {
      toast.error("ログインが必要です", {
        description: "音声生成機能を利用するにはログインしてください。",
      });
      openLogin();
      return;
    }

    // 使用制限チェック
    if (count >= maxCount) {
      setError(getErrorMessage("使用制限", "limit").message);
      setErrorDetails(getErrorMessage("使用制限", "limit").solution);
      setErrorType("limit");
      toast.error("使用制限に達しました", {
        description: "Proプランにアップグレードするか、明日までお待ちください。",
      });
      return;
    }

    setError(null);
    setErrorDetails(null);
    setErrorType(null);
    setAudioUrl(null);
    setLoading(true);
    
    // プログレスシミュレーション開始
    const progressInterval = simulateProgress();
    
    const makeRequest = async (token: string) => {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("duration", duration.toString());
      formData.append("steps", stepsVal.toString());
      formData.append("neg_prompt", negPrompt);
      
      const headers: Record<string, string> = {};
      headers['Authorization'] = `Bearer ${token}`;
      
      return await fetch("/api/audio/generate/", {
        method: "POST",
        headers,
        body: formData,
      });
    };
    
    try {
      let res = await makeRequest(accessToken || "");
      
      if (res.status === 401) {
        // 認証エラーの場合、トークンリフレッシュを試行
        try {
          const newToken = await refreshAccessToken();
          res = await makeRequest(newToken);
        } catch {
          setError(getErrorMessage("認証エラー", "auth").message);
          setErrorDetails(getErrorMessage("認証エラー", "auth").solution);
          setErrorType("auth");
          toast.error("認証エラー", {
            description: "セッションが期限切れです。再ログインしてください。",
          });
          openLogin();
          setLoading(false);
          clearInterval(progressInterval);
          return;
        }
      }
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "音声生成に失敗しました");
        setErrorDetails(data.detail || "音声生成に失敗しました");
        setErrorType("generation");
        setLoading(false);
        clearInterval(progressInterval);
        return;
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      saveHistory(
        [{ url, prompt, date: new Date().toLocaleString() }, ...history].slice(0, 5)
      );
      saveCount(count + 1);
      
      // プログレスを100%にして完了
      setLoadingProgress(100);
      setLoadingStep("完了！");
      
      setTimeout(() => {
        toast("音声生成完了", {
          description: "音声ファイルの再生・ダウンロードが可能です。",
        });
      }, 500);
      
    } catch (error) {
      console.error("音声生成エラー:", error);
      setError(getErrorMessage("通信エラー", "network").message);
      setErrorDetails(getErrorMessage("通信エラー", "network").solution);
      setErrorType("network");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
        setLoadingStep("");
      }, 1000);
      clearInterval(progressInterval);
    }
  };

  return (
    <Layout>
      {/* ヒーローセクション */}
      {/* <section className="pt-28 pb-20 px-4 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-100"> */}
      <section >
        <div className="absolute inset-0 pointer-events-none select-none opacity-60 blur-2xl z-0" />
        <div className="flex flex-col items-center mb-4 z-10">
          {/* タイトルアイコン */}
          <div className="mb-4">
            <div className="w-24 h-24 bg-white/80 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border-2 border-primary">
              <img src="/appicon.svg" alt="Logo" className="h-14 w-14" />
            </div>
          </div>
          {/* タイトル名 */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary drop-shadow-lg mb-2">
            AudioGen SaaS
          </h1>
          <p className="text-lg md:text-2xl text-gray-700 mb-6 font-medium">
            AIで高品質な音声を即座に生成。API連携や無料プランも。
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-4 rounded-full font-bold shadow-lg bg-gradient-to-r from-indigo-400 to-purple-400 text-white hover:scale-105 transition-transform"
            onClick={() => navigate("/pricing")}
          >
            今すぐ無料で体験する
          </Button>
        </div>
        {/* デモ音声セクション */}
        <div className="mt-12 w-full max-w-2xl mx-auto z-10">
          <Card className="bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">デモ音声を聴いてみる</CardTitle>
              <CardDescription>AI生成サンプル音声</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6 items-center justify-center">
              {demoAudios.map((demo) => (
                <div key={demo.title} className="flex flex-col items-center gap-2">
                  <div className="font-semibold text-gray-700">{demo.title}</div>
                  <audio controls src={demo.url} className="w-48" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* 特徴カードセクション */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <SectionTitle>サービスの特徴</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className="transition-transform duration-200 hover:scale-105"
            >
              <FeatureCard
                icon={featureIcons[idx]}
                title={f.title}
                description={f.desc}
                badgeText={`特徴 ${idx + 1}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            className="px-8 py-3 rounded-full font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-white shadow-lg hover:scale-105 transition-transform"
            onClick={() => navigate("/pricing")}
          >
            プランを見る
          </Button>
        </div>
      </section>
      {/* 使い方ステップ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <SectionTitle>使い方</SectionTitle>
        <ol className="flex flex-col gap-6 mt-8">
          {steps.map((s, i) => (
            <li key={i}>
              <StepCard
                stepNumber={i + 1}
                title={s}
                icon={<ChevronRight className="text-muted-foreground" />}
              />
            </li>
          ))}
        </ol>
      </section>
      <Card className="w-full max-w-xl mx-auto bg-white/70 backdrop-blur-md shadow-2xl border-0 z-10">
        <CardHeader>
          <CardTitle>音声生成フォーム</CardTitle>
          <CardDescription>
            プロンプトやパラメータを入力して音声を生成できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                音声生成機能を利用するにはログインが必要です
              </p>
              <Button onClick={() => openLogin()} size="lg">
                ログインして利用開始
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2 text-left">
                <Label htmlFor="prompt">プロンプト</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  rows={2}
                  placeholder="例: さわやかな朝のBGM"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2 text-left">
                  <Label htmlFor="duration">長さ（秒）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={30}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2 text-left">
                  <Label htmlFor="steps">ステップ数</Label>
                  <Input
                    id="steps"
                    type="number"
                    min={10}
                    max={200}
                    value={stepsVal}
                    onChange={(e) => setStepsVal(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 text-left">
                <Label htmlFor="negPrompt">ネガティブプロンプト</Label>
                <Input
                  id="negPrompt"
                  value={negPrompt}
                  onChange={(e) => setNegPrompt(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  本日残り生成回数:{" "}
                  <span
                    className={
                      count >= maxCount
                        ? "text-red-500 font-bold"
                        : "font-bold"
                    }
                  >
                    {maxCount - count}
                  </span>{" "}
                  / {maxCount}
                </span>
              </div>
              
              <Button
                type="submit"
                disabled={
                  loading ||
                  !prompt ||
                  duration < 1 ||
                  stepsVal < 10 ||
                  count >= maxCount
                }
                className="mt-2 text-lg font-bold h-12 rounded-xl shadow-md transition-all duration-200 hover:scale-105"
                size="lg"
              >
                {loading ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center mb-2">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      <span className="text-sm">{loadingStep}</span>
                    </div>
                    <Progress value={loadingProgress} className="w-full h-2" />
                  </div>
                ) : (
                  "音声生成"
                )}
              </Button>
            </form>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4 text-pretty">
              <div className="flex items-start gap-3">
                {errorType === 'auth' && <Shield className="h-5 w-5 mt-0.5" />}
                {errorType === 'network' && <Wifi className="h-5 w-5 mt-0.5" />}
                {errorType === 'generation' && <Zap className="h-5 w-5 mt-0.5" />}
                {errorType === 'limit' && <AlertCircle className="h-5 w-5 mt-0.5" />}
                {!errorType && <AlertCircle className="h-5 w-5 mt-0.5" />}
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    {errorType ? getErrorMessage(error, errorType).title : "エラー"}
                  </div>
                  <div className="text-sm mb-2">{error}</div>
                  {errorDetails && (
                    <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
                      <strong>解決方法:</strong> {errorDetails}
                    </div>
                  )}
                  {errorType === 'auth' && (
                    <Button 
                      onClick={() => {
                        clearError();
                        openLogin();
                      }} 
                      size="sm" 
                      className="mt-2"
                    >
                      ログインする
                    </Button>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </Button>
              </div>
            </Alert>
          )}
          {audioUrl && (
            <Card className="mt-6 bg-white/80 backdrop-blur-md border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-green-600" />
                  生成結果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 音声詳細情報 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-gray-700">長さ</div>
                    <div className="text-lg font-bold text-green-600">{duration}秒</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-gray-700">ステップ数</div>
                    <div className="text-lg font-bold text-blue-600">{stepsVal}</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-gray-700">生成日時</div>
                    <div className="text-lg font-bold text-purple-600">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
       
                </div>
                
                {/* 音声プレーヤー */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <audio 
                    src={audioUrl} 
                    controls 
                    style={{ width: "100%" }}
                    className="w-full"
                  />
                </div>
                
                {/* アクションボタン */}
                <div className="flex justify-center">
                  <Button asChild variant="default" className="flex-1 max-w-xs">
                    <a href={audioUrl} download="generated.wav" className="underline">
                      <Music className="h-4 w-4 mr-2" />
                      ダウンロード
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {history.length > 0 && (
            <div className="mt-8">
              <SectionTitle>生成履歴（直近5件）</SectionTitle>
              <ul className="space-y-4 mt-2">
                {history.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-gray-50 rounded-lg p-4 shadow flex flex-col gap-2"
                  >
                    <div className="text-xs text-gray-500">{item.date}</div>
                    <div className="text-sm text-gray-800 truncate">
                      {item.prompt}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <audio controls src={item.url} style={{ width: "80%" }}  />
                      <a
                        href={item.url}
                        download={`history_audio_${idx + 1}.wav`}
                        className="text-blue-600 underline text-xs"
                      >
                        ダウンロード
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default HomePage;
