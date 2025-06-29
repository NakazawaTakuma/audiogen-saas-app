// src/contexts/AuthProvider.tsx

import { useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { loginApi, registerApi, refreshToken } from "../services/authService";
import { fetchMeApi, updateUserProfileApi } from "../services/userService";
import { LoginCredentials, RegisterData } from "../types/auth";
import { User, UserProfileData, UserProfileRequest } from "../types/user";
import { useNavigate } from "react-router-dom";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const navigate = useNavigate();
  // 追加：登録直後、メール確認待機用に使う email
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] =
    useState<boolean>(false);

  // 既存：ログイン用モーダル・登録用モーダルの表示フラグ
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (token && refresh) {
      setAccessToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      (async () => {
        try {
          const res = await fetchMeApi();
          setUser(res.data);
        } catch (error) {
          // 401エラーの場合、リフレッシュトークンで再試行
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const { access, refresh: newRefresh } = await refreshToken();
              localStorage.setItem("accessToken", access);
              localStorage.setItem("refreshToken", newRefresh);
              setAccessToken(access);
              axios.defaults.headers.common["Authorization"] =
                `Bearer ${access}`;
              const res = await fetchMeApi();
              setUser(res.data);
              return;
            } catch (refreshError) {
              console.error("トークンリフレッシュ失敗:", refreshError);
              handleLogout();
            }
          } else {
            console.error("ユーザー情報取得エラー:", error);
            handleLogout();
          }
        }
      })();
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete axios.defaults.headers.common["Authorization"];
    // ログアウト後はホームページにリダイレクト
    window.location.href = "/";
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await loginApi(credentials);
    const { access, refresh } = response.data;
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    setAccessToken(access);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    const userResponse = await fetchMeApi();
    setUser(userResponse.data);
    // ログインが成功したらモーダルを閉じる
    console.log("[AuthProvider] login success, calling closeModals");
    closeModals();
    // ログイン後は元いたページにリダイレクト
    // if (redirectPath) {
    //   window.location.href = redirectPath;
    //   setRedirectPath(null);
    // } else {
    //   window.location.href = "/";
    // }
    // クライアントサイド遷移に置き換え
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      setRedirectPath(null);
    } else {
      navigate("/", { replace: true });
    }
  };

  const register = async (data: RegisterData) => {
    // 1) 新規登録 API を実行（is_active=False でユーザー生成し、確認メールを送信）
    await registerApi(data);

    // 2) フロントの状態を「確認待ちフォーム表示」に切り替え
    setPendingEmail(data.email);
    setShowVerificationForm(true);
    setShowRegister(false);
    setShowLogin(false);
  };

  // ── プロフィール更新用メソッド ──
  const updateProfile = async (
    profileData: Partial<UserProfileRequest>
  ): Promise<UserProfileData> => {
    if (!accessToken) throw new Error("認証されていません。");
    if (!user) throw new Error("User not set");

    // FormData を作って送る
    const res = await updateUserProfileApi(profileData as UserProfileRequest);

    // サーバー返却の UserProfileData を、context 内の user にマージ
    setUser({
      ...user,
      display_name: res.data.display_name,
      profile_image: res.data.profile_image,
      bio: res.data.bio,
    });

    return res.data;
  };
  const openLogin = (redirectTo?: string) => {
    console.log("[AuthProvider] openLogin called");
    setShowLogin(true);
    setShowRegister(false);
    setShowPasswordReset(false);
    setShowVerificationForm(false);
    if (redirectTo) setRedirectPath(redirectTo);
  };
  const openRegister = () => {
    console.log("[AuthProvider] openRegister called");
    setShowRegister(true);
    setShowLogin(false);
    setShowPasswordReset(false);
    setShowVerificationForm(false);
  };
  const openPasswordReset = () => {
    console.log("[AuthProvider] openPasswordReset called");
    setShowPasswordReset(true);
    setShowLogin(false);
    setShowRegister(false);
    setShowVerificationForm(false);
  };
  const closeModals = () => {
    console.log("[AuthProvider] closeModals called");
    setShowLogin(false);
    setShowRegister(false);
    setShowPasswordReset(false);
    setShowVerificationForm(false);
  };

  // トークンリフレッシュ用の関数を追加
  const refreshAccessToken = async () => {
    try {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) {
        throw new Error("リフレッシュトークンがありません");
      }
      
      const { access, refresh: newRefresh } = await refreshToken();
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", newRefresh);
      setAccessToken(access);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      return access;
    } catch (error) {
      console.error("トークンリフレッシュ失敗:", error);
      handleLogout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        register,
        logout: handleLogout,
        updateProfile,
        openLogin,
        openRegister,
        openPasswordReset,
        closeModals,
        showLogin,
        showRegister,
        showPasswordReset,
        pendingEmail,
        showVerificationForm,
        setUser,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
