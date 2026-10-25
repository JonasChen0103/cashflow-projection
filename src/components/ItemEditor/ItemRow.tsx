import type { Item, ItemType } from '../../lib/types';
import { thisMonth } from '../../lib/types';
import {
  aprOf,
  calcPrincipal,
  fmt,
  indexToMonthKey,
  monthDiff,
  monthlyOf,
  num,
  totalInterest,
} from '../../lib/calc';
import { useLang } from '../../i18n';
import { MonthPicker } from '../MonthPicker';

/** Shared with HeaderRow so columns line up; narrow screens fall back to wrapping flex. */
export const gridCls: Record<ItemType, string> = {
  expense: 'md:grid md:grid-cols-[1rem_minmax(0,1fr)_5.25rem_5.25rem_2.75rem_4rem_22rem_2rem]',
  income: 'md:grid md:grid-cols-[1rem_minmax(0,1fr)_5.25rem_5.25rem_2.75rem_22rem_2rem]',
};

const cellBase =
  'rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-primary ' +
  'placeholder:text-ghost outline-none transition-colors hover:border-line hover:bg-input ' +
  'focus:border-accent focus:bg-input';

const textCellCls = `w-full ${cellBase}`;
const numCellCls = `w-[5.25rem] text-right tabular-nums md:w-full ${cellBase}`;
const aprCellCls = `w-16 text-right tabular-nums md:w-full ${cellBase}`;

type RangeMode = 'once' | 'range' | 'ongoing';

function MonthRange({
  item,
  keys,
  onChange,
}: {
  item: Item;
  keys: string[];
  onChange: (patch: Partial<Item>) => void;
}) {
  const { t } = useLang();
  const mode: RangeMode = item.ongoing
    ? 'ongoing'
    : item.startMonth === item.endMonth
      ? 'once'
      : 'range';

  const startKey = indexToMonthKey(keys[0], item.startMonth);
  const endKey = indexToMonthKey(keys[0], item.endMonth);

  const setMode = (m: string) => {
    if (m === 'once') onChange({ endMonth: item.startMonth, ongoing: false });
    else if (m === 'ongoing') onChange({ ongoing: true });
    else onChange({ endMonth: Math.max(item.startMonth + 1, keys.length - 1), ongoing: false });
  };

  const modes: { key: RangeMode; label: string; on: string }[] = [
    { key: 'range', label: t.itemRange, on: 'bg-teal/15 text-teal border-teal/40' },
    { key: 'once', label: '1×', on: 'bg-purple/15 text-purple border-purple/40' },
    { key: 'ongoing', label: '∞', on: 'bg-pink/15 text-pink border-pink/40' },
  ];

  return (
    <div className="flex w-full min-w-0 basis-full items-center gap-1 md:basis-auto">
      <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-[11px] font-medium">
        {modes.map(({ key, label, on }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`px-1.5 py-0.5 transition-colors ${
              mode === key ? on : 'text-dim hover:bg-hover hover:text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <MonthPicker
        compact
        label={t.start}
        value={startKey}
        onChange={(k) => {
          const startMonth = monthDiff(keys[0], k);
          onChange({
            startMonth,
            endMonth: mode === 'once' ? startMonth : Math.max(startMonth, item.endMonth),
          });
        }}
      />
      {mode === 'range' && (
        <>
          <span aria-hidden className="shrink-0 text-ghost">→</span>
          <MonthPicker
            compact
            label={t.end}
            value={endKey}
            min={startKey}
            align="right"
            onChange={(k) => {
              const endMonth = monthDiff(keys[0], k);
              onChange({ endMonth, startMonth: Math.min(endMonth, item.startMonth) });
            }}
          />
          <input
            type="number"
            min={1}
            value={item.endMonth - item.startMonth + 1}
            onChange={(e) => {
              const n = Math.max(1, num(e.target.value));
              onChange({ endMonth: item.startMonth + n - 1 });
            }}
            aria-label={t.itemMonths}
            title={t.itemMonths}
            className="w-10 shrink-0 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-center text-[12px] tabular-nums text-secondary outline-none transition-colors hover:border-line hover:bg-input focus:border-accent focus:bg-input"
          />
          <span className="shrink-0 text-[11px] text-dim">{t.periods}</span>
        </>
      )}
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
  const interest = item.ongoing ? 0 : totalInterest(item);

  const once = !item.ongoing && item.startMonth === item.endMonth;
  const showLock = !once && !item.ongoing;

  const hl = (c: string): React.CSSProperties => ({
    color: `var(--color-${c})`,
  });

  const totalStyle = once
    ? hl('purple')
    : showLock && !item.lockMonthly
      ? hl('blue')
      : undefined;

  const monthlyStyle = item.ongoing
    ? hl('pink')
    : showLock && item.lockMonthly
      ? hl('accent')
      : undefined;

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
        className="absolute left-0 top-1 cursor-grab touch-none select-none py-1 pr-1 text-base leading-none text-ghost transition-colors hover:text-dim active:cursor-grabbing md:static md:p-0 md:text-center md:text-[13px]"
      >
        ⠿
      </span>
      <input
        value={item.name}
        placeholder={t.namePh}
        aria-label={t.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={`basis-full pl-5 pr-8 font-medium md:basis-auto md:pl-2 md:pr-2 ${textCellCls}`}
      />
      <input
        type="number"
        title={t.total}
        aria-label={t.total}
        placeholder={item.ongoing ? '—' : t.total}
        value={item.ongoing ? '' : item.amount || ''}
        disabled={!!item.ongoing}
        onChange={(e) => onChange({ amount: num(e.target.value) })}
        style={totalStyle}
        className={`${numCellCls}${item.ongoing ? ' opacity-40' : ''}`}
      />
      <input
        type="number"
        title={perMoLabel}
        aria-label={perMoLabel}
        placeholder={perMoLabel}
        value={item.ongoing ? item.amount || '' : Math.round(monthlyOf(item)) || ''}
        onChange={(e) =>
          item.ongoing
            ? onChange({ amount: num(e.target.value) })
            : onChange({
                amount: Math.round(calcPrincipal(num(e.target.value), aprOf(item), periods)),
              })
        }
        style={monthlyStyle}
        className={numCellCls}
      />
      {showLock ? (
        <button
          onClick={() => onChange({ lockMonthly: !item.lockMonthly })}
          aria-label={`${t.lockCol}: ${item.lockMonthly ? perMoLabel : t.total}`}
          title={t.lockHint}
          className={`shrink-0 rounded border px-1 py-0.5 text-[11px] font-medium transition-colors ${
            item.lockMonthly
              ? 'border-accent/50 bg-accent/15 text-accent'
              : 'border-blue/50 bg-blue/15 text-blue'
          }`}
        >
          {item.lockMonthly ? t.lockMo : t.lockTot}
        </button>
      ) : (
        <span aria-hidden className="hidden md:block" />
      )}
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
        className="absolute right-0 top-1.5 z-10 shrink-0 rounded px-1 py-1 text-base leading-none text-ghost transition hover:bg-hover hover:text-red md:static md:z-auto md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      >
        ×
      </button>
      {(() => {
        const isRange = !item.ongoing && item.startMonth !== item.endMonth;
        const nowIdx = monthDiff(keys[0], thisMonth());
        const remainMo = isRange ? Math.max(0, item.endMonth - Math.max(item.startMonth, nowIdx) + 1) : 0;
        const remainAmt = remainMo > 0 ? Math.round(monthlyOf(item)) * remainMo : 0;
        const hasInterest = interest > 0.5;
        const hasRemain = isRange && remainMo > 0 && remainMo < periods;
        if (!hasInterest && !hasRemain) return null;
        return (
          <span className="basis-full px-2 pb-0.5 text-[11px] text-dim md:col-span-full">
            {hasInterest && (
              <>
                {periods}{t.periods} · {t.intTotal} <span className="text-amber">{fmt(interest)}</span>
              </>
            )}
            {hasInterest && hasRemain && ' · '}
            {hasRemain && (
              <>
                {t.remaining} {remainMo}{t.periods} / {fmt(remainAmt)}
              </>
            )}
          </span>
        );
      })()}
    </div>
  );
}
