import { useEffect, useRef, useState } from 'react';
import { fmtMonth, fmtMonthYear } from '../lib/calc';
import { monthKey } from '../lib/types';
import { useLang } from '../i18n';

interface Props {
  /** "2026-09" */
  value: string;
  /** Months before this one are disabled. */
  min?: string;
  /** Right-hand fields open leftwards so the popup stays inside the card. */
  align?: 'left' | 'right';
  label: string;
  onChange: (v: string) => void;
}

/** Hand-rolled: the native <input type="month"> popup is browser chrome that CSS cannot theme. */
export function MonthPicker({ value, min, align = 'left', label, onChange }: Props) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number(value.slice(0, 4)));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setYear(Number(value.slice(0, 4))), [value, open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const nav =
    'rounded-md px-2 py-1 text-base leading-none text-dim transition-colors hover:bg-hover hover:text-primary';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className={`mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-input px-2.5 py-1.5 text-left text-[15px] transition-colors ${
          open ? 'border-blue' : 'border-line hover:border-dim'
        }`}
      >
        <span className="truncate tabular-nums text-primary">{fmtMonthYear(value, lang)}</span>
        <span aria-hidden className="shrink-0 text-xs text-dim">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute top-full z-20 mt-1.5 w-60 rounded-xl border border-line bg-card p-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setYear(year - 1)} aria-label={t.prevYear} className={nav}>
              ‹
            </button>
            <span className="font-mono text-sm tabular-nums text-secondary">{year}</span>
            <button type="button" onClick={() => setYear(year + 1)} aria-label={t.nextYear} className={nav}>
              ›
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, mi) => {
              const k = monthKey(year, mi);
              const on = k === value;
              const blocked = !!min && k < min;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={blocked}
                  aria-pressed={on}
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                  className={`rounded-md py-1.5 text-[13px] transition-colors ${
                    on
                      ? 'bg-blue font-medium text-card'
                      : blocked
                        ? 'cursor-not-allowed text-ghost'
                        : 'text-secondary hover:bg-hover hover:text-primary'
                  }`}
                >
                  {fmtMonth(k, lang)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
