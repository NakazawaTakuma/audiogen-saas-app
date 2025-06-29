// src/components/forms/PasswordResetConfirmForm.tsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "@/services/authService";
import { PasswordResetConfirmData } from "@/types/auth";
import { validatePasswordStrength } from "@/utils/validation";
import { Icon } from "@/utils/Icon";
import axios from "axios";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Alert } from "@/components/shadcn-ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn-ui/card";

const PasswordResetConfirmForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [reNewPassword, setReNewPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── "トークンの有効 / 無効" を判定するステート ───
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenChecking, setTokenChecking] = useState<boolean>(true);

  // ───────────────────────────────────────────────────────
  // マウント時に「UID と token が有効か？」をバックエンドに問い合わせる
  // ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !token) {
      setError("無効なリンクです。URL を確認してください。");
      setTokenValid(false);
      setTokenChecking(false);
      return;
    }

    (async () => {
      try {
        setTokenChecking(true);
        // ① GET /api/users/password-reset-verify/?uid=…&token=…
        const resp = await axios.get<{ valid: boolean }>(
          `/api/users/password-reset-verify/?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`
        );
        if (resp.status === 200 && resp.data.valid) {
          setTokenValid(true);
        } else {
          // valid が false だったりレスポンス 200 以外
          setError("リンクの有効期限が切れているか、無効なリンクです。");
          setTokenValid(false);
        }
      } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.data) {
          // (2) まず「e.response.data」を unknown として受け取る
          const data = e.response.data as unknown;
          // (3) 'detail' プロパティが文字列として存在するか確認
          if (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            typeof (data as { detail?: unknown }).detail === "string"
          ) {
            setError((data as { detail: string }).detail);
          } else {
            setError("リンクの有効期限が切れているか、無効なリンクです。");
          }
        } else {
          setError("リンクの有効期限が切れているか、無効なリンクです。");
        }
        setTokenValid(false);
      } finally {
        setTokenChecking(false);
      }
    })();
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!uid || !token) {
      setError("無効なリンクです。");
      return;
    }
    if (newPassword !== reNewPassword) {
      setError("パスワードと確認用パスワードが一致しません。");
      return;
    }

    const passwordErr = validatePasswordStrength(newPassword);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }

    setIsSubmitting(true);
    const data: PasswordResetConfirmData = {
      uid,
      token,
      new_password: newPassword,
      re_new_password: reNewPassword,
    };

    try {
      await confirmPasswordReset(data);
      setSuccess("パスワードが正常に更新されました。ログインしてください。");
      // 数秒後にログイン画面にリダイレクトする
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(
        msg ||
          "パスワードリセットに失敗しました。リンクの有効期限を確認してください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmVisibility = () => {
    setShowConfirm((prev) => !prev);
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>新しいパスワードの設定</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ─── トークンチェック中は何も表示しないか、ローディングを入れても OK ─── */}
        {tokenChecking && <p>リンクを検証中…</p>}

        {/* ─── トークンが無効ならエラーを表示し、フォームは出さない ─── */}
        {tokenValid === false && error && (
          <Alert variant="destructive" className="mb-2 text-pretty">
            {error}
          </Alert>
        )}

        {/* ─── トークンが有効なら、通常のエラー/成功メッセージ＋フォームを出す ─── */}
        {tokenValid && (
          <>
            {error && (
              <Alert variant="destructive" className="mb-2 text-pretty">
                {error}
              </Alert>
            )}
            {success && <Alert className="mb-2 text-pretty">{success}</Alert>}

            {!success && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div style={{ position: "relative" }}>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新しいパスワード"
                    style={{ paddingRight: 40 }}
                    required
                  />
                  <Button
                    type="button"
                    onClick={togglePasswordVisibility}
                    variant="ghost"
                    size="icon"
                    aria-label={
                      showPassword ? "パスワードを隠す" : "パスワードを表示"
                    }
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 8,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {showPassword ? (
                      <Icon name="eye-fill" />
                    ) : (
                      <Icon name="eye-slash" />
                    )}
                  </Button>
                </div>

                <div style={{ position: "relative" }}>
                  <Input
                    id="reNewPassword"
                    type={showConfirm ? "text" : "password"}
                    value={reNewPassword}
                    onChange={(e) => setReNewPassword(e.target.value)}
                    placeholder="確認用パスワード"
                    style={{ paddingRight: 40 }}
                    required
                  />
                  <Button
                    type="button"
                    onClick={toggleConfirmVisibility}
                    variant="ghost"
                    size="icon"
                    aria-label={
                      showConfirm
                        ? "確認用パスワードを隠す"
                        : "確認用パスワードを表示"
                    }
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 8,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {showConfirm ? (
                      <Icon name="eye-fill" />
                    ) : (
                      <Icon name="eye-slash" />
                    )}
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "送信中…" : "パスワードを変更する"}
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordResetConfirmForm;
