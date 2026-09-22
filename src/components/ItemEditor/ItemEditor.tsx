import { useMemo, useState } from 'react';
import type { Item, ItemType } from '../../lib/types';
import { fmtMonthYear } from '../../lib/calc';
import { useLang } from '../../i18n';
import { ExpenseRow } from './ExpenseRow';
import { IncomeRow } from './IncomeRow';

export const inputCls =
  'rounded-lg border border-line bg-input px-2.5 py-1.5 text-primary placeholder:text-ghost ' +
  'outline-none transition-colors focus:border-blue focus:ring-1 focus:ring-blue/40';

/**
 * 名稱 + 刪除：名稱當成這一列的標題，不要再包一層輸入框的邊，
 * hover / focus 才浮出底色；刪除鈕也拿掉方框。收支兩列共用。
 */
export function RowHeader({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-1">
      <input
        value={item.name}
        placeholder={t.namePh}
        onChange={(e) => onChange({ name: e.target.value })}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-[15px] font-medium text-primary outline-none transition-colors placeholder:font-normal placeholder:text-ghost hover:bg-hover focus:bg-hover"
      />
      <button
        onClick={onRemove}
        aria-label={t.remove}
        title={t.remove}
        className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-ghost transition-colors hover:bg-hover hover:text-red"
      >
        ×
      </button>
    </div>
  );
}

/**
 * 起迄月份：兩個 select 併成一個帶框的區間控制項，
 * 中間用箭頭連起來，比兩個各自帶框的下拉好讀。
 */
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

  // 兩個 chevron 併排會跟中間的箭頭打架，左邊那顆拿掉，整組只留右端一個
  const base =
    'min-w-0 flex-1 cursor-pointer rounded-md bg-transparent py-1.5 text-primary outline-none hover:bg-hover';
  const startCls = `${base} bg-none px-2`;
  const endCls = `${base} pl-2 pr-5 [background-position:right_0.35rem_center] [background-size:0.65rem]`;

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <span className="text-[11px] text-muted">{t.itemRange}</span>
      <div className="flex items-center rounded-lg border border-line bg-input px-1 transition-colors focus-within:border-blue">
        <select
          aria-label={t.start}
          value={item.startMonth}
          onChange={(e) => {
            const startMonth = Number(e.target.value);
            onChange({ startMonth, endMonth: Math.max(startMonth, item.endMonth) });
          }}
          className={startCls}
        >
          {opts}
        </select>
        <span aria-hidden className="shrink-0 px-0.5 text-dim">
          →
        </span>
        <select
          aria-label={t.end}
          value={item.endMonth}
          onChange={(e) => {
            const endMonth = Number(e.target.value);
            onChange({ endMonth, startMonth: Math.min(endMonth, item.startMonth) });
          }}
          className={endCls}
        >
          {opts}
        </select>
      </div>
    </div>
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
    <section className="card overflow-hidden">
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
