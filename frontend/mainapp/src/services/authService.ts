import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  LoginCredentials,
  RegisterData,
  PasswordResetConfirmData,
} from "../types/auth";

// リフレッシュトークンの更新中かどうかのフラグ
let isRefreshing = false;
// リフレッシュトークン更新中のリクエストを保持する配列
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

// キュー内のリクエストを処理する関数
const processQueue = (
  error: unknown | null = null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// リフレッシュトークンで新しいアクセストークンを取得
export const refreshToken = async () => {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) throw new Error("No refresh token");

  const response = await axios.post<{ access: string; refresh: string }>(
    "/api/users/token/refresh/",
    { refresh }
  );
  return response.data;
};

// Axiosインターセプターの設定
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // ログインエンドポイントへの401エラーは、リフレッシュトークンを使わない
    if (
      error.response?.status === 401 &&
      originalRequest.url?.includes("/api/users/login/")
    ) {
      return Promise.reject(error); // そのままエラーを返す
    }

    // 401エラーで、かつリフレッシュ中でない場合（ログインエンドポイント以外）
    if (error.response?.status === 401 && !isRefreshing) {
      isRefreshing = true;

      try {
        const { access, refresh } = await refreshToken();
        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        originalRequest.headers["Authorization"] = `Bearer ${access}`;

        processQueue(null, access);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// export const loginApi = (data: LoginCredentials) => {
//   const url = "/api/users/login/";
//   console.log("Login APIリクエストURL:", url);
//   return axios.post<{ access: string; refresh: string }>(url, data);
// };

export const loginApi = async (credentials: LoginCredentials) => {
  try {
    return await axios.post("/api/users/login/", credentials);
  } catch (err: unknown) {
    let msg = "ログインに失敗しました";
    if (axios.isAxiosError(err)) {
      msg = err.response?.data?.error || msg;
    }
    throw new Error(msg);
  }
};

export const registerApi = (data: RegisterData) =>
  axios.post("/api/users/register/", {
    username: data.username,
    email: data.email,
    password: data.password,
    password_confirm: data.confirmPassword,
  });

// ── 以下、メール確認関連の API 新規追加 ──

// 再送信 API（未認証ユーザーに対して確認メールを再送信）
export const resendVerificationApi = (email: string) =>
  axios.post("/api/users/resend-verification/", { email });

// メール確認状況チェック API（is_active が true になったかを取得）
export const checkVerificationApi = (email: string) =>
  axios.get<{ verified: boolean }>(
    `/api/users/check-verification/?email=${encodeURIComponent(email)}`
  );

// ── パスワードリセット関連 API ──

// (1) パスワードリセットリクエスト（メール送信）API
export const requestPasswordReset = (email: string) =>
  axios.post("/api/users/password-reset/", { email });

// (2) パスワードリセット確定 API
export const confirmPasswordReset = (data: PasswordResetConfirmData) =>
  axios.post("/api/users/password-reset-confirm/", data);

export const passwordResetConfirmApi = (data: {
  uid: string;
  token: string;
  new_password: string;
  re_new_password: string;
}) =>
  axios.post<{ message: string }>("/api/users/password-reset-confirm/", data);
