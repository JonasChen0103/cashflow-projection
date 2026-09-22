import type { Item } from '../../lib/types';
import { fmt } from '../../lib/calc';
import { useLang } from '../../i18n';
import { inputCls, MonthRange } from './ItemEditor';

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
    <div className="rounded-lg border border-line bg-input/40 p-3">
      <div className="flex gap-2">
        <input
          value={item.name}
          placeholder={t.namePh}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputCls} min-w-0 flex-1`}
        />
        <button
          onClick={onRemove}
          aria-label={t.remove}
          title={t.remove}
          className="rounded-lg border border-line px-2.5 text-dim hover:border-red hover:text-red"
        >
          ×
        </button>
      </div>

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
