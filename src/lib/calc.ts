import type { Item, MonthProjection } from './types';

/** 千分位顯示 */
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/**
 * 每月應繳金額
 * - apr = 0 → 本金 ÷ 期數
 * - apr > 0 → 標準攤還公式 (PMT)
 */
export function calcMonthly(principal: number, apr: number, periods: number): number {
  if (periods <= 0) return 0;
  if (!apr) return principal / periods;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, periods)) / (Math.pow(1 + r, periods) - 1);
}

/** 該筆項目的每月金額（收入直接用 amount，支出走攤還） */
export function monthlyOf(it: Item): number {
  if (it.type === 'income') return it.amount;
  return calcMonthly(it.amount, it.apr, it.endMonth - it.startMonth + 1);
}

/** 分期總利息 */
export function totalInterest(it: Item): number {
  const periods = it.endMonth - it.startMonth + 1;
  return monthlyOf(it) * periods - it.amount;
}

/** 期初餘額 + items → 逐月走勢（長度等於 keys） */
export function buildProjection(
  balance: number,
  items: Item[],
  keys: string[],
): MonthProjection[] {
  const monthlyAmounts = items.map(monthlyOf);

  let running = balance;
  return keys.map((key, mi) => {
    let income = 0;
    let expense = 0;
    items.forEach((it, idx) => {
      if (mi >= it.startMonth && mi <= it.endMonth) {
        if (it.type === 'income') income += monthlyAmounts[idx];
        else expense += monthlyAmounts[idx];
      }
    });
    running += income - expense;
    return {
      month: key,
      income: Math.round(income),
      expense: Math.round(expense),
      net: Math.round(income - expense),
      balance: Math.round(running),
    };
  });
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "2026-09" + n → 逐月的 key，例如 ["2026-09", "2026-10", …]
 * key 是語言無關的識別字，顯示交給下面的 fmt* 函式。
 */
export function monthKeys(startDate: string, months: number): string[] {
  const [y, m] = startDate.split('-').map(Number);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

const parseKey = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return { y, mi: m - 1 };
};

/** "2026-09" → "9月" / "Sep" */
export function fmtMonth(key: string, lang: 'zh' | 'en'): string {
  const { mi } = parseKey(key);
  return lang === 'zh' ? `${mi + 1}月` : EN_MONTHS[mi];
}

/** "2026-09" → "2026/09" / "Sep 2026" */
export function fmtMonthYear(key: string, lang: 'zh' | 'en'): string {
  const { y, mi } = parseKey(key);
  return lang === 'zh'
    ? `${y}/${String(mi + 1).padStart(2, '0')}`
    : `${EN_MONTHS[mi]} ${y}`;
}

export const rangeLabel = (keys: string[], lang: 'zh' | 'en'): string =>
  keys.length ? `${fmtMonthYear(keys[0], lang)} — ${fmtMonthYear(keys[keys.length - 1], lang)}` : '';

/**
 * 挑出 X 軸要標的月份：抽稀到最多 ~12 個刻度，並標記哪些刻度要另外顯示年份
 * （每當年份跟前一個顯示的刻度不同時）。
 */
export function chartTicks(keys: string[]): { ticks: string[]; yearTicks: Set<string> } {
  const step = Math.max(1, Math.ceil(keys.length / 12));
  const ticks = keys.filter((_, i) => i % step === 0);

  const yearTicks = new Set<string>();
  let prevYear = '';
  for (const k of ticks) {
    const y = k.slice(0, 4);
    if (y !== prevYear) yearTicks.add(k);
    prevYear = y;
  }
  return { ticks, yearTicks };
}

/** 摘要數字：期末、最低點、期間總收支 */
export function summarize(data: MonthProjection[]) {
  const low = data.reduce((a, b) => (b.balance < a.balance ? b : a), data[0]);
  return {
    endBalance: data[data.length - 1]?.balance ?? 0,
    low,
    totalIncome: data.reduce((s, m) => s + m.income, 0),
    totalExpense: data.reduce((s, m) => s + m.expense, 0),
  };
}
