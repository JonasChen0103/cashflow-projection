import { useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LangContext, dicts } from './i18n';
import { buildProjection, monthLabels, rangeLabel } from './lib/calc';
import { emptyState } from './lib/types';
import type { AppState } from './lib/types';
import { Header } from './components/Header';
import { BalanceInput } from './components/BalanceInput';
import { ItemEditor } from './components/ItemEditor/ItemEditor';
import { ProjectionChart } from './components/ProjectionChart';
import { ProjectionTable } from './components/ProjectionTable';

const KEY = 'cashflow-state';

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(KEY, emptyState);
  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  const labels = useMemo(
    () => monthLabels(state.startDate, state.lang),
    [state.startDate, state.lang],
  );
  const data = useMemo(
    () => buildProjection(state.balance, state.items, labels),
    [state.balance, state.items, labels],
  );

  const t = dicts[state.lang];

  return (
    <LangContext.Provider value={{ lang: state.lang, t, setLang: (lang) => patch({ lang }) }}>
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-8">
        <Header range={rangeLabel(state.startDate, state.lang)} />
        <BalanceInput
          balance={state.balance}
          startDate={state.startDate}
          onBalance={(balance) => patch({ balance })}
          onStartDate={(startDate) => patch({ startDate })}
        />
        <ItemEditor items={state.items} labels={labels} onChange={(items) => patch({ items })} />
        <ProjectionChart data={data} />
        <ProjectionTable data={data} />
        <footer className="flex items-center justify-between gap-4 pb-4 text-xs text-dim">
          <p>{t.footer}</p>
          <button
            onClick={() => confirm(t.resetConfirm) && setState(emptyState())}
            className="shrink-0 rounded-lg border border-line px-2.5 py-1 hover:border-red hover:text-red"
          >
            {t.reset}
          </button>
        </footer>
      </main>
    </LangContext.Provider>
  );
}
