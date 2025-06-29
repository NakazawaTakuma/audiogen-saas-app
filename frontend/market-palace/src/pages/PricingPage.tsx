import React, { useState, useEffect } from "react";
import Layout from "@/components/common/organisms/Layout/Layout";
import SectionTitle from "@/components/common/atoms/SectionTitle";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shadcn-ui/card";
import { Button } from "@/components/shadcn-ui/button";
import { Badge } from "@/components/shadcn-ui/badge";
import { Progress } from "@/components/shadcn-ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  daily_audio_limit: number;
  max_audio_duration: number;
  max_steps: number;
  can_use_api: boolean;
  can_download: boolean;
  can_edit_audio: boolean;
  is_active: boolean;
  is_popular: boolean;
  features_list: string[];
  is_free: boolean;
}

interface SubscriptionStatus {
  has_subscription: boolean;
  plan?: Plan;
  status?: string;
  days_remaining?: number;
  current_usage: {
    audio_generations: number;
    api_calls: number;
    total_duration: number;
  };
  usage_limit: number;
  usage_percentage: number;
}

const PricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { user, openLogin } = useAuth();
  const location = useLocation();

  // プラン一覧を取得
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/billing/api/plans/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPlans(data.results || data);
        }
      } catch (error) {
        console.error("プラン取得エラー:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    if (user) {
      fetchPlans();
    } else {
      setLoadingPlans(false);
    }
  }, [user]);

  // サブスク状況を取得
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const res = await fetch("/api/billing/api/subscriptions/status/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error("サブスク状況取得エラー:", error);
      }
    };

    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const handleUpgrade = async (planId: number) => {
    if (!user) {
      toast.error("ログインが必要です", {
        description: "プラン変更にはログインしてください。",
      });
      openLogin(location.pathname);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout-session/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("決済ページの作成に失敗しました");
      }
    } catch {
      toast.error("決済ページへの遷移に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscriptionStatus?.has_subscription) {
      return plans.find(plan => plan.is_free);
    }
    return subscriptionStatus.plan;
  };

  const isCurrentPlan = (plan: Plan) => {
    const currentPlan = getCurrentPlan();
    return currentPlan?.id === plan.id;
  };

  const canUpgrade = (plan: Plan) => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return true;
    return plan.price > currentPlan.price;
  };

  if (loadingPlans) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <SectionTitle>価格プラン</SectionTitle>
          <p className="text-lg text-muted-foreground">
            あなたのニーズに合わせてプランを選択してください
          </p>
        </div>

        {/* 現在のサブスク状況表示 */}
        {user && subscriptionStatus && (
          <div className="mb-8 p-6 bg-gradient-to-r rounded-lg ">
            <h3 className="text-lg font-semibold mb-4">現在のプラン状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">プラン</p>
                <p className="font-semibold">
                  {subscriptionStatus.plan?.display_name || "無料プラン"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">今日の使用量</p>
                <p className="font-semibold">
                  {subscriptionStatus.current_usage.audio_generations} / {subscriptionStatus.usage_limit}回
                </p>
                <Progress 
                  value={subscriptionStatus.usage_percentage} 
                  className="mt-1"
                />
              </div>
     
            </div>
          </div>
        )}

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col items-center p-8 shadow-xl border-0 bg-white/90 backdrop-blur-md rounded-2xl ${
                plan.is_popular ? "ring-2 ring-primary" : ""
              } ${isCurrentPlan(plan) ? "ring-2 ring-green-500" : ""}`}
            >
              <CardHeader className="flex flex-col items-center">
                <Badge
                  variant={plan.is_popular ? "default" : "secondary"}
                  className="mb-2 whitespace-nowrap min-w-[3.5rem]"
                >
                  {plan.is_popular ? "人気" : plan.is_free ? "無料" : "有料"}
                </Badge>
                <CardTitle className="text-2xl font-bold mb-2 whitespace-nowrap text-balance min-w-[8rem] flex items-center justify-center">
                  {plan.display_name}
                </CardTitle>
                <div className="text-3xl font-extrabold text-primary mb-4 whitespace-nowrap text-balance min-w-[6rem] flex items-center justify-center">
                  ${plan.price}/月
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center">
                <ul className="mb-6 space-y-2 text-left">
                  {plan.features_list.map((feature, index) => (
                    <li
                      key={index}
                      className="text-base text-gray-700 flex items-center gap-2"
                    >
                      <span>•</span> {feature}
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan(plan) ? (
                  <Button disabled className="w-full">
                    現在のプラン
                  </Button>
                ) : canUpgrade(plan) ? (
                  <Button 
                    onClick={() => handleUpgrade(plan.id)} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "処理中..." : plan.is_free ? "無料プランに変更" : "アップグレード"}
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    ダウングレード不可
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;
