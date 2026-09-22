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
import type { MonthProjection } from '../lib/types';
import { fmt } from '../lib/calc';
import { useLang } from '../i18n';

/** 結餘為負的月份標紅點 */
function BalanceDot(props: { cx?: number; cy?: number; payload?: MonthProjection }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.balance >= 0) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#ff6b6b" />;
}

export function ProjectionChart({ data }: { data: MonthProjection[] }) {
  const { t } = useLang();

  return (
    <section className="rounded-xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm text-muted">{t.monthBal}</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f8cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2e3148" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#8b8d97', fontSize: 12 }}
              axisLine={{ stroke: '#2e3148' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8b8d97', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={fmt}
            />
            <ReferenceLine y={0} stroke="#5a5d6e" />
            <Tooltip
              contentStyle={{
                background: '#181a28',
                border: '1px solid #2e3148',
                borderRadius: 8,
                color: '#e8e9ed',
              }}
              labelStyle={{ color: '#8b8d97' }}
              formatter={(v: number) => [fmt(v), t.hBal]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#4f8cff"
              strokeWidth={2}
              fill="url(#balFill)"
              dot={<BalanceDot />}
              activeDot={{ r: 5, fill: '#4f8cff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
