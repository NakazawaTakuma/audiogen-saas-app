// ------------------------------------------
// src/components/auth/AuthModal.tsx
// ------------------------------------------
import React from "react";
import { useAuth } from "../../../../hooks/useAuth";
import LoginForm from "../../molecules/LoginForm/LoginForm";
import RegisterForm from "../../molecules/RegisterForm/RegisterForm";
import EmailVerificationForm from "../../molecules/EmailVerificationForm/EmailVerificationForm";
import PasswordResetForm from "../../molecules/PasswordResetForm/PasswordResetForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/shadcn-ui/dialog";

const AuthModal: React.FC = () => {
  const {
    showLogin,
    showRegister,
    showVerificationForm,
    showPasswordReset,
    closeModals,
  } = useAuth();

  const isOpen =
    showLogin || showRegister || showVerificationForm || showPasswordReset;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModals()}>
      <DialogContent className="max-w-md p-3" aria-describedby={undefined}>
        <DialogTitle className="text-xl font-bold mb-2 text-center">
          {showLogin && "ログイン"}
          {showRegister && "新規登録"}
          {showVerificationForm && "メール認証"}
          {showPasswordReset && "パスワードリセット"}
        </DialogTitle>
        {showLogin && <LoginForm />}
        {showRegister && <RegisterForm />}
        {showVerificationForm && <EmailVerificationForm />}
        {showPasswordReset && <PasswordResetForm />}
      </DialogContent>
    </Dialog>
  );
};
export default AuthModal;
