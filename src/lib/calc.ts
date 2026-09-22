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

/** 期初餘額 + items → 12 個月走勢 */
export function buildProjection(
  balance: number,
  items: Item[],
  monthLabels: string[],
): MonthProjection[] {
  const monthlyAmounts = items.map(monthlyOf);

  let running = balance;
  return monthLabels.map((label, mi) => {
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
      month: label,
      income: Math.round(income),
      expense: Math.round(expense),
      net: Math.round(income - expense),
      balance: Math.round(running),
    };
  });
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "2026-09" → n 個月標籤，依語言格式化。
 * 超過一年時帶上西元年後兩碼，否則同月份名稱會重複而分不出年。
 */
export function monthLabels(startDate: string, lang: 'zh' | 'en', months: number): string[] {
  const [y, m] = startDate.split('-').map(Number);
  const withYear = months > 12;
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1);
    const yy = String(d.getFullYear()).slice(-2);
    if (lang === 'zh') {
      return withYear ? `${yy}/${String(d.getMonth() + 1).padStart(2, '0')}` : `${d.getMonth() + 1}月`;
    }
    return withYear ? `${EN_MONTHS[d.getMonth()]} ${yy}` : EN_MONTHS[d.getMonth()];
  });
}

/** "2026-09" + 12 → "2026/09 — 2027/08" / "Sep 2026 — Aug 2027" */
export function rangeLabel(startDate: string, lang: 'zh' | 'en', months: number): string {
  const [y, m] = startDate.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m - 2 + months, 1);
  const en = EN_MONTHS;
  const fmt = (d: Date) =>
    lang === 'zh'
      ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
      : `${en[d.getMonth()]} ${d.getFullYear()}`;
  return `${fmt(from)} — ${fmt(to)}`;
}
