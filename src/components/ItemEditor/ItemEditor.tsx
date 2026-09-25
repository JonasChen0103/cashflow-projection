import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Item, ItemType } from '../../lib/types';
import { num, reorder } from '../../lib/calc';
import { useLang } from '../../i18n';
import { ItemRow, gridCls } from './ItemRow';

function HeaderRow({ tab }: { tab: ItemType }) {
  const { t } = useLang();
  const cls = 'px-2 text-[11px] font-medium text-dim';
  return (
    <div className={`${gridCls[tab]} hidden items-end gap-2 pb-1`}>
      <span />
      <span className={cls}>{t.name}</span>
      <span className={`${cls} text-right`}>{t.total}</span>
      <span className={`${cls} text-right`}>{t.perMo}</span>
      {tab === 'expense' && <span className={`${cls} text-right`}>{t.apr}</span>}
      <span className={`${cls} text-center`}>{t.itemRange}</span>
      <span />
    </div>
  );
}

/** Distance from a scroll edge, in px, where dragging starts scrolling. */
const EDGE = 56;

interface Props {
  items: Item[];
  keys: string[];
  onChange: (items: Item[]) => void;
}

export function ItemEditor({ items, keys, onChange }: Props) {
  const { lang, t } = useLang();
  const [tab, setTab] = useState<ItemType>('expense');
  const [scroll, setScroll] = useState(false);
  const [rowsDraft, setRowsDraft] = useState('8');
  const rows = Math.min(50, Math.max(1, num(rowsDraft)));
  const list = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();
  const [grab, setGrab] = useState<string>();
  const [over, setOver] = useState<string>();

  const visible = items.filter((it) => it.type === tab);

  // ponytail: window height from the average row; rows that rewrap on resize
  // re-measure on the next change, per-row measurement if that ever shows.
  useLayoutEffect(() => {
    const el = list.current;
    if (el && visible.length) setMaxHeight((el.scrollHeight / visible.length) * rows);
  }, [rows, visible.length, tab, lang]);

  // Pointer events instead of HTML5 drag and drop: one path that also works on touch.
  useEffect(() => {
    if (!grab) return;
    // Auto-scroll near the edges: the list when it scrolls, the page otherwise.
    const box = list.current;
    const inner = box && box.scrollHeight > box.clientHeight ? box : null;
    const at = { x: 0, y: 0 };
    let speed = 0;

    const rowAt = () =>
      (document.elementFromPoint(at.x, at.y) as HTMLElement | null)
        ?.closest<HTMLElement>('[data-item]')?.dataset.item;

    const move = (e: PointerEvent) => {
      e.preventDefault();
      at.x = e.clientX;
      at.y = e.clientY;
      const { top, bottom } = inner
        ? inner.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      const below = at.y - (bottom - EDGE);
      const above = top + EDGE - at.y;
      speed = below > 0 ? Math.min(14, below / 3) : above > 0 ? -Math.min(14, above / 3) : 0;
      setOver(rowAt());
    };

    const tick = () => {
      if (speed) {
        (inner ?? window).scrollBy(0, speed);
        setOver(rowAt());
      }
      frame = requestAnimationFrame(tick);
    };
    let frame = requestAnimationFrame(tick);

    const drop = () => {
      const to = rowAt();
      if (to) onChange(reorder(items, grab, to));
      setGrab(undefined);
      setOver(undefined);
    };

    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', drop);
    document.addEventListener('pointercancel', drop);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', drop);
      document.removeEventListener('pointercancel', drop);
    };
  }, [grab, items, onChange]);

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

  return (
    <section className="card overflow-hidden">
      <div className="flex border-b border-line">
        {(['expense', 'income'] as ItemType[]).map((k) => {
          const on = tab === k;
          const count = items.filter((it) => it.type === k).length;
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
              {count > 0 && <span className="ml-1.5 text-xs text-dim">{count}</span>}
            </button>
          );
        })}
        {visible.length > 6 && (
          <div className="flex shrink-0 items-center gap-1.5 pr-3 text-xs">
            <button
              onClick={() => setScroll((s) => !s)}
              aria-pressed={scroll}
              title={t.scrollHint}
              className={`rounded border px-1.5 py-0.5 text-accent transition-colors ${
                scroll ? 'border-accent bg-accent/15' : 'border-line hover:bg-hover'
              }`}
            >
              {t.scroll}
            </button>
            {scroll && (
              <>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={rowsDraft}
                  onChange={(e) => setRowsDraft(e.target.value)}
                  title={t.rowsHint}
                  aria-label={t.rowsHint}
                  className="w-9 rounded border border-line bg-input px-1 py-0.5 text-center text-primary outline-none focus:border-accent"
                />
                <span className="text-dim">{t.rowsUnit}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">{t.empty}</p>
        ) : (
          <>
            <HeaderRow tab={tab} />
            <div
              ref={list}
              style={scroll ? { maxHeight } : undefined}
              className={`divide-y divide-line/60 border-y border-line/60 ${
                scroll ? 'overflow-auto' : ''
              } ${grab ? 'select-none' : ''}`}
            >
              {visible.map((it) => (
                <div
                  key={it.id}
                  data-item={it.id}
                  className={
                    grab === it.id ? 'opacity-40' : over === it.id ? 'bg-accent/[0.07]' : ''
                  }
                >
                  <ItemRow
                    item={it}
                    keys={keys}
                    onChange={(p) => patch(it.id, p)}
                    onRemove={() => onChange(items.filter((x) => x.id !== it.id))}
                    onGrab={() => setGrab(it.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
        <button
          onClick={add}
          className="mt-3 w-full rounded-lg border border-dashed border-line py-2 text-sm text-muted transition-colors hover:border-accent/60 hover:bg-hover hover:text-secondary"
        >
          {tab === 'expense' ? t.addExp : t.addInc}
        </button>
      </div>
    </section>
  );
}
