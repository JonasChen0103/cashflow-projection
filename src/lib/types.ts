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
  /** Resizing the range holds the monthly figure instead of the total. */
  lockMonthly?: boolean;
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
export const MAX_MONTHS = 600;

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

/**
 * Caps for imported files. A genuine export is a few KB holding a few dozen
 * items, so these only ever bite on a file meant to break the app: 200k items
 * parse fine but cost ~0.7s per projection, which recomputes on every render.
 */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_ITEMS = 1000;

/** Past these, the amortization formula overflows to Infinity and divides into NaN. */
const MAX_AMOUNT = 1e12;
const MAX_APR = 1000;
const MAX_NAME = 200;

const isMonthKey = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const numOr = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function parseItem(v: unknown, lastMonth: number): Item | null {
  if (!v || typeof v !== 'object') return null;
  const it = v as Record<string, unknown>;
  if (it.type !== 'income' && it.type !== 'expense') return null;
  const startMonth = clamp(Math.round(numOr(it.startMonth, 0)), 0, lastMonth);
  return {
    id: typeof it.id === 'string' && it.id ? it.id.slice(0, MAX_NAME) : crypto.randomUUID(),
    name: typeof it.name === 'string' ? it.name.slice(0, MAX_NAME) : '',
    type: it.type,
    amount: clamp(numOr(it.amount, 0), -MAX_AMOUNT, MAX_AMOUNT),
    apr: clamp(numOr(it.apr, 0), 0, MAX_APR),
    startMonth,
    endMonth: clamp(Math.round(numOr(it.endMonth, startMonth)), startMonth, lastMonth),
    lockMonthly: it.lockMonthly === true,
  };
}

/**
 * Anything in — stored JSON, an imported file, null — a usable state out. Every
 * field is checked and falls back to a default or a clamp rather than throwing,
 * so a truncated or hand-edited file cannot leave the app rendering NaN. Keys
 * are read individually and the result is a fresh literal, so a `__proto__` in
 * the input is inert. v1 data, where income `amount` was a per-month figure, is
 * migrated on the way in.
 *
 * Total by design: the stored-state path must never throw, or a bad read would
 * silently reset someone's data. Size limits belong to the import caller.
 */
export function parseState(raw: unknown): AppState {
  const base = emptyState();
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const months = clampMonths(numOr(s.months, base.months));
  const items = (Array.isArray(s.items) ? s.items : [])
    // Bounded by the cap, not by `months`: the window can shrink and grow back.
    .map((it) => parseItem(it, MAX_MONTHS - 1))
    .filter((it): it is Item => it !== null);

  return {
    balance: clamp(numOr(s.balance, base.balance), -MAX_AMOUNT, MAX_AMOUNT),
    items:
      numOr(s.v, 1) >= 2
        ? items
        : items.map((it) =>
            it.type === 'income'
              ? {
                  ...it,
                  amount: clamp(
                    it.amount * (it.endMonth - it.startMonth + 1),
                    -MAX_AMOUNT,
                    MAX_AMOUNT,
                  ),
                }
              : it,
          ),
    lang: s.lang === 'en' || s.lang === 'zh' ? s.lang : base.lang,
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : base.theme,
    startDate: isMonthKey(s.startDate) ? s.startDate : base.startDate,
    months,
    v: 2,
  };
}
