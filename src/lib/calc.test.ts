import assert from 'node:assert/strict';
import { calcMonthly, buildProjection, monthLabels, rangeLabel } from './calc.ts';
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
const p = buildProjection(10000, items, monthLabels('2026-09', 'en', 12));
assert.equal(p.length, 12);
assert.equal(p[0].income, 50000);
assert.equal(p[0].expense, 2000);
assert.equal(p[0].balance, 58000);
assert.equal(p[3].income, 0); // 收入已結束
assert.equal(p[11].balance, 10000 + 50000 * 3 - 24000);

// 標籤與區間跨年
assert.deepEqual(monthLabels('2026-09', 'en', 12).slice(0, 5), ['Sep', 'Oct', 'Nov', 'Dec', 'Jan']);
assert.equal(monthLabels('2026-09', 'zh', 12)[0], '9月');
assert.equal(rangeLabel('2026-09', 'en', 12), 'Sep 2026 — Aug 2027');
assert.equal(rangeLabel('2026-09', 'zh', 12), '2026/09 — 2027/08');

// 自訂期間：長度、跨年標籤帶年份、短期間
const l36 = monthLabels('2026-09', 'zh', 36);
assert.equal(l36.length, 36);
assert.equal(l36[0], '26/09');
assert.equal(l36[35], '29/08');
assert.equal(monthLabels('2026-09', 'en', 36)[12], 'Sep 27');
assert.equal(rangeLabel('2026-09', 'en', 36), 'Sep 2026 — Aug 2029');
assert.equal(rangeLabel('2026-09', 'zh', 1), '2026/09 — 2026/09');
assert.equal(monthLabels('2026-09', 'en', 1).length, 1);

// 期間內的走勢長度跟著標籤走
assert.equal(buildProjection(0, items, monthLabels('2026-09', 'en', 24)).length, 24);

// clampMonths 擋掉空值與超界
assert.equal(clampMonths(0), 12);
assert.equal(clampMonths(NaN), 12);
assert.equal(clampMonths(-5), 1);
assert.equal(clampMonths(9999), 480);
assert.equal(clampMonths(18.6), 19);

console.log('ok');
