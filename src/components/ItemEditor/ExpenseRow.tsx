import type { Item } from '../../lib/types';
import { fmt, monthlyOf, totalInterest } from '../../lib/calc';
import { useLang } from '../../i18n';
import { inputCls, MonthRange, RowHeader } from './ItemEditor';

interface Props {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}

export function ExpenseRow({ item, keys, onChange, onRemove }: Props) {
  const { t } = useLang();
  const periods = item.endMonth - item.startMonth + 1;
  const interest = totalInterest(item);

  return (
    <div className="rounded-lg bg-white/[0.025] p-3">
      <RowHeader item={item} onChange={onChange} onRemove={onRemove} />

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted">{t.principal}</span>
          <input
            type="number"
            value={item.amount || ''}
            placeholder="0"
            onChange={(e) => onChange({ amount: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted">{t.apr}</span>
          <input
            type="number"
            step="0.01"
            value={item.apr || ''}
            placeholder="0"
            onChange={(e) => onChange({ apr: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </label>
        <MonthRange item={item} keys={keys} onChange={onChange} />
      </div>

      <p className="mt-2 text-xs text-dim">
        {periods}
        {t.periods} · {t.mo} <span className="text-red">{fmt(monthlyOf(item))}</span>
        {interest > 0.5 && (
          <>
            {' '}
            · {t.intTotal} <span className="text-amber">{fmt(interest)}</span>
          </>
        )}
      </p>
    </div>
  );
}
