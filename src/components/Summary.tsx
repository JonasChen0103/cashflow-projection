import type { MonthProjection } from '../lib/types';
import { fmt, fmtMonthYear, summarize } from '../lib/calc';
import { useLang } from '../i18n';

function Tile({
  label,
  value,
  note,
  dot,
  alert = false,
}: {
  label: string;
  value: string;
  note?: string;
  /** 收支的身分靠這顆小色點，數字本身維持中性色 */
  dot?: string;
  alert?: boolean;
}) {
  return (
    <div className="card px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {dot && <span className={`inline-block size-1.5 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-semibold ${alert ? 'text-red' : 'text-primary'}`}>
        {value}
      </p>
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
        alert={endBalance < 0}
      />
      <Tile
        label={t.lowBal}
        value={low ? fmt(low.balance) : '—'}
        note={low && fmtMonthYear(low.month, lang)}
        alert={!!low && low.balance < 0}
      />
      <Tile label={t.totalIn} value={fmt(totalIncome)} dot="bg-green" />
      <Tile label={t.totalOut} value={fmt(totalExpense)} dot="bg-red" />
    </section>
  );
}
