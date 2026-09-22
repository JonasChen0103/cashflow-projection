import type { Item } from '../../lib/types';
import { fmt } from '../../lib/calc';
import { useLang } from '../../i18n';
import { inputCls, MonthRange, RowHeader } from './ItemEditor';

interface Props {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}

export function IncomeRow({ item, keys, onChange, onRemove }: Props) {
  const { t } = useLang();
  const periods = item.endMonth - item.startMonth + 1;

  return (
    <div className="rounded-lg bg-white/[0.025] p-3">
      <RowHeader item={item} onChange={onChange} onRemove={onRemove} />

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted">{t.monthlyIncome}</span>
          <input
            type="number"
            value={item.amount || ''}
            placeholder="0"
            onChange={(e) => onChange({ amount: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </label>
        <MonthRange item={item} keys={keys} onChange={onChange} />
      </div>

      <p className="mt-2 text-xs text-dim">
        {periods}
        {t.periods} · <span className="text-green">{fmt(item.amount * periods)}</span>
      </p>
    </div>
  );
}
