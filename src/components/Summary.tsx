import type { MonthProjection } from '../lib/types';
import { fmt, fmtMonthYear, summarize } from '../lib/calc';
import { useLang } from '../i18n';

function Tile({
  label,
  value,
  note,
  tone = 'text-primary',
  big = false,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-semibold ${big ? 'text-2xl' : 'text-lg'} ${tone}`}>{value}</p>
      <p className="mt-0.5 h-4 text-[11px] text-dim">{note ?? ''}</p>
    </div>
  );
}

export function Summary({ data }: { data: MonthProjection[] }) {
  const { lang, t } = useLang();
  const { endBalance, low, totalIncome, totalExpense } = summarize(data);
  const last = data[data.length - 1];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile
        label={t.endBal}
        value={fmt(endBalance)}
        note={last && fmtMonthYear(last.month, lang)}
        tone={endBalance < 0 ? 'text-red' : 'text-primary'}
        big
      />
      <Tile
        label={t.lowBal}
        value={low ? fmt(low.balance) : '—'}
        note={low && fmtMonthYear(low.month, lang)}
        tone={low && low.balance < 0 ? 'text-red' : 'text-secondary'}
        big
      />
      <Tile label={t.totalIn} value={fmt(totalIncome)} tone="text-green" />
      <Tile label={t.totalOut} value={fmt(totalExpense)} tone="text-red" />
    </section>
  );
}
