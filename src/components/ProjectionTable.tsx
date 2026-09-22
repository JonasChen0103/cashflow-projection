import type { MonthProjection } from '../lib/types';
import { fmt, fmtMonth, fmtMonthYear } from '../lib/calc';
import { useLang } from '../i18n';

export function ProjectionTable({ data }: { data: MonthProjection[] }) {
  const { lang, t } = useLang();
  // 每一列都上綠/紅會變成一片色塊，反而看不出重點：只有負數值得警示
  const sign = (n: number) => (n < 0 ? 'text-red' : 'text-secondary');

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-medium text-secondary">{t.detail}</h2>
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-line/60">
        <table className="w-full min-w-[420px] text-right text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-line)]">
            <tr className="text-xs text-muted">
              <th className="px-3 py-2.5 text-left font-normal">{t.hMonth}</th>
              {/* 收支的身分改掛在表頭的色點上，內文就能維持中性色 */}
              <th className="px-3 py-2.5 font-normal">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-green align-middle" />
                {t.hIncome}
              </th>
              <th className="px-3 py-2.5 font-normal">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-red align-middle" />
                {t.hExpense}
              </th>
              <th className="px-3 py-2.5 font-normal">{t.hNet}</th>
              <th className="px-3 py-2.5 font-normal">{t.hBal}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m, i) => {
              // 只在第一列和換年的那一列重複年份，其餘只寫月份
              const newYear = i === 0 || m.month.slice(0, 4) !== data[i - 1].month.slice(0, 4);
              return (
                <tr
                  key={m.month}
                  className={`border-t border-line/40 hover:bg-hover ${newYear && i > 0 ? 'border-t-line' : ''}`}
                >
                  <td className="px-3 py-2 text-left text-secondary whitespace-nowrap">
                    {newYear ? fmtMonthYear(m.month, lang) : fmtMonth(m.month, lang)}
                  </td>
                  <td className="px-3 py-2 text-secondary">
                    {m.income ? fmt(m.income) : <span className="text-ghost">—</span>}
                  </td>
                  <td className="px-3 py-2 text-secondary">
                    {m.expense ? fmt(m.expense) : <span className="text-ghost">—</span>}
                  </td>
                  <td className={`px-3 py-2 ${sign(m.net)}`}>{fmt(m.net)}</td>
                  <td
                    className={`px-3 py-2 font-medium ${m.balance < 0 ? 'text-red' : 'text-primary'}`}
                  >
                    {fmt(m.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
