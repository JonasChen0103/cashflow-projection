import type { Item, MonthProjection } from './types';
import { MONTHS } from './types';

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

/** "2026-09" → 12 個月標籤，依語言格式化 */
export function monthLabels(startDate: string, lang: 'zh' | 'en'): string[] {
  const [y, m] = startDate.split('-').map(Number);
  const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1);
    return lang === 'zh' ? `${d.getMonth() + 1}月` : en[d.getMonth()];
  });
}

/** "2026-09" → "2026/09 — 2027/08" / "Sep 2026 — Aug 2027" */
export function rangeLabel(startDate: string, lang: 'zh' | 'en'): string {
  const [y, m] = startDate.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m - 2 + MONTHS, 1);
  const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = (d: Date) =>
    lang === 'zh'
      ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
      : `${en[d.getMonth()]} ${d.getFullYear()}`;
  return `${fmt(from)} — ${fmt(to)}`;
}
