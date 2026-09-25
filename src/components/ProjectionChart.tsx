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
const ACCENT = 'var(--color-accent)';
const RED = 'var(--color-red)';
const SURFACE = 'var(--color-card)';
const LINE = 'var(--color-line)';
const MUTED = 'var(--color-muted)';
const DIM = 'var(--color-dim)';

function BalanceDot(props: { cx?: number; cy?: number; payload?: MonthProjection }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.balance >= 0) return null;
  return <circle cx={cx} cy={cy} r={4} fill={RED} stroke={SURFACE} strokeWidth={2} />;
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

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-medium text-secondary">{t.monthBal}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 18, bottom: 8, left: -8 }}>
            <defs>
              <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
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
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="url(#balFill)"
              dot={<BalanceDot />}
              activeDot={{ r: 5, fill: ACCENT, stroke: SURFACE, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
