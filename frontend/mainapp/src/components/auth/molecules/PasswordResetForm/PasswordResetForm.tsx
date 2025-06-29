// src/components/auth/molecules/PasswordResetForm/PasswordResetForm.tsx

import React, { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { requestPasswordReset } from "../../../../services/authService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Alert } from "@/components/shadcn-ui/alert";

const PasswordResetForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSuccess(
        "パスワードリセット用のメールを送信しました。メールをご確認ください。"
      );
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(
        msg ||
          "パスワードリセットリクエストに失敗しました。もう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" className="mb-2 text-pretty">
          {error}
        </Alert>
      )}
      {success && <Alert className="mb-2 text-pretty">{success}</Alert>}

      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="登録済みのメールアドレス"
        className=""
        required
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "送信中…" : "リセットリンクを送信"}
      </Button>

      <p className="text-sm text-center mt-2">
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto align-baseline"
          onClick={() => openLogin()}
        >
          ログイン画面に戻る
        </Button>
      </p>
    </form>
  );
};

export default PasswordResetForm;
