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

const isMonthKey = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

const numOr = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function parseItem(v: unknown, lastMonth: number): Item | null {
  if (!v || typeof v !== 'object') return null;
  const it = v as Record<string, unknown>;
  if (it.type !== 'income' && it.type !== 'expense') return null;
  const startMonth = Math.min(lastMonth, Math.max(0, Math.round(numOr(it.startMonth, 0))));
  return {
    id: typeof it.id === 'string' && it.id ? it.id : crypto.randomUUID(),
    name: typeof it.name === 'string' ? it.name : '',
    type: it.type,
    amount: numOr(it.amount, 0),
    apr: Math.max(0, numOr(it.apr, 0)),
    startMonth,
    endMonth: Math.min(lastMonth, Math.max(startMonth, Math.round(numOr(it.endMonth, startMonth)))),
  };
}

/**
 * Anything in — stored JSON, an imported file, null — a usable state out. Every
 * field is checked and falls back to a default rather than throwing, so a
 * truncated or hand-edited file cannot leave the app rendering NaN. v1 data,
 * where income `amount` was a per-month figure, is migrated on the way in.
 */
export function parseState(raw: unknown): AppState {
  const base = emptyState();
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const months = clampMonths(numOr(s.months, base.months));
  const items = (Array.isArray(s.items) ? s.items : [])
    .map((it) => parseItem(it, months - 1))
    .filter((it): it is Item => it !== null);

  return {
    balance: numOr(s.balance, base.balance),
    items:
      numOr(s.v, 1) >= 2
        ? items
        : items.map((it) =>
            it.type === 'income'
              ? { ...it, amount: it.amount * (it.endMonth - it.startMonth + 1) }
              : it,
          ),
    lang: s.lang === 'en' || s.lang === 'zh' ? s.lang : base.lang,
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : base.theme,
    startDate: isMonthKey(s.startDate) ? s.startDate : base.startDate,
    months,
    v: 2,
  };
}
