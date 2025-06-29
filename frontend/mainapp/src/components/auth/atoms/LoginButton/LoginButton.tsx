// src/components/LoginButton.tsx

import React from "react";
import { Icon } from "@/utils/Icon";
import { Button } from "@/components/shadcn-ui/button";
import { useAuth } from "../../../../hooks/useAuth";

const LoginButton: React.FC<{ className?: string }> = ({ className }) => {
  const { user, openLogin, logout } = useAuth();

  // 認証済み（user が null でない）なら「ログアウト」ボタン、
  // 未認証なら「ログイン」ボタンを表示
  if (user) {
    return (
      <Button onClick={logout} className={className} variant="outline">
        <Icon name="box-arrow-left" /> ログアウト
      </Button>
    );
  }

  return (
    <Button onClick={() => openLogin()} className={className}>
      <Icon name="box-arrow-in-right" /> ログイン
    </Button>
  );
};

export default LoginButton;
