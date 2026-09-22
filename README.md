# Cash Flow Projection

A personal cash flow projection tool. Track installments, income, and expenses
to visualize your monthly balance over a projection window you choose.

## Features

- Monthly cash flow projection with an interactive chart
- Custom projection length — anywhere from 1 to 480 months (default 12)
- Installments with APR, using standard amortization (PMT)
- Traditional Chinese / English toggle
- Data saved locally in your browser (localStorage)
- No backend, no tracking, fully private

## Getting Started

```bash
git clone https://github.com/<user>/cashflow-projection.git
cd cashflow-projection
npm install
npm run dev
```

Build for production: `npm run build` (output in `dist/`).
Deploying under a sub-path (e.g. GitHub Pages): `BASE_PATH=/cashflow-projection/ npm run build`.

## How It Works

- **Expenses** — enter the total principal and APR. Monthly payment is computed
  with standard amortization; set APR to `0` for interest-free installments.
- **Income** — enter the monthly amount and the months it applies to.
- **Chart** — projected balance over the window. Red dots mark negative balance.
- **Start month / Period** — set where the window begins and how many months it
  covers. Past 12 months, labels switch to `26/09` / `Sep 26` so years stay
  distinguishable. Shortening the window pulls any item that ran past the new
  end back to the last month.

## Tech Stack

React · TypeScript · Vite · Tailwind CSS · Recharts

## Tests

```bash
npm test
```

Asserts the amortization and projection math in `src/lib/calc.ts`.

## License

MIT
