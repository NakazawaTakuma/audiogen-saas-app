// utils/formatCount.ts
export function formatCount(num: number): string {
  // ＜ 1万 はそのまま
  if (num < 10_000) {
    return num.toString();
  }
  // 1万以上1億未満 → 万
  if (num < 100_000_000) {
    // 10 000 で割って、小数点第一位で切り捨て
    const truncated = Math.floor((num / 10_000) * 10) / 10;
    return `${truncated}万`;
  }
  // 1億以上 → 億
  const truncated = Math.floor((num / 100_000_000) * 10) / 10;
  return `${truncated}億`;
}
