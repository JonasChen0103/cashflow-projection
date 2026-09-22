import type { MonthProjection } from '../lib/types';
import { fmt } from '../lib/calc';
import { useLang } from '../i18n';

export function ProjectionTable({ data }: { data: MonthProjection[] }) {
  const { t } = useLang();
  const sign = (n: number) => (n < 0 ? 'text-red' : n > 0 ? 'text-green' : 'text-dim');

  return (
    <section className="rounded-xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm text-muted">{t.detail}</h2>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[420px] text-right text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-2 text-left font-normal">{t.hMonth}</th>
              <th className="py-2 font-normal">{t.hIncome}</th>
              <th className="py-2 font-normal">{t.hExpense}</th>
              <th className="py-2 font-normal">{t.hNet}</th>
              <th className="py-2 font-normal">{t.hBal}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.month} className="border-b border-line/50 last:border-0 hover:bg-hover">
                <td className="py-2 text-left text-secondary">{m.month}</td>
                <td className="py-2 text-green">{m.income ? fmt(m.income) : '—'}</td>
                <td className="py-2 text-red">{m.expense ? fmt(m.expense) : '—'}</td>
                <td className={`py-2 ${sign(m.net)}`}>{fmt(m.net)}</td>
                <td className={`py-2 font-medium ${m.balance < 0 ? 'text-red' : 'text-primary'}`}>
                  {fmt(m.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
