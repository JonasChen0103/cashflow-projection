# 💰 Cash Flow Projection

A personal cash flow projection tool. Track installments, income, and expenses
to visualize your monthly balance over the next 12 months.

## Features

- Monthly cash flow projection with an interactive chart
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
- **Chart** — projected balance over 12 months. Red dots mark negative balance.
- **Start month** — shifts the whole 12-month window; month labels follow it.

## Tech Stack

React · TypeScript · Vite · Tailwind CSS · Recharts

## Tests

```bash
npm test
```

Asserts the amortization and projection math in `src/lib/calc.ts`.

## License

MIT
