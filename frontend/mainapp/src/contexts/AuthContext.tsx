// src/contexts/AuthContext.ts

import { createContext } from "react";
import { LoginCredentials, RegisterData } from "../types/auth";
import { User, UserProfileData, UserProfileRequest } from "../types/user";

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  // 引数: Partial<UserProfileRequest>、戻り値: Promise<UserProfileData>
  updateProfile: (
    data: Partial<UserProfileRequest>
  ) => Promise<UserProfileData>;
  openLogin: (redirectTo?: string) => void;
  openRegister: () => void;
  openPasswordReset: () => void;
  closeModals: () => void;
  showLogin: boolean;
  showRegister: boolean;
  showVerificationForm: boolean;
  showPasswordReset: boolean;
  pendingEmail: string | null;
  setUser: (user: User | null) => void;
  refreshAccessToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
