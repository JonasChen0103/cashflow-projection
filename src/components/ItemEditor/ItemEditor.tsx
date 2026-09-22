import { useState } from 'react';
import type { Item, ItemType } from '../../lib/types';
import { useLang } from '../../i18n';
import { ExpenseRow } from './ExpenseRow';
import { IncomeRow } from './IncomeRow';

export const inputCls =
  'rounded-lg border border-line bg-input px-2.5 py-1.5 text-primary placeholder:text-ghost ' +
  'outline-none focus:border-blue';

/** 起迄月份選單，收支列共用 */
export function MonthRange({
  item,
  labels,
  onChange,
}: {
  item: Item;
  labels: string[];
  onChange: (patch: Partial<Item>) => void;
}) {
  const { t } = useLang();
  const opts = labels.map((l, i) => (
    <option key={i} value={i}>
      {l}
    </option>
  ));
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
  labels: string[];
  onChange: (items: Item[]) => void;
}

export function ItemEditor({ items, labels, onChange }: Props) {
  const { t } = useLang();
  const [tab, setTab] = useState<ItemType>('expense');

  const visible = items.filter((it) => it.type === tab);

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
        endMonth: labels.length - 1,
      },
    ]);

  const patch = (id: string, p: Partial<Item>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  return (
    <section className="rounded-xl border border-line bg-card">
      <div className="flex border-b border-line">
        {(['expense', 'income'] as ItemType[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 px-4 py-2.5 text-sm transition-colors ${
              tab === k
                ? k === 'expense'
                  ? 'text-red border-b-2 border-red'
                  : 'text-green border-b-2 border-green'
                : 'text-dim hover:text-secondary'
            }`}
          >
            {k === 'expense' ? t.expense : t.income}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {visible.length === 0 && <p className="py-4 text-center text-sm text-dim">{t.empty}</p>}
        {visible.map((it) =>
          it.type === 'expense' ? (
            <ExpenseRow
              key={it.id}
              item={it}
              labels={labels}
              onChange={(p) => patch(it.id, p)}
              onRemove={() => remove(it.id)}
            />
          ) : (
            <IncomeRow
              key={it.id}
              item={it}
              labels={labels}
              onChange={(p) => patch(it.id, p)}
              onRemove={() => remove(it.id)}
            />
          ),
        )}
        <button
          onClick={add}
          className="rounded-lg border border-dashed border-line py-2 text-sm text-muted hover:bg-hover hover:text-secondary"
        >
          {tab === 'expense' ? t.addExp : t.addInc}
        </button>
      </div>
    </section>
  );
}
