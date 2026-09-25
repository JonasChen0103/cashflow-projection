export type ItemType = 'income' | 'expense';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  /** Total over the whole range, income and expense alike; the monthly figure is derived. */
  amount: number;
  /** Annual percentage rate, expenses only. */
  apr: number;
  startMonth: number;
  /** 0-based, inclusive. */
  endMonth: number;
}

export interface MonthProjection {
  /** "2026-09" */
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export type Lang = 'zh' | 'en';
export type Theme = 'dark' | 'light';

export interface AppState {
  balance: number;
  items: Item[];
  lang: Lang;
  theme: Theme;
  startDate: string;
  months: number;
  /** Schema version; v2 stores income `amount` as a total. */
  v?: number;
}

export const DEFAULT_MONTHS = 12;
export const MIN_MONTHS = 1;
export const MAX_MONTHS = 480;

export const clampMonths = (n: number) =>
  Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.round(n) || DEFAULT_MONTHS));

/** (2026, 8) -> "2026-09". Zero-padded, so string comparison orders by time. */
export const monthKey = (y: number, mi: number) => `${y}-${String(mi + 1).padStart(2, '0')}`;

export const thisMonth = () => {
  const now = new Date();
  return monthKey(now.getFullYear(), now.getMonth());
};

export function emptyState(): AppState {
  return {
    balance: 0,
    items: [],
    lang: 'zh',
    theme: 'dark',
    startDate: thisMonth(),
    months: DEFAULT_MONTHS,
    v: 2,
  };
}
