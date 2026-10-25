import { useEffect, useState } from 'react';
import { num } from '../lib/calc';
import { useLang } from '../i18n';
import { MAX_MONTHS, MIN_MONTHS } from '../lib/types';
import { MonthPicker } from './MonthPicker';

interface Props {
  balance: number;
  startDate: string;
  endDate: string;
  months: number;
  onBalance: (v: number) => void;
  onStartDate: (v: string) => void;
  onEndDate: (v: string) => void;
  onMonths: (v: number) => void;
}

function Field({
  label,
  wide,
  children,
}: {
  label: React.ReactNode;
  /** Full row on narrow screens; the month picker overflows a two-column grid. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <span className="block text-[11px] font-medium text-dim">{label}</span>
      {children}
    </div>
  );
}

export function BalanceInput({
  balance,
  startDate,
  endDate,
  months,
  onBalance,
  onStartDate,
  onEndDate,
  onMonths,
}: Props) {
  const { t } = useLang();
  const field =
    'mt-1 w-full rounded-lg border border-line bg-input px-2.5 py-1.5 text-[15px] text-primary ' +
    'placeholder:text-ghost outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40';

  // Raw string while typing, so clearing the field does not snap back to the clamped value.
  const [draft, setDraft] = useState(String(months));
  useEffect(() => setDraft(String(months)), [months]);

  return (
    <section className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
      <Field label={t.curBal}>
        <input
          type="number"
          value={balance || ''}
          placeholder="0"
          aria-label={t.curBal}
          onChange={(e) => onBalance(num(e.target.value))}
          className={`${field} font-medium`}
        />
      </Field>
      <Field label={t.periodLen}>
        <input
          type="number"
          min={MIN_MONTHS}
          max={MAX_MONTHS}
          step={1}
          aria-label={t.periodLen}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = num(e.target.value);
            if (n >= MIN_MONTHS && n <= MAX_MONTHS) onMonths(n);
          }}
          onBlur={() => setDraft(String(months))}
          className={field}
        />
      </Field>
      <Field label={t.startDate} wide>
        <MonthPicker label={t.startDate} value={startDate} onChange={onStartDate} />
      </Field>
      <Field label={t.endDate} wide>
        <MonthPicker
          label={t.endDate}
          value={endDate}
          min={startDate}
          align="right"
          onChange={onEndDate}
        />
      </Field>
    </section>
  );
}
