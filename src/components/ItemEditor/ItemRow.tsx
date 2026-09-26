import { useEffect, useMemo, useState } from 'react';
import { MAX_MONTHS } from '../../lib/types';
import type { Item, ItemType } from '../../lib/types';
import {
  aprOf,
  calcPrincipal,
  fmt,
  fmtMonthYear,
  monthKeys,
  monthlyOf,
  num,
  totalInterest,
} from '../../lib/calc';
import { useLang } from '../../i18n';

/** Shared with HeaderRow so columns line up; narrow screens fall back to wrapping flex. */
export const gridCls: Record<ItemType, string> = {
  expense: 'sm:grid sm:grid-cols-[1rem_minmax(0,1fr)_5.25rem_5.25rem_2.75rem_4rem_15rem_1.5rem]',
  income: 'sm:grid sm:grid-cols-[1rem_minmax(0,1fr)_5.25rem_5.25rem_2.75rem_15rem_1.5rem]',
};

const cellBase =
  'rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-primary ' +
  'placeholder:text-ghost outline-none transition-colors hover:border-line hover:bg-input ' +
  'focus:border-accent focus:bg-input';

const textCellCls = `w-full ${cellBase}`;
const numCellCls = `w-[5.25rem] text-right tabular-nums sm:w-full ${cellBase}`;
const aprCellCls = `w-16 text-right tabular-nums sm:w-full ${cellBase}`;

/** Sets the range by length instead of by end month; the two are the same knob. */
function MonthCount({ periods, onChange }: { periods: number; onChange: (n: number) => void }) {
  const { t } = useLang();
  // Raw string while typing, so a half-typed number does not snap the range.
  const [draft, setDraft] = useState(String(periods));
  useEffect(() => setDraft(String(periods)), [periods]);

  return (
    <input
      type="number"
      min={1}
      max={MAX_MONTHS}
      step={1}
      value={draft}
      title={t.itemMonths}
      aria-label={t.itemMonths}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = num(e.target.value);
        if (n >= 1 && n <= MAX_MONTHS) onChange(n);
      }}
      onBlur={() => setDraft(String(periods))}
      className="w-9 shrink-0 rounded border border-line/60 bg-transparent px-1 py-0.5 text-right text-[12px] tabular-nums text-secondary outline-none hover:border-line focus:border-accent focus:text-primary"
    />
  );
}

function MonthRange({
  item,
  keys,
  onChange,
}: {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
}) {
  const { lang, t } = useLang();
  // An item can outlast the window; its own months still need options to select.
  const opts = useMemo(() => {
    const all = item.endMonth < keys.length ? keys : monthKeys(keys[0], item.endMonth + 1);
    return all.map((k, i) => (
      <option key={k} value={i}>
        {fmtMonthYear(k, lang)}
      </option>
    ));
  }, [keys, lang, item.endMonth]);

  const once = item.startMonth === item.endMonth;
  // Left select drops its chevron (bg-none): two of them clash with the arrow between.
  const base =
    'min-w-0 cursor-pointer rounded bg-transparent py-1 text-[13px] text-secondary outline-none hover:text-primary';

  return (
    <div className="flex w-full basis-full items-center justify-center rounded-md border border-transparent px-0.5 sm:basis-auto transition-colors hover:border-line hover:bg-input focus-within:border-accent focus-within:bg-input">
      <select
        aria-label={t.start}
        value={item.startMonth}
        onChange={(e) => {
          const startMonth = Number(e.target.value);
          onChange({
            startMonth,
            endMonth: once ? startMonth : Math.max(startMonth, item.endMonth),
          });
        }}
        className={`${base} bg-none px-1.5`}
      >
        {opts}
      </select>
      {!once && (
        <>
          <span aria-hidden className="shrink-0 text-ghost">
            →
          </span>
          <select
            aria-label={t.end}
            value={item.endMonth}
            onChange={(e) => {
              const endMonth = Number(e.target.value);
              onChange({ endMonth, startMonth: Math.min(endMonth, item.startMonth) });
            }}
            className={`${base} pl-1.5 pr-5 [background-position:right_0.35rem_center] [background-size:0.6rem]`}
          >
            {opts}
          </select>
          <MonthCount
            periods={item.endMonth - item.startMonth + 1}
            onChange={(n) =>
              onChange({ endMonth: Math.min(item.startMonth + n - 1, MAX_MONTHS - 1) })
            }
          />
        </>
      )}
      <button
        onClick={() => onChange({ endMonth: once ? keys.length - 1 : item.startMonth })}
        aria-pressed={once}
        title={t.once}
        aria-label={t.once}
        className={`ml-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
          once ? 'bg-accent/20 text-accent' : 'text-dim hover:bg-hover hover:text-secondary'
        }`}
      >
        1×
      </button>
    </div>
  );
}

interface Props {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  /** Starts a drag; ItemEditor tracks the pointer from there. */
  onGrab: () => void;
}

export function ItemRow({ item, keys, onChange, onRemove, onGrab }: Props) {
  const { t } = useLang();
  const periods = item.endMonth - item.startMonth + 1;
  const perMoLabel = item.type === 'income' ? t.perMoIn : t.perMo;
  const interest = totalInterest(item);

  return (
    <div
      className={`${gridCls[item.type]} group relative flex flex-wrap items-center gap-2 py-1.5 transition-colors hover:bg-white/[0.02]`}
    >
      <span
        role="button"
        aria-label={t.reorder}
        title={t.reorder}
        onPointerDown={(e) => {
          e.preventDefault();
          onGrab();
        }}
        className="absolute left-0 top-1 cursor-grab touch-none select-none py-1 pr-1 text-base leading-none text-ghost transition-colors hover:text-dim active:cursor-grabbing sm:static sm:p-0 sm:text-center sm:text-[13px]"
      >
        ⠿
      </span>
      <input
        value={item.name}
        placeholder={t.namePh}
        aria-label={t.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={`basis-full pl-5 pr-8 font-medium sm:basis-auto sm:pl-2 sm:pr-2 ${textCellCls}`}
      />
      <input
        type="number"
        title={t.total}
        aria-label={t.total}
        placeholder={t.total}
        value={item.amount || ''}
        onChange={(e) => onChange({ amount: num(e.target.value) })}
        className={numCellCls}
      />
      <input
        type="number"
        title={perMoLabel}
        aria-label={perMoLabel}
        placeholder={perMoLabel}
        value={Math.round(monthlyOf(item)) || ''}
        onChange={(e) =>
          onChange({
            amount: Math.round(calcPrincipal(num(e.target.value), aprOf(item), periods)),
          })
        }
        className={numCellCls}
      />
      <button
        onClick={() => onChange({ lockMonthly: !item.lockMonthly })}
        aria-label={`${t.lockCol}: ${item.lockMonthly ? perMoLabel : t.total}`}
        title={t.lockHint}
        className={`shrink-0 rounded border px-1 py-0.5 text-[11px] font-medium transition-colors ${
          item.lockMonthly
            ? 'border-accent/50 bg-accent/15 text-accent'
            : 'border-line/60 text-dim hover:bg-hover hover:text-secondary'
        }`}
      >
        {item.lockMonthly ? t.lockMo : t.lockTot}
      </button>
      {item.type === 'expense' && (
        <input
          type="number"
          step="0.01"
          title={t.apr}
          aria-label={t.apr}
          placeholder={t.apr}
          value={item.apr || ''}
          onChange={(e) => onChange({ apr: num(e.target.value) })}
          className={aprCellCls}
        />
      )}
      <MonthRange item={item} keys={keys} onChange={onChange} />
      <button
        onClick={onRemove}
        aria-label={t.remove}
        title={t.remove}
        className="absolute right-0 top-1.5 shrink-0 rounded px-1 py-1 text-base leading-none text-ghost transition hover:bg-hover hover:text-red sm:static sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        ×
      </button>
      {interest > 0.5 && (
        <span className="basis-full px-2 pb-0.5 text-[11px] text-dim sm:col-span-full">
          {periods}
          {t.periods} · {t.intTotal} <span className="text-amber">{fmt(interest)}</span>
        </span>
      )}
    </div>
  );
}
