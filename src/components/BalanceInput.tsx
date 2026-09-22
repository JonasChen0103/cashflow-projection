import { useLang } from '../i18n';
import { inputCls } from './ItemEditor/ItemEditor';

interface Props {
  balance: number;
  startDate: string;
  onBalance: (v: number) => void;
  onStartDate: (v: string) => void;
}

export function BalanceInput({ balance, startDate, onBalance, onStartDate }: Props) {
  const { t } = useLang();
  return (
    <section className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-card p-4 sm:grid-cols-2">
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
    </section>
  );
}
