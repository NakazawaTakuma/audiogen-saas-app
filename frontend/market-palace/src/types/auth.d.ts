// ------------------------------------------
// src/types/auth.ts
// ------------------------------------------

/** ログイン時は email か username のどちらか一方を指定 */
export type LoginCredentials =
  | { email: string; password: string; username?: never }
  | { username: string; password: string; email?: never };

/** 新規登録フォームで送信するデータ */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetConfirmData {
  uid: string;
  token: string;
  new_password: string;
  re_new_password: string;
}
