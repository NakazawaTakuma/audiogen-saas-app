import axios from "axios";
import { User, UserProfileData, UserProfileRequest } from "../types/user";

export const fetchMeApi = () => axios.get<User>("/api/users/me/");
// ── プロフィール関連 ──

// GET: 認証済みユーザーのプロフィール取得
export const fetchUserProfileApi = () =>
  axios.get<UserProfileData>("/api/users/profile/");

// PATCH: 認証済みユーザーのプロフィール更新

export const updateUserProfileApi = (data: UserProfileRequest) => {
  const formData = new FormData();
  formData.append("display_name", data.display_name);
  formData.append("bio", data.bio);

  if (data.profile_image instanceof File) {
    // 新規に選択したファイルがある場合
    formData.append("profile_image", data.profile_image);
  } else if (data.profile_image === null) {
    // クリアして DB 上も削除したいときは 空文字列を送る
    formData.append("profile_image", "");
  }

  // もし `data.profile_image` が undefined のまま（変更しない場合）は
  // formData に何も追加しない → バックエンド側にキー自体が届かない

  return axios.patch<UserProfileData>("/api/users/profile/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ── slug からユーザープロフィール取得 ──
export const fetchUserProfileBySlugApi = (slug: string) =>
  axios.get<UserProfileData>(`/api/users/profile/${slug}/`);

// ── slug からユーザープロフィール更新 ──
// export const updateUserProfileBySlugApi = (
//   slug: string,
//   data: UserProfileRequest
// ) => {
//   const formData = new FormData();
//   formData.append("display_name", data.display_name);
//   formData.append("bio", data.bio);

//   if (data.profile_image instanceof File) {
//     // 新規に選択したファイルがある場合
//     formData.append("profile_image", data.profile_image);
//   } else if (data.profile_image === null) {
//     // クリアして DB 上も削除したいときは 空文字列を送る
//     formData.append("profile_image", "");
//   }

//   return axios.patch<UserProfileData>(`/api/users/profile/${slug}/`, formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//   });
// };
