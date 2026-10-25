import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Lang, MonthProjection } from '../lib/types';
import { chartTicks, fmt, fmtMonth, fmtMonthYear, fmtShort } from '../lib/calc';
import { useLang } from '../i18n';

// SVG attributes ignore Tailwind classes but do resolve var().
const RED = 'var(--color-red)';
const SURFACE = 'var(--color-card)';
const LINE = 'var(--color-line)';
const MUTED = 'var(--color-muted)';
const DIM = 'var(--color-dim)';
const GREEN = 'var(--color-green)';

function BalanceDot(props: { cx?: number; cy?: number; payload?: MonthProjection }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const color = payload.balance >= 0 ? GREEN : RED;
  return <circle cx={cx} cy={cy} r={3.5} fill={color} stroke={SURFACE} strokeWidth={1.5} />;
}

function MonthTick(props: {
  x?: number;
  y?: number;
  payload?: { value: string };
  lang?: Lang;
  yearTicks?: Set<string>;
}) {
  const { x = 0, y = 0, payload, lang = 'zh', yearTicks } = props;
  if (!payload) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text y={14} textAnchor="middle" fill={MUTED} fontSize={12}>
        {fmtMonth(payload.value, lang)}
      </text>
      {yearTicks?.has(payload.value) && (
        <text y={29} textAnchor="middle" fill={DIM} fontSize={10}>
          {payload.value.slice(0, 4)}
        </text>
      )}
    </g>
  );
}

export function ProjectionChart({ data }: { data: MonthProjection[] }) {
  const { lang, t } = useLang();
  const { ticks, yearTicks } = useMemo(
    () => chartTicks(data.map((d) => d.month)),
    [data],
  );

  const gradStops = useMemo(() => {
    const n = data.length;
    if (n < 2) return { line: [] as React.ReactNode[], fill: [] as React.ReactNode[] };
    const c = (i: number) => (data[i].balance >= 0 ? GREEN : RED);
    const line: React.ReactNode[] = [];
    const fill: React.ReactNode[] = [];
    const add = (key: string, off: string, color: string) => {
      line.push(<stop key={`l${key}`} offset={off} stopColor={color} />);
      fill.push(<stop key={`f${key}`} offset={off} stopColor={color} stopOpacity={0.15} />);
    };
    let cur = c(1);
    add('s', '0%', cur);
    for (let i = 2; i < n; i++) {
      const next = c(i);
      if (next !== cur) {
        const pct = `${((i - 1) / (n - 1)) * 100}%`;
        add(`${i}a`, pct, cur);
        add(`${i}b`, pct, next);
        cur = next;
      }
    }
    add('e', '100%', cur);
    return { line, fill };
  }, [data]);

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-medium text-secondary">{t.monthBal}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 18, bottom: 8, left: -8 }}>
            <defs>
              <linearGradient id="balStroke" x1="0" y1="0" x2="1" y2="0">
                {gradStops.line}
              </linearGradient>
              <linearGradient id="balFill" x1="0" y1="0" x2="1" y2="0">
                {gradStops.fill}
              </linearGradient>
            </defs>
            <CartesianGrid stroke={LINE} vertical={false} />
            <XAxis
              dataKey="month"
              ticks={ticks}
              interval={0}
              height={38}
              tick={<MonthTick lang={lang} yearTicks={yearTicks} />}
              axisLine={{ stroke: LINE }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={68}
              tickFormatter={fmtShort}
            />
            <ReferenceLine y={0} stroke={DIM} />
            <Tooltip
              cursor={{ stroke: DIM }}
              contentStyle={{
                background: SURFACE,
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                color: 'var(--color-primary)',
                fontSize: 13,
              }}
              labelStyle={{ color: MUTED, marginBottom: 2 }}
              labelFormatter={(k: string) => fmtMonthYear(k, lang)}
              formatter={(v: number) => [fmt(v), t.hBal]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="url(#balStroke)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="url(#balFill)"
              dot={<BalanceDot />}
              activeDot={<BalanceDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
