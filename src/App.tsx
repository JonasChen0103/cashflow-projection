import { useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LangContext, dicts } from './i18n';
import { buildProjection, monthKeys, rangeLabel } from './lib/calc';
import { clampMonths, emptyState } from './lib/types';
import type { AppState } from './lib/types';
import { Header } from './components/Header';
import { BalanceInput } from './components/BalanceInput';
import { ItemEditor } from './components/ItemEditor/ItemEditor';
import { Summary } from './components/Summary';
import { ProjectionChart } from './components/ProjectionChart';
import { ProjectionTable } from './components/ProjectionTable';

const KEY = 'cashflow-state';

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(KEY, emptyState);
  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  // 舊的 localStorage 資料沒有 months，讀進來一律夾在合法範圍內
  const months = clampMonths(state.months);

  /** 縮短期間時，超出範圍的項目跟著收尾，否則起迄選單會停在不存在的月份 */
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

  const keys = useMemo(() => monthKeys(state.startDate, months), [state.startDate, months]);
  const data = useMemo(
    () => buildProjection(state.balance, state.items, keys),
    [state.balance, state.items, keys],
  );

  const t = dicts[state.lang];

  return (
    <LangContext.Provider value={{ lang: state.lang, t, setLang: (lang) => patch({ lang }) }}>
      <main className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 py-8 sm:py-10">
        <Header range={rangeLabel(keys, state.lang)} />
        <BalanceInput
          balance={state.balance}
          startDate={state.startDate}
          months={months}
          onBalance={(balance) => patch({ balance })}
          onStartDate={(startDate) => patch({ startDate })}
          onMonths={setMonths}
        />
        <ItemEditor items={state.items} keys={keys} onChange={(items) => patch({ items })} />
        <Summary data={data} />
        <ProjectionChart data={data} />
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
