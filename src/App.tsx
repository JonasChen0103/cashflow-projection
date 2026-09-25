import { useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LangContext, dicts } from './i18n';
import { buildProjection, monthDiff, monthKeys, rangeLabel, reanchor } from './lib/calc';
import {
  MAX_IMPORT_BYTES,
  MAX_ITEMS,
  clampMonths,
  emptyState,
  parseState,
  thisMonth,
} from './lib/types';
import type { AppState } from './lib/types';
import { Header } from './components/Header';
import { BalanceInput } from './components/BalanceInput';
import { ItemEditor } from './components/ItemEditor/ItemEditor';
import { Summary } from './components/Summary';
import { ProjectionChart } from './components/ProjectionChart';
import { ProjectionTable } from './components/ProjectionTable';

const KEY = 'cashflow-state';

const footBtn = 'rounded-lg border border-line px-2.5 py-1 transition-colors';

export default function App() {
  const [state, setState] = useLocalStorage(KEY, parseState);
  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const months = clampMonths(state.months);

  /** The window is a viewport: item ranges outlive it, so a shorter window never rewrites them. */
  const setMonths = (n: number) => patch({ months: clampMonths(n) });

  const now = thisMonth();
  const advance = () =>
    patch({ startDate: now, items: reanchor(state.items, state.startDate, now) });

  const t = dicts[state.lang];
  const picker = useRef<HTMLInputElement>(null);

  const save = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-${now}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // so picking the same file twice still fires onChange
    if (!f || !confirm(t.importConfirm)) return;
    try {
      // Rejected, not truncated: a refused file costs nothing, a silently
      // trimmed one looks like it imported and is missing rows.
      if (f.size > MAX_IMPORT_BYTES) throw new Error('file too large');
      const raw = JSON.parse(await f.text());
      if (Array.isArray(raw?.items) && raw.items.length > MAX_ITEMS) {
        throw new Error('too many items');
      }
      setState(parseState(raw));
    } catch {
      alert(t.importFailed);
    }
  };

  const keys = useMemo(() => monthKeys(state.startDate, months), [state.startDate, months]);
  const data = useMemo(
    () => buildProjection(state.balance, state.items, keys),
    [state.balance, state.items, keys],
  );

  return (
    <LangContext.Provider value={{ lang: state.lang, t, setLang: (lang) => patch({ lang }) }}>
      <main className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 py-8 sm:py-10">
        <Header
          range={rangeLabel(keys, state.lang)}
          months={months}
          theme={state.theme}
          onTheme={(theme) => patch({ theme })}
        />
        <BalanceInput
          balance={state.balance}
          startDate={state.startDate}
          endDate={keys[keys.length - 1]}
          months={months}
          onBalance={(balance) => patch({ balance })}
          onStartDate={(startDate) => patch({ startDate })}
          onEndDate={(end) => setMonths(monthDiff(state.startDate, end) + 1)}
          onMonths={setMonths}
          onAdvance={state.startDate < now ? advance : undefined}
        />
        <Summary data={data} />
        <ProjectionChart data={data} />
        <ItemEditor items={state.items} keys={keys} onChange={(items) => patch({ items })} />
        <ProjectionTable data={data} />
        <footer className="flex flex-col gap-3 pb-4 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-relaxed">{t.footer}</p>
          <div className="flex shrink-0 gap-2 self-start sm:self-auto">
            <button onClick={save} className={`${footBtn} hover:border-accent hover:text-accent`}>
              {t.export}
            </button>
            <button
              onClick={() => picker.current?.click()}
              className={`${footBtn} hover:border-accent hover:text-accent`}
            >
              {t.import}
            </button>
            <button
              onClick={() => confirm(t.resetConfirm) && setState(emptyState())}
              className={`${footBtn} hover:border-red hover:text-red`}
            >
              {t.reset}
            </button>
            <input
              ref={picker}
              type="file"
              accept="application/json,.json"
              onChange={load}
              className="hidden"
            />
          </div>
        </footer>
      </main>
    </LangContext.Provider>
  );
}
