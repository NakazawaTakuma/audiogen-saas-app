import React, { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { RegisterData } from "../../../../types/auth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Icon } from "@/utils/Icon";
import { validateUsername, validatePasswordStrength } from "@/utils/validation";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Alert } from "@/components/shadcn-ui/alert";

const RegisterForm: React.FC = () => {
  const { register, openLogin } = useAuth();
  const [form, setForm] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // submit中ローディングフラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name as keyof RegisterData]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // --- (1) ユーザー名チェック ---
    const usernameErr = validateUsername(form.username);
    if (usernameErr) {
      setError(usernameErr);
      return;
    }

    // --- (2) パスワードと確認用の一致チェック ---
    if (form.password !== form.confirmPassword) {
      setError("パスワードと確認用パスワードが一致しません。");
      return;
    }
    // --- (3) パスワード強度チェック ---
    const passwordErr = validatePasswordStrength(form.password);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(form);
      // 成功すればモーダルの中身は AuthProvider が切り替えるので、ここで何もしない
    } catch (err) {
      setError(getErrorMessage(err));
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" className="mb-2 text-pretty">
          {error}
        </Alert>
      )}

      <Input
        name="username"
        type="text"
        value={form.username}
        onChange={handleChange}
        placeholder="ユーザー名"
        required
      />
      <Input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="メールアドレス"
        required
      />

      <div style={{ position: "relative" }}>
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          placeholder="パスワード"
          style={{ paddingRight: 40 }}
          required
        />
        <Button
          type="button"
          onClick={togglePasswordVisibility}
          variant="ghost"
          size="icon"
          aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
          style={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
          }}
        >
          {showPassword ? <Icon name="eye-fill" /> : <Icon name="eye-slash" />}
        </Button>
      </div>

      <div style={{ position: "relative" }}>
        <Input
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          value={form.confirmPassword}
          onChange={handleChange}
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
            showConfirm ? "確認用パスワードを隠す" : "確認用パスワードを表示"
          }
          style={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
          }}
        >
          {showConfirm ? <Icon name="eye-fill" /> : <Icon name="eye-slash" />}
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "登録中…" : "登録"}
      </Button>

      <p className="text-sm text-center mt-2">
        すでにアカウントをお持ちですか?{" "}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto align-baseline"
          onClick={() => openLogin()}
        >
          ログイン
        </Button>
      </p>
    </form>
  );
};

export default RegisterForm;
