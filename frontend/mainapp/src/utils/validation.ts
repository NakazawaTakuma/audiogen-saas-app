// src/utils/validation.ts

// ─────────────────────────────────────────────────────────────────────────────
// ユーザー名バリデーション用 正規表現・関数
//
// ルール：
//  - 半角英数字 (A–Z, a–z, 0–9)、ドット (.)、アンダースコア (_)、ハイフン (-) のみ
//  - 先頭・末尾は必ず英数字
//  - .、_、- が連続して並ぶのは禁止
//  - 文字数 3～20 文字
//  - 日本語（全角）禁止（ASCII のみ）
// ─────────────────────────────────────────────────────────────────────────────

// 許可する記号一覧
export const ALLOWED_SYMBOLS = "._-";

/**
 * ユーザー名バリデーション
 * @param username - チェック対象のユーザー名
 * @returns エラーメッセージ文字列。問題なければ null を返す。
 */
export const validateUsername = (username: string): string | null => {
  // 1) 長さチェック
  const length = username.length;
  if (length < 3 || length > 20) {
    return `ユーザー名は 3～20 文字で入力してください。現在の長さ: ${length}`;
  }

  // 2) 全角文字禁止チェック（ASCII 印字可能文字のみ許可）
  for (const ch of username) {
    if (ch.charCodeAt(0) > 0x7f) {
      return "ユーザー名に全角文字や非 ASCII 文字を含めることはできません。";
    }
  }

  // 3) 許可文字チェック：半角英数字と . _ - のみ
  for (const ch of username) {
    if (!new RegExp(`^[A-Za-z0-9${ALLOWED_SYMBOLS}]$`).test(ch)) {
      return "ユーザー名には半角英数字と「._-」のみ使用できます。";
    }
  }

  // 4) 先頭・末尾チェック：先頭・末尾は必ず英数字
  if (!/^[A-Za-z0-9].*[A-Za-z0-9]$/.test(username)) {
    return "ユーザー名の先頭および末尾は英数字である必要があります。";
  }

  // 5) 連続禁止チェック： .,_,- が連続して並ぶのは禁止
  if (/[._-]{2,}/.test(username)) {
    return "ユーザー名内で「.」「_」「-」を連続して並べることはできません。";
  }

  return null; // すべてのチェックを通過すれば問題なし
};

// ─────────────────────────────────────────────────────────────────────────────
// パスワード強度検証用 関数
//
// ルール：
//  - 文字数 8～64 文字
//  - 全角文字禁止 ⇒ 半角印字可能 ASCII (!–~) のみ
//  - 空白文字禁止
//  - 半角英大文字 ([A-Z])、半角英小文字 ([a-z])、数字 (\d)、半角記号 のうち、少なくとも 2 種類以上を含む
// ─────────────────────────────────────────────────────────────────────────────

/**
 * パスワード強度チェック
 * @param password - チェック対象のパスワード
 * @returns エラーメッセージ文字列。問題なければ null を返す。
 */
export const validatePasswordStrength = (password: string): string | null => {
  // 1) 長さチェック
  if (password.length < 8) {
    return "パスワードが短すぎます。最低8文字以上必要です。";
  }
  if (password.length > 64) {
    return "パスワードは最大64文字までです。";
  }

  // 2) 空白文字禁止チェック
  if (/\s/.test(password)) {
    return "パスワードに空白を含めることはできません。";
  }

  // 3) 全角文字禁止チェック（\x21–\x7E の範囲のみ許可）
  if (!/^[\x21-\x7E]+$/.test(password)) {
    return "パスワードは全角文字を含まず、半角英数字および記号のみで入力してください。";
  }

  // 4) カテゴリチェック（英大文字・英小文字・数字・記号 のうち 2 種類以上）
  let categories = 0;
  if (/[A-Z]/.test(password)) categories++;
  if (/[a-z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[!-/:-@[-`{-~]/.test(password)) categories++;

  if (categories < 2) {
    return "パスワードは半角英大文字・半角英小文字・数字・半角記号の中から、少なくとも2種類以上を含めてください。";
  }

  return null;
};
