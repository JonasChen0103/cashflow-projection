import { useEffect, useState } from 'react';
import { useLang } from '../i18n';
import { MAX_MONTHS, MIN_MONTHS } from '../lib/types';
import { inputCls } from './ItemEditor/ItemEditor';

interface Props {
  balance: number;
  startDate: string;
  months: number;
  onBalance: (v: number) => void;
  onStartDate: (v: string) => void;
  onMonths: (v: number) => void;
}

export function BalanceInput({
  balance,
  startDate,
  months,
  onBalance,
  onStartDate,
  onMonths,
}: Props) {
  const { t } = useLang();

  // 編輯中的原始字串：清空欄位重打時不要被夾回預設值
  const [draft, setDraft] = useState(String(months));
  useEffect(() => setDraft(String(months)), [months]);

  return (
    <section className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-card p-4 sm:grid-cols-3 sm:p-5">
      <label className="block">
        <span className="text-xs text-muted">{t.curBal}</span>
        <input
          type="number"
          value={balance || ''}
          placeholder="0"
          onChange={(e) => onBalance(Number(e.target.value) || 0)}
          className={`${inputCls} mt-1 w-full text-lg`}
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">{t.startDate}</span>
        <input
          type="month"
          value={startDate}
          onChange={(e) => e.target.value && onStartDate(e.target.value)}
          className={`${inputCls} mt-1 w-full text-lg`}
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">{t.periodLen}</span>
        <input
          type="number"
          min={MIN_MONTHS}
          max={MAX_MONTHS}
          step={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= MIN_MONTHS && n <= MAX_MONTHS) onMonths(n);
          }}
          onBlur={() => setDraft(String(months))}
          className={`${inputCls} mt-1 w-full text-lg`}
        />
      </label>
    </section>
  );
}
