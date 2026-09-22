import { useMemo, useState } from 'react';
import type { Item, ItemType } from '../../lib/types';
import { fmtMonthYear } from '../../lib/calc';
import { useLang } from '../../i18n';
import { ExpenseRow } from './ExpenseRow';
import { IncomeRow } from './IncomeRow';

export const inputCls =
  'rounded-lg border border-line bg-input px-2.5 py-1.5 text-primary placeholder:text-ghost ' +
  'outline-none transition-colors focus:border-blue focus:ring-1 focus:ring-blue/40';

/** 起迄月份選單，收支列共用 */
export function MonthRange({
  item,
  keys,
  onChange,
}: {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
}) {
  const { lang, t } = useLang();
  const opts = useMemo(
    () =>
      keys.map((k, i) => (
        <option key={k} value={i}>
          {fmtMonthYear(k, lang)}
        </option>
      )),
    [keys, lang],
  );

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-muted">{t.start}</span>
        <select
          value={item.startMonth}
          onChange={(e) => {
            const startMonth = Number(e.target.value);
            onChange({ startMonth, endMonth: Math.max(startMonth, item.endMonth) });
          }}
          className={inputCls}
        >
          {opts}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-muted">{t.end}</span>
        <select
          value={item.endMonth}
          onChange={(e) => {
            const endMonth = Number(e.target.value);
            onChange({ endMonth, startMonth: Math.min(endMonth, item.startMonth) });
          }}
          className={inputCls}
        >
          {opts}
        </select>
      </label>
    </>
  );
}

interface Props {
  items: Item[];
  keys: string[];
  onChange: (items: Item[]) => void;
}

export function ItemEditor({ items, keys, onChange }: Props) {
  const { t } = useLang();
  const [tab, setTab] = useState<ItemType>('expense');

  const visible = items.filter((it) => it.type === tab);
  const count = (k: ItemType) => items.filter((it) => it.type === k).length;

  const add = () =>
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        name: '',
        type: tab,
        amount: 0,
        apr: 0,
        startMonth: 0,
        endMonth: keys.length - 1,
      },
    ]);

  const patch = (id: string, p: Partial<Item>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex border-b border-line">
        {(['expense', 'income'] as ItemType[]).map((k) => {
          const on = tab === k;
          const accent = k === 'expense' ? 'text-red border-red' : 'text-green border-green';
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-pressed={on}
              className={`flex-1 border-b-2 px-4 py-3 text-sm transition-colors ${
                on ? accent : 'border-transparent text-dim hover:bg-hover hover:text-secondary'
              }`}
            >
              {k === 'expense' ? t.expense : t.income}
              {count(k) > 0 && <span className="ml-1.5 text-xs text-dim">{count(k)}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {visible.length === 0 && <p className="py-6 text-center text-sm text-dim">{t.empty}</p>}
        {visible.map((it) =>
          it.type === 'expense' ? (
            <ExpenseRow
              key={it.id}
              item={it}
              keys={keys}
              onChange={(p) => patch(it.id, p)}
              onRemove={() => remove(it.id)}
            />
          ) : (
            <IncomeRow
              key={it.id}
              item={it}
              keys={keys}
              onChange={(p) => patch(it.id, p)}
              onRemove={() => remove(it.id)}
            />
          ),
        )}
        <button
          onClick={add}
          className="rounded-lg border border-dashed border-line py-2.5 text-sm text-muted transition-colors hover:border-blue/60 hover:bg-hover hover:text-secondary"
        >
          {tab === 'expense' ? t.addExp : t.addInc}
        </button>
      </div>
    </section>
  );
}
