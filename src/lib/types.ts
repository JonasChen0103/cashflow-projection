export type ItemType = 'income' | 'expense';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  /** 支出：本金 / 總額；收入：每月金額 */
  amount: number;
  /** 總費用年百分率，僅支出使用，0 = 零利率 */
  apr: number;
  /** 0-based month index */
  startMonth: number;
  /** 0-based month index（含） */
  endMonth: number;
}

export interface MonthProjection {
  /** "2026-09" — 語言無關的月份 key，顯示時才格式化 */
  month: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
}

export type Lang = 'zh' | 'en';

export interface AppState {
  balance: number;
  items: Item[];
  lang: Lang;
  /** "2026-09" — 預測起始年月 */
  startDate: string;
  /** 預測期間長度（月） */
  months: number;
}

export const DEFAULT_MONTHS = 12;
export const MIN_MONTHS = 1;
/** 40 年；再長的預測沒有意義，也避免手滑打出十萬列表格 */
export const MAX_MONTHS = 480;

export const clampMonths = (n: number) =>
  Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.round(n) || DEFAULT_MONTHS));

export function emptyState(): AppState {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { balance: 0, items: [], lang: 'zh', startDate, months: DEFAULT_MONTHS };
}
