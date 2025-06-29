// src/utils/getErrorMessage.ts

import axios, { AxiosError } from "axios";

interface ErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  code?: string; // 追加: SimpleJWT などが返すコード
  [key: string]: string[] | string | undefined;
}

/**
 * AxiosError から「ユーザ向けのわかりやすいエラーメッセージ」を取り出すユーティリティ関数
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const responseData = axiosError.response?.data;
    if (responseData) {
      // --- token_not_valid のときは UI には非表示にする ---
      if (
        typeof responseData === "object" &&
        (responseData as { code?: string }).code === "token_not_valid"
      ) {
        console.log("token_not_valid が返ってきました:", responseData);
        return "";
      }

      if (typeof responseData === "object") {
        const fieldErrors = Object.entries(responseData)
          .filter(([key]) => key !== "detail" && key !== "non_field_errors")
          .map(([, messages]) => {
            if (Array.isArray(messages)) {
              return messages[0];
            }
            return messages;
          })
          .filter((msg): msg is string => typeof msg === "string");

        if (fieldErrors.length > 0) {
          return fieldErrors[0];
        }

        if (
          responseData.non_field_errors &&
          responseData.non_field_errors.length > 0
        ) {
          return responseData.non_field_errors[0];
        }
        if (responseData.detail) {
          return responseData.detail;
        }
      }
    }
  }
  return "エラーが発生しました。";
};
