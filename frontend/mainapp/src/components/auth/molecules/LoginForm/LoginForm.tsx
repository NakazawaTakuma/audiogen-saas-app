import React, { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { LoginCredentials } from "../../../../types/auth";
import { Icon } from "@/utils/Icon";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Alert } from "@/components/shadcn-ui/alert";

const LoginForm: React.FC = () => {
  const [form, setForm] = useState<{ identifier: string; password: string }>({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, openRegister, openPasswordReset } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const isEmail = form.identifier.includes("@");
      const credentials: LoginCredentials = isEmail
        ? { email: form.identifier, password: form.password }
        : { username: form.identifier, password: form.password };

      await login(credentials);
    } catch (err) {
      console.log("[LoginForm] login error:", err);
      console.log("[LoginForm] location.href:", window.location.href);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" className="mb-2 break-words">
          {error}
        </Alert>
      )}

      <Input
        name="identifier"
        type="text"
        value={form.identifier}
        onChange={handleChange}
        placeholder="メールアドレスまたはユーザー名"
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
          aria-label={showPassword ? "隠す" : "表示する"}
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "ログイン中…" : "ログイン"}
      </Button>

      <div className="mt-2 flex flex-col gap-1 text-sm text-center">
        <p>
          アカウントをお持ちでないですか?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto align-baseline"
            onClick={openRegister}
          >
            新規登録
          </Button>
        </p>
        <p>
          パスワードをお忘れですか？{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto align-baseline"
            onClick={openPasswordReset}
          >
            パスワードリセット
          </Button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
