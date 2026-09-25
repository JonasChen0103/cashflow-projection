import assert from 'node:assert/strict';
import {
  buildProjection,
  calcMonthly,
  calcPrincipal,
  chartTicks,
  fmt,
  fmtMonth,
  fmtMonthYear,
  fmtShort,
  num,
  monthDiff,
  monthKeys,
  rangeLabel,
  monthlyOf,
  reanchor,
  reorder,
  summarize,
} from './calc.ts';
import { clampMonths, parseState } from './types.ts';
import type { Item } from './types.ts';

assert.equal(calcMonthly(12000, 0, 12), 1000);
assert.equal(calcMonthly(1000, 5, 0), 0);

// numeric input: junk and overflow collapse to 0
assert.equal(num(''), 0);
assert.equal(num('abc'), 0);
assert.equal(num('1e999'), 0);
assert.equal(num('-2500.5'), -2500.5);

// axis labels stay short once the numbers get long
assert.equal(fmtShort(999999), '999,999');
assert.equal(fmtShort(-999999), '-999,999');
assert.equal(fmtShort(1234567), '1.2M');
assert.equal(fmtShort(-98765432100), '-98.8B');
assert.equal(fmt(1234567), '1,234,567');

// With interest the payment exceeds principal / periods
const pmt = calcMonthly(100000, 12, 12);
assert.ok(pmt > 100000 / 12);
assert.ok(Math.abs(pmt - 8884.88) < 0.01, `pmt=${pmt}`);

const items: Item[] = [
  { id: 'a', name: 'salary', type: 'income', amount: 150000, apr: 0, startMonth: 0, endMonth: 2 },
  { id: 'b', name: 'phone', type: 'expense', amount: 24000, apr: 0, startMonth: 0, endMonth: 11 },
];
const p = buildProjection(10000, items, monthKeys('2026-09', 12));
assert.equal(p.length, 12);
assert.equal(p[0].income, 50000);
assert.equal(p[0].expense, 2000);
assert.equal(p[0].balance, 58000);
assert.equal(p[3].income, 0);
assert.equal(p[11].balance, 10000 + 50000 * 3 - 24000);

// calcPrincipal inverts calcMonthly
assert.equal(calcPrincipal(1000, 0, 12), 12000);
assert.ok(Math.abs(calcPrincipal(pmt, 12, 12) - 100000) < 0.01);
assert.equal(calcPrincipal(500, 5, 0), 0);
for (const [amt, apr, n] of [[36000, 0, 6], [250000, 3.75, 24], [7, 18, 3]] as const) {
  const it: Item = { id: 'x', name: '', type: 'expense', amount: amt, apr, startMonth: 0, endMonth: n - 1 };
  assert.ok(Math.abs(calcPrincipal(monthlyOf(it), apr, n) - amt) < 1e-6, `roundtrip ${amt}/${apr}/${n}`);
}

// One-time item: same start and end month, hits that month only
const once: Item[] = [
  { id: 'c', name: 'scholarship', type: 'income', amount: 30000, apr: 0, startMonth: 11, endMonth: 11 },
];
assert.equal(monthlyOf(once[0]), 30000);
const po = buildProjection(0, once, monthKeys('2026-09', 12));
assert.equal(po[10].income, 0);
assert.equal(po[11].income, 30000);
assert.equal(po[11].balance, 30000);

const k36 = monthKeys('2026-09', 36);
assert.equal(k36.length, 36);
assert.deepEqual(k36.slice(0, 5), ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01']);
assert.equal(k36[35], '2029-08');
assert.equal(monthKeys('2026-09', 1).length, 1);

assert.equal(monthDiff('2026-09', '2027-09'), 12);
assert.equal(monthDiff('2026-09', '2026-09'), 0);
assert.equal(monthDiff('2026-09', '2026-12'), 3);
assert.equal(monthDiff('2027-01', '2026-09'), -4);
// diff from first to last key, + 1, is the period count
for (const n of [1, 7, 12, 120]) {
  const ks = monthKeys('2026-09', n);
  assert.equal(monthDiff(ks[0], ks[n - 1]) + 1, n);
}

assert.equal(fmtMonth('2026-09', 'zh'), '9月');
assert.equal(fmtMonth('2026-09', 'en'), 'Sep');
assert.equal(fmtMonthYear('2026-09', 'zh'), '2026/09');
assert.equal(fmtMonthYear('2026-09', 'en'), 'Sep 2026');
assert.equal(rangeLabel(monthKeys('2026-09', 12), 'en'), 'Sep 2026 — Aug 2027');
assert.equal(rangeLabel(monthKeys('2026-09', 12), 'zh'), '2026/09 — 2027/08');
assert.equal(rangeLabel(monthKeys('2026-09', 1), 'zh'), '2026/09 — 2026/09');
assert.equal(rangeLabel([], 'zh'), '');

assert.equal(buildProjection(0, items, monthKeys('2026-09', 24)).length, 24);

// reorder: drag down lands after the target, drag up lands before it,
// and the other type keeps its slots in the array
const mixed: Item[] = ['e1', 'i1', 'e2', 'e3'].map((id) => ({
  id,
  name: id,
  type: id[0] === 'e' ? 'expense' : 'income',
  amount: 0,
  apr: 0,
  startMonth: 0,
  endMonth: 0,
}));
const ids = (list: Item[]) => list.map((it) => it.id);
assert.deepEqual(ids(reorder(mixed, 'e1', 'e3')), ['e2', 'i1', 'e3', 'e1']);
assert.deepEqual(ids(reorder(mixed, 'e3', 'e1')), ['e3', 'i1', 'e1', 'e2']);
assert.deepEqual(ids(reorder(mixed, 'e1', 'e1')), ['e1', 'i1', 'e2', 'e3']);
assert.deepEqual(ids(reorder(mixed, 'e1', 'i1')), ['e1', 'i1', 'e2', 'e3']);
assert.deepEqual(ids(reorder(mixed, 'e1', 'nope')), ['e1', 'i1', 'e2', 'e3']);
assert.deepEqual(ids(mixed), ['e1', 'i1', 'e2', 'e3']);

// reanchor: items keep their calendar months, past ones drop out
const shifted = reanchor(
  [
    { id: 'a', name: 'past', type: 'expense', amount: 1, apr: 0, startMonth: 0, endMonth: 1 },
    { id: 'b', name: 'spans', type: 'expense', amount: 1, apr: 0, startMonth: 1, endMonth: 5 },
    { id: 'c', name: 'future', type: 'income', amount: 1, apr: 0, startMonth: 4, endMonth: 6 },
  ],
  '2026-01',
  '2026-04',
);
assert.deepEqual(
  shifted.map((it) => [it.id, it.startMonth, it.endMonth]),
  [
    ['b', 0, 2],
    ['c', 1, 3],
  ],
);
assert.deepEqual(reanchor([], '2026-01', '2026-01'), []);

// x-axis ticks thin to ~12 over long windows
const t12 = chartTicks(monthKeys('2026-09', 12));
assert.equal(t12.ticks.length, 12);
assert.deepEqual([...t12.yearTicks], ['2026-09', '2027-01']);

const keys60 = monthKeys('2026-09', 60);
const t60 = chartTicks(keys60);
assert.equal(t60.ticks.length, 13);
assert.ok(
  t60.ticks.every((k) => keys60.includes(k)),
  'ticks must be a subset of keys',
);
// one year label per distinct year among the ticks
assert.equal(t60.yearTicks.size, new Set(t60.ticks.map((k) => k.slice(0, 4))).size);

// the last month is always labelled, even when the step does not land on it
assert.equal(t60.ticks[t60.ticks.length - 1], keys60[59]);
const t26 = chartTicks(monthKeys('2026-09', 26));
assert.equal(t26.ticks[t26.ticks.length - 1], '2028-10');
assert.equal(t26.ticks[t26.ticks.length - 2], '2028-06');

const t1 = chartTicks(monthKeys('2026-09', 1));
assert.deepEqual(t1.ticks, ['2026-09']);
assert.deepEqual([...t1.yearTicks], ['2026-09']);

const s = summarize(buildProjection(10000, items, monthKeys('2026-09', 12)));
assert.equal(s.endBalance, 10000 + 50000 * 3 - 24000);
assert.equal(s.totalIncome, 150000);
assert.equal(s.totalExpense, 24000);
assert.equal(s.low.month, '2026-09');

assert.equal(clampMonths(0), 12);
assert.equal(clampMonths(NaN), 12);
assert.equal(clampMonths(-5), 1);
assert.equal(clampMonths(9999), 600);
assert.equal(clampMonths(18.6), 19);

// parseState: anything in, a usable state out — never a throw, never a NaN
for (const junk of [null, undefined, 'nonsense', 42, [], { items: 'not-an-array' }]) {
  const st = parseState(junk);
  assert.equal(st.months, 12, `months for ${JSON.stringify(junk)}`);
  assert.deepEqual(st.items, []);
  assert.equal(st.balance, 0);
}

const junked = parseState({
  balance: 'x',
  months: 9999,
  lang: 'fr',
  theme: 'neon',
  startDate: '2026-13',
  items: [null, 'nope', { type: 'mystery' }, { type: 'expense', amount: 'NaN' }],
});
assert.equal(junked.balance, 0);
assert.equal(junked.months, 600);
assert.equal(junked.lang, 'zh');
assert.equal(junked.theme, 'dark');
assert.ok(/^\d{4}-(0[1-9]|1[0-2])$/.test(junked.startDate), junked.startDate);
// only the one entry with a real type survives, and its junk amount becomes 0
assert.equal(junked.items.length, 1);
assert.equal(junked.items[0].amount, 0);

// a well-formed v2 file round-trips untouched
const saved = {
  balance: 5000,
  items: [
    { id: 'a', name: 'rent', type: 'expense', amount: 24000, apr: 1.5, startMonth: 0, endMonth: 11 },
  ],
  lang: 'en',
  theme: 'light',
  startDate: '2027-03',
  months: 24,
  v: 2,
};
assert.deepEqual(parseState(saved), saved);
assert.deepEqual(parseState(JSON.parse(JSON.stringify(saved))), saved);

// v1 stored income as a per-month figure; it is migrated to a total
const v1 = parseState({
  months: 12,
  items: [{ id: 'i', name: 'pay', type: 'income', amount: 50000, apr: 0, startMonth: 0, endMonth: 2 }],
});
assert.equal(v1.items[0].amount, 150000);
assert.equal(v1.v, 2);

// a reversed range is straightened, and a range past the window survives it:
// the window is a viewport, so shrinking it must not rewrite what was set up
const clamped = parseState({
  months: 6,
  v: 2,
  items: [{ id: 'z', name: '', type: 'expense', amount: 1, apr: -5, startMonth: 99, endMonth: 3 }],
});
assert.deepEqual(
  [clamped.items[0].startMonth, clamped.items[0].endMonth, clamped.items[0].apr],
  [99, 99, 0],
);
// still bounded, so a hand-edited file cannot ask for a million option rows
const farOut = parseState({
  months: 6,
  v: 2,
  items: [{ id: 'z', name: '', type: 'expense', amount: 1, apr: 0, startMonth: 0, endMonth: 1e9 }],
});
assert.equal(farOut.items[0].endMonth, 599);

// an item with no id still gets one, so React keys and drag targets stay unique
const noId = parseState({ v: 2, items: [{ type: 'income' }, { type: 'income' }] });
assert.equal(new Set(noId.items.map((it) => it.id)).size, 2);

// a __proto__ key in imported JSON is inert: parseState reads named keys and
// returns a fresh literal, it never spreads the untrusted object
parseState(
  JSON.parse(
    '{"__proto__":{"pwned":1},"v":2,"items":[{"type":"expense","__proto__":{"pwned":1}}]}',
  ),
);
assert.equal(({} as Record<string, unknown>).pwned, undefined);
assert.equal(([] as unknown as Record<string, unknown>).pwned, undefined);

// absurd rates used to overflow the amortization formula into NaN
for (const apr of [1e6, 1e308, -5]) {
  const st = parseState({
    v: 2,
    months: 600,
    items: [{ id: 'x', name: '', type: 'expense', amount: 1000, apr, startMonth: 0, endMonth: 599 }],
  });
  const proj = buildProjection(0, st.items, monthKeys('2026-09', 600));
  assert.ok(Number.isFinite(monthlyOf(st.items[0])), `monthly finite for apr=${apr}`);
  assert.ok(Number.isFinite(proj[599].balance), `balance finite for apr=${apr}`);
}

// and absurd amounts are clamped rather than carried to Infinity
const huge = parseState({
  v: 2,
  months: 600,
  balance: 1e308,
  items: [{ id: 'y', name: 'z'.repeat(5000), type: 'income', amount: 1e308, apr: 0, startMonth: 0, endMonth: 599 }],
});
assert.ok(Number.isFinite(huge.balance) && Math.abs(huge.balance) <= 1e12);
assert.ok(Math.abs(huge.items[0].amount) <= 1e12);
assert.equal(huge.items[0].name.length, 200);
assert.ok(
  buildProjection(huge.balance, huge.items, monthKeys('2026-09', 600)).every((m) =>
    Number.isFinite(m.balance),
  ),
);

// the v1 migration multiplies by the period count, so it clamps too
const v1Huge = parseState({
  months: 600,
  items: [{ id: 'q', name: '', type: 'income', amount: 1e12, apr: 0, startMonth: 0, endMonth: 599 }],
});
assert.ok(Math.abs(v1Huge.items[0].amount) <= 1e12);

console.log('ok');
