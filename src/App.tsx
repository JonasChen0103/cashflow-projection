import { useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LangContext, dicts } from './i18n';
import { buildProjection, monthDiff, monthKeys, rangeLabel, reanchor } from './lib/calc';
import { clampMonths, emptyState, thisMonth } from './lib/types';
import type { AppState } from './lib/types';
import { Header } from './components/Header';
import { BalanceInput } from './components/BalanceInput';
import { ItemEditor } from './components/ItemEditor/ItemEditor';
import { Summary } from './components/Summary';
import { ProjectionChart } from './components/ProjectionChart';
import { ProjectionTable } from './components/ProjectionTable';

const KEY = 'cashflow-state';

/** v2: income `amount` means the total, not the per-month figure. */
const migrate = (s: AppState): AppState =>
  s.v === 2
    ? s
    : {
        ...s,
        v: 2,
        items: s.items.map((it) =>
          it.type === 'income'
            ? { ...it, amount: it.amount * (it.endMonth - it.startMonth + 1) }
            : it,
        ),
      };

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(KEY, emptyState, migrate);
  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const months = clampMonths(state.months);

  /** Shortening the window pulls items back, or their range selects point at months that no longer exist. */
  const setMonths = (n: number) => {
    const m = clampMonths(n);
    patch({
      months: m,
      items: state.items.map((it) => ({
        ...it,
        startMonth: Math.min(it.startMonth, m - 1),
        endMonth: Math.min(it.endMonth, m - 1),
      })),
    });
  };

  const now = thisMonth();
  const advance = () =>
    patch({ startDate: now, items: reanchor(state.items, state.startDate, now) });

  const keys = useMemo(() => monthKeys(state.startDate, months), [state.startDate, months]);
  const data = useMemo(
    () => buildProjection(state.balance, state.items, keys),
    [state.balance, state.items, keys],
  );

  const t = dicts[state.lang];

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
          <button
            onClick={() => confirm(t.resetConfirm) && setState(emptyState())}
            className="shrink-0 self-start rounded-lg border border-line px-2.5 py-1 transition-colors hover:border-red hover:text-red sm:self-auto"
          >
            {t.reset}
          </button>
        </footer>
      </main>
    </LangContext.Provider>
  );
}
