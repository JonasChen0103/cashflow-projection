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
import { chartTicks, fmt, fmtMonth, fmtMonthYear } from '../lib/calc';
import { useLang } from '../i18n';

// SVG 屬性吃不到 Tailwind class，這幾個值要跟 globals.css 的 --color-* 對齊
const BLUE = '#4f8cff';
const RED = '#ff6b6b';
const SURFACE = '#171a27';
const LINE = '#2b2f44';

/** 結餘為負的月份標紅點；2px 底色描邊讓它在線上仍看得清 */
function BalanceDot(props: { cx?: number; cy?: number; payload?: MonthProjection }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.balance >= 0) return null;
  return <circle cx={cx} cy={cy} r={4} fill={RED} stroke={SURFACE} strokeWidth={2} />;
}

/**
 * 月份刻度：主行只寫月份，年份只在換年的刻度多寫一行，
 * 期間拉長時才不會每個刻度都拖著年份。
 */
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
      <text y={14} textAnchor="middle" fill="#8b8d97" fontSize={12}>
        {fmtMonth(payload.value, lang)}
      </text>
      {yearTicks?.has(payload.value) && (
        <text y={29} textAnchor="middle" fill="#5a5d6e" fontSize={10}>
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
    <section className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-medium text-secondary">{t.monthBal}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 8, left: -8 }}>
            <defs>
              <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
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
              tick={{ fill: '#8b8d97', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={68}
              tickFormatter={fmt}
            />
            <ReferenceLine y={0} stroke="#5a5d6e" />
            <Tooltip
              cursor={{ stroke: '#5a5d6e' }}
              contentStyle={{
                background: SURFACE,
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                color: '#e8e9ed',
                fontSize: 13,
              }}
              labelStyle={{ color: '#8b8d97', marginBottom: 2 }}
              labelFormatter={(k: string) => fmtMonthYear(k, lang)}
              formatter={(v: number) => [fmt(v), t.hBal]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={BLUE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="url(#balFill)"
              dot={<BalanceDot />}
              activeDot={{ r: 5, fill: BLUE, stroke: SURFACE, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
