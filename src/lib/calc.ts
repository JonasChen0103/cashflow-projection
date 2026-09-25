import { monthKey } from './types';
import type { Item, Lang, MonthProjection } from './types';

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Axis labels: millions and up go compact, so they cannot outgrow the axis width. */
export const fmtShort = (n: number) =>
  Math.abs(n) < 1e6
    ? fmt(n)
    : n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** Reads a numeric input: blank, junk and overflow (1e999 parses as Infinity) all mean 0. */
export const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Standard amortization (PMT); apr = 0 splits the principal evenly. */
export function calcMonthly(principal: number, apr: number, periods: number): number {
  if (periods <= 0) return 0;
  if (!apr) return principal / periods;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, periods)) / (Math.pow(1 + r, periods) - 1);
}

/** Inverse of calcMonthly. */
export function calcPrincipal(monthly: number, apr: number, periods: number): number {
  if (periods <= 0) return 0;
  if (!apr) return monthly * periods;
  const r = apr / 100 / 12;
  return (monthly * (1 - Math.pow(1 + r, -periods))) / r;
}

export const aprOf = (it: Item) => (it.type === 'income' ? 0 : it.apr);

export const monthlyOf = (it: Item): number =>
  calcMonthly(it.amount, aprOf(it), it.endMonth - it.startMonth + 1);

export const totalInterest = (it: Item): number =>
  monthlyOf(it) * (it.endMonth - it.startMonth + 1) - it.amount;

export function buildProjection(
  balance: number,
  items: Item[],
  keys: string[],
): MonthProjection[] {
  const monthly = items.map(monthlyOf);

  let running = balance;
  return keys.map((key, mi) => {
    let income = 0;
    let expense = 0;
    items.forEach((it, idx) => {
      if (mi < it.startMonth || mi > it.endMonth) return;
      if (it.type === 'income') income += monthly[idx];
      else expense += monthly[idx];
    });
    running += income - expense;
    return {
      month: key,
      income: Math.round(income),
      expense: Math.round(expense),
      balance: Math.round(running),
    };
  });
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthKeys(startDate: string, months: number): string[] {
  const [y, m] = startDate.split('-').map(Number);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1);
    return monthKey(d.getFullYear(), d.getMonth());
  });
}

/** b - a, may be negative. */
export function monthDiff(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

const parseKey = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return { y, mi: m - 1 };
};

/** "2026-09" -> "9月" / "Sep" */
export function fmtMonth(key: string, lang: Lang): string {
  return lang === 'zh' ? `${parseKey(key).mi + 1}月` : EN_MONTHS[parseKey(key).mi];
}

/** "2026-09" -> "2026/09" / "Sep 2026" */
export function fmtMonthYear(key: string, lang: Lang): string {
  const { y, mi } = parseKey(key);
  return lang === 'zh' ? `${y}/${String(mi + 1).padStart(2, '0')}` : `${EN_MONTHS[mi]} ${y}`;
}

export const rangeLabel = (keys: string[], lang: Lang): string =>
  keys.length ? `${fmtMonthYear(keys[0], lang)} — ${fmtMonthYear(keys[keys.length - 1], lang)}` : '';

/**
 * Drop `fromId` onto `toId` within its own type: dragging down lands after the
 * target, dragging up lands before it. The other type keeps its slots.
 */
export function reorder(items: Item[], fromId: string, toId: string): Item[] {
  const from = items.find((it) => it.id === fromId);
  const to = items.find((it) => it.id === toId);
  if (!from || !to || from === to || from.type !== to.type) return items;

  const seq = items.filter((it) => it.type === from.type);
  seq.splice(seq.indexOf(to), 0, ...seq.splice(seq.indexOf(from), 1));
  let i = 0;
  return items.map((it) => (it.type === from.type ? seq[i++] : it));
}

/**
 * Re-anchor items when the window start moves to `to`, so each one keeps the
 * calendar months it had. Items that ended before `to` are dropped.
 */
export function reanchor(items: Item[], from: string, to: string): Item[] {
  const shift = monthDiff(from, to);
  return items.flatMap((it) => {
    const endMonth = it.endMonth - shift;
    return endMonth < 0 ? [] : [{ ...it, startMonth: Math.max(0, it.startMonth - shift), endMonth }];
  });
}

/** Thin to ~12 x-axis ticks, flagging the ones that start a new year. */
export function chartTicks(keys: string[]): { ticks: string[]; yearTicks: Set<string> } {
  const step = Math.max(1, Math.ceil(keys.length / 12));
  const ticks = keys.filter((_, i) => i % step === 0);

  // The last month always gets a tick; drop the one before it if they would collide.
  const last = keys.length - 1;
  if (last > 0 && last % step) {
    if (last % step < step / 2) ticks.pop();
    ticks.push(keys[last]);
  }

  const yearTicks = new Set<string>();
  let prevYear = '';
  for (const k of ticks) {
    const y = k.slice(0, 4);
    if (y !== prevYear) yearTicks.add(k);
    prevYear = y;
  }
  return { ticks, yearTicks };
}

export function summarize(data: MonthProjection[]) {
  let low = data[0];
  let totalIncome = 0;
  let totalExpense = 0;
  for (const m of data) {
    if (m.balance < low.balance) low = m;
    totalIncome += m.income;
    totalExpense += m.expense;
  }
  return { endBalance: data[data.length - 1]?.balance ?? 0, low, totalIncome, totalExpense };
}
