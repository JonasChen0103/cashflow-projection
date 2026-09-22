import assert from 'node:assert/strict';
import {
  buildProjection,
  calcMonthly,
  chartTicks,
  fmtMonth,
  fmtMonthYear,
  monthKeys,
  rangeLabel,
  summarize,
} from './calc.ts';
import { clampMonths } from './types.ts';
import type { Item } from './types.ts';

// 零利率：本金平均攤
assert.equal(calcMonthly(12000, 0, 12), 1000);
assert.equal(calcMonthly(1000, 5, 0), 0);

// 有利率：月繳 > 本金/期數，且總付款 = 本金 + 利息
const pmt = calcMonthly(100000, 12, 12);
assert.ok(pmt > 100000 / 12);
assert.ok(Math.abs(pmt - 8884.88) < 0.01, `pmt=${pmt}`);

// 走勢：收入 3 個月、支出 12 期零利率
const items: Item[] = [
  { id: 'a', name: 'salary', type: 'income', amount: 50000, apr: 0, startMonth: 0, endMonth: 2 },
  { id: 'b', name: 'phone', type: 'expense', amount: 24000, apr: 0, startMonth: 0, endMonth: 11 },
];
const p = buildProjection(10000, items, monthKeys('2026-09', 12));
assert.equal(p.length, 12);
assert.equal(p[0].income, 50000);
assert.equal(p[0].expense, 2000);
assert.equal(p[0].balance, 58000);
assert.equal(p[3].income, 0); // 收入已結束
assert.equal(p[11].balance, 10000 + 50000 * 3 - 24000);

// month key 跨年遞增，且與語言無關
const k36 = monthKeys('2026-09', 36);
assert.equal(k36.length, 36);
assert.deepEqual(k36.slice(0, 5), ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01']);
assert.equal(k36[35], '2029-08');
assert.equal(monthKeys('2026-09', 1).length, 1);

// 顯示格式
assert.equal(fmtMonth('2026-09', 'zh'), '9月');
assert.equal(fmtMonth('2026-09', 'en'), 'Sep');
assert.equal(fmtMonthYear('2026-09', 'zh'), '2026/09');
assert.equal(fmtMonthYear('2026-09', 'en'), 'Sep 2026');
assert.equal(rangeLabel(monthKeys('2026-09', 12), 'en'), 'Sep 2026 — Aug 2027');
assert.equal(rangeLabel(monthKeys('2026-09', 12), 'zh'), '2026/09 — 2027/08');
assert.equal(rangeLabel(monthKeys('2026-09', 1), 'zh'), '2026/09 — 2026/09');
assert.equal(rangeLabel([], 'zh'), '');

// 期間內的走勢長度跟著 keys 走
assert.equal(buildProjection(0, items, monthKeys('2026-09', 24)).length, 24);

// X 軸刻度：12 個月不抽稀，長期間抽到 ~12 個，年份只在換年時標一次
const t12 = chartTicks(monthKeys('2026-09', 12));
assert.equal(t12.ticks.length, 12);
assert.deepEqual([...t12.yearTicks], ['2026-09', '2027-01']);

const keys60 = monthKeys('2026-09', 60);
const t60 = chartTicks(keys60);
assert.equal(t60.ticks.length, 12); // step 5
assert.ok(
  t60.ticks.every((k) => keys60.includes(k)),
  'ticks 必須是原始 keys 的子集',
);
// 年份標記數 = 刻度裡實際出現的年份數（不重複、不漏）
assert.equal(t60.yearTicks.size, new Set(t60.ticks.map((k) => k.slice(0, 4))).size);

const t1 = chartTicks(monthKeys('2026-09', 1));
assert.deepEqual(t1.ticks, ['2026-09']);
assert.deepEqual([...t1.yearTicks], ['2026-09']);

// 摘要
const s = summarize(buildProjection(10000, items, monthKeys('2026-09', 12)));
assert.equal(s.endBalance, 10000 + 50000 * 3 - 24000);
assert.equal(s.totalIncome, 150000);
assert.equal(s.totalExpense, 24000);
assert.equal(s.low.month, '2026-09'); // 第一個月就是最低點（之後只增不減）

// clampMonths 擋掉空值與超界
assert.equal(clampMonths(0), 12);
assert.equal(clampMonths(NaN), 12);
assert.equal(clampMonths(-5), 1);
assert.equal(clampMonths(9999), 480);
assert.equal(clampMonths(18.6), 19);

console.log('ok');
