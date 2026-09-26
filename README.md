# Cash Flow Projection

Plan your money month by month. Enter your balance, add your income and
installments, and see where the line goes — for the next year, or the next
fifty.

**[English](#english) · [繁體中文](#繁體中文)**

**Live:** https://cashflow.jonasblue.me · **Source:** https://github.com/JonasChen0103/cashflow-projection

---

## English

### Why

Most budgeting apps ask you to categorise the past. This one only cares about
the future: what you have now, what is coming in, what is going out, and
whether the balance ever dips below zero before it recovers.

It runs entirely in your browser. There is no account, no server, and nothing
leaves your device.

### Features

- **Month-by-month projection** — an interactive balance chart plus a full
  monthly breakdown table
- **Any window from 1 to 600 months** — set a start month and either an end
  month or a number of months; the other follows
- **Installments with APR** — standard amortization (PMT), so a 24-month loan
  at 3.75% shows the real monthly payment and the total interest
- **Total ⇄ Monthly** — fill in whichever you know; the other is derived
- **Lock total or monthly** — each row picks which of the two holds when its
  length changes: the total for an installment plan, the monthly for rent or a salary
- **Periods box** — type a length next to an item's range instead of counting
  months in the dropdown
- **One-time amounts** — collapse any item to a single month with the `1×` toggle
- **Drag to reorder** — works with a mouse and with touch, auto-scrolling near
  the edges
- **Traditional Chinese / English**, and **dark / light** themes
- **Local-only storage** — no backend, no accounts, no analytics, no cookies
- **Export and import** — save everything to a JSON file and load it back on
  another browser or device

### Getting started

Requires Node.js 20 or newer.

```bash
git clone https://github.com/JonasChen0103/cashflow-projection.git
cd cashflow-projection
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the projection and amortization assertions |

### Deployment

The build output is plain static files — any static host will do.

```bash
npm run build          # -> dist/
```

Deploying under a sub-path (GitHub Pages project sites, for example) needs the
base path at build time:

```bash
BASE_PATH=/cashflow-projection/ npm run build
```

The production build injects a `Content-Security-Policy` meta tag. If your host
lets you set HTTP headers, add `frame-ancestors 'none'` and HSTS there as well —
those two directives are ignored when they come from a meta tag.

### How it works

- **Total ⇄ Monthly** — every item stores a total. The monthly figure is derived
  from it and the number of months, and typing into the monthly field converts
  back. Expenses also take an APR, so the pair converts with standard
  amortization; set APR to `0` for interest-free installments.
- **Lock** — a row's length can change four ways: either month dropdown, the
  periods box beside them, and `1×`. Since an item stores a total, that moves the
  monthly figure — right for a 24-month loan, wrong for rent, where the monthly is
  the fixed fact. The `Tot`/`Mo` button on each row says which side holds; on `Mo`
  the total is respread instead. It is saved and exported with the item, and every
  row edit funnels through one function, so all four resizes agree.
- **One-time amounts** — the `1×` toggle on an item's range collapses it to a
  single month (a bonus, a scholarship, a one-off purchase).
- **Window** — set the start month, then give either an end month or a number of
  months; the other follows. Both use a built-in picker (a year stepper plus a
  12-month grid) rather than `<input type="month">`, whose popup is browser
  chrome that CSS cannot reach. The end picker greys out any month before the
  start, and shortening the window pulls any item that ran past the new end back
  to the last month.
- **Jump to this month** — when your window starts in the past, a link next to
  the start month moves it to the current month. Items keep the calendar months
  they had, and anything that already finished drops off.
- **Chart** — projected balance over the window. Red dots mark months where the
  balance goes negative. The x-axis thins to about 12 ticks however long the
  window is, and prints the year on a second line only when it changes.
- **Items** — each tab is a table with a header row naming every column. Cells
  stay borderless until you hover or focus them; amounts are right-aligned in
  IBM Plex Mono so the digits line up. Past six items, a `Scroll` toggle caps the
  list height to a row count you choose.

### Your data

Everything lives in your browser's `localStorage`, under a single key
(`cashflow-state`) holding one JSON object: your balance, your items, and your
language, theme and window settings. Projections are recomputed on the fly and
never stored.

- **It is written on every change** and read back when the page loads. Missing
  fields fall back to defaults; unreadable data resets to an empty state rather
  than breaking the page.
- **It is tiny.** Fifty items with full Chinese names come to roughly 8 KB —
  about 0.2% of the ~5 MB a browser gives each site, phones included.
- **It is per-browser.** There is no sync. Switching browser, device or profile
  means starting fresh unless you carry a file across. Clearing site data, or
  using a private window and closing it, removes it.
- **It never leaves your device.** The app makes no network requests of its own.

**Back it up.** `Export` in the footer writes the whole state to
`cashflow-YYYY-MM.json`; `Import` reads one back, replacing what is saved after
a confirmation. Every field is re-validated on the way in, so a truncated or
hand-edited file falls back to defaults instead of corrupting the app, and files
written by older versions are migrated.

This matters more than it looks on iOS. Safari deletes all script-writable
storage — localStorage included — for sites you have not visited in seven days.
A tool you open once a month is squarely in range. Adding the site to your home
screen avoids it; so does keeping an exported file.

`Clear all` in the footer wipes the key and starts over.

### Privacy and security

- No backend, no accounts, no cookies, no analytics, no telemetry
- No `eval`, no `innerHTML`, no user content rendered as markup. An item name
  only ever reaches an `<input value>`, so a script payload in a file is inert
- An imported file is treated as hostile input: it is refused above 2 MB or
  1,000 items, every field is validated and clamped to a range the maths cannot
  overflow, and keys are read one by one into a fresh object, so a `__proto__`
  in the JSON does nothing
- The production build ships a strict Content Security Policy: scripts may only
  load from the site's own origin
- The two pinned jsDelivr font stylesheets carry Subresource Integrity hashes.
  Google Fonts cannot take one, since its CSS varies by browser — self-host the
  fonts if you want to remove that dependency entirely.

### Tech stack

React · TypeScript · Vite · Tailwind CSS · Recharts

Fonts are Archivo Black for the title, IBM Plex Sans and Mono for UI and amounts,
and LXGW WenKai TC for Chinese — from the `lxgw-wenkai-tc-webfont` package on
jsDelivr, split into 97 `unicode-range` woff2 chunks of roughly 7 KB, rather than
Google's unsubsetted 13 MB TTF per weight.

### Tests

```bash
npm test
```

Plain `node:assert` over the pure functions in `src/lib/calc.ts` — amortization
both ways, projection totals, month arithmetic, reordering, re-anchoring and
axis tick thinning. No test framework.

### Contributing

Issues and pull requests are welcome. Please run `npm test` and `npm run build`
before opening a PR, and keep comments in English.

### License

MIT — see [LICENSE](LICENSE).

---

## 繁體中文

### 創作緣由

大部分記帳 App 都在請你把「過去」分類。這個工具只關心未來：你現在有多少、
之後會進來多少、會出去多少，以及結餘會不會在某個月掉到負的再爬回來。

整個工具跑在你的瀏覽器裡。不用註冊、沒有伺服器，資料不會離開你的裝置。

### 功能

- **逐月預測** —— 互動式結餘走勢圖，加上完整的逐月明細表
- **1 到 600 個月的任意區間** —— 設好起始月份，再給結束月份或月數，另一個會自動跟上
- **含利率的分期** —— 標準攤還公式（PMT），所以 24 期、年利率 3.75% 會算出真正的月繳金額與總利息
- **總額 ⇄ 月付** —— 你知道哪個就填哪個，另一個自動換算
- **固定總額或月付** —— 每筆項目自己決定期數變動時固定哪一邊：分期帳單固定總額，房租或薪水固定月付
- **期數欄** —— 在項目期間旁邊直接輸入月數，不用在下拉選單裡數月份
- **一次性金額** —— 用 `1×` 開關把任何項目縮成單一月份
- **拖曳排序** —— 滑鼠和觸控都可以，拖到邊緣會自動捲動
- **繁體中文／English**，以及**深色／淺色**佈景
- **純本機儲存** —— 沒有後端、沒有帳號、沒有分析追蹤、沒有 cookie
- **匯出與匯入** —— 把所有資料存成 JSON 檔，在別的瀏覽器或裝置讀回來

### 開始使用

需要 Node.js 20 以上。

```bash
git clone https://github.com/JonasChen0103/cashflow-projection.git
cd cashflow-projection
npm install
npm run dev
```

| 指令 | 功能 |
| --- | --- |
| `npm run dev` | 開發伺服器，支援熱更新 |
| `npm run build` | 型別檢查並建置到 `dist/` |
| `npm run preview` | 在本機預覽正式版建置結果 |
| `npm test` | 執行預測與攤還的計算驗證 |

### 部署

建置產物就是一般的靜態檔案，任何靜態主機都可以。

```bash
npm run build          # -> dist/
```

若要部署在子路徑底下（例如 GitHub Pages 的專案頁），建置時要指定 base path：

```bash
BASE_PATH=/cashflow-projection/ npm run build
```

正式版建置會自動插入 `Content-Security-Policy` meta 標籤。如果你的主機可以自訂
HTTP header，建議另外在 header 加上 `frame-ancestors 'none'` 和 HSTS —— 這兩個
指令寫在 meta 標籤裡是無效的。

### 運作方式

- **總額 ⇄ 月付** —— 每個項目存的是總額，月付由總額和月數推算；在月付欄位輸入
  則會反推回總額。支出還可以填年利率，換算時採用標準攤還公式；利率填 `0`
  就是無息分期。
- **固定** —— 一筆項目的期數有四種改法：兩個月份下拉選單、旁邊的期數欄，以及
  `1×`。因為項目存的是總額，改期數就會動到月付金額 —— 24 期的貸款本來就該這樣，
  房租卻不該，因為房租的月付才是固定的事實。每一列的 `總`／`月` 按鈕決定固定
  哪一邊；選 `月` 時改成重算總額。這個設定會和項目一起儲存、匯出，而且所有列的
  編輯都走同一個函式，所以四種改法行為一致。
- **一次性金額** —— 項目期間上的 `1×` 開關會把它縮成單一月份（獎金、獎學金、
  一次性的採購）。
- **區間** —— 設好起始月份，再給結束月份或月數，另一個會跟著算。兩個都用內建的
  選擇器（年份切換加 12 個月的格狀選單），而不是 `<input type="month">` ——
  後者的彈出視窗是瀏覽器自己的介面，CSS 碰不到。結束月份的選擇器會把早於起始
  月份的選項變灰；把區間縮短時，超出新結束月份的項目會被拉回最後一個月。
- **更新至當月** —— 當你的區間從過去開始時，起始月份旁邊會出現一個連結，把它
  推進到當月。項目會保留原本的日曆月份，已經結束的項目則會自動移除。
- **走勢圖** —— 整個區間的結餘預測。紅點標出結餘轉負的月份。不管區間多長，
  X 軸都會縮減到大約 12 個刻度，而且只有在年份改變時才在第二行印出年份。
- **項目清單** —— 每個分頁都是一張表格，標題列標明每一欄。儲存格平常沒有框線，
  滑過或聚焦時才顯示；金額靠右對齊並使用 IBM Plex Mono，數字會對齊。超過六筆
  之後會出現 `捲動` 開關，可以把清單高度固定成你指定的筆數。

### 你的資料

所有東西都存在瀏覽器的 `localStorage`，只用一個 key（`cashflow-state`），裡面是
一個 JSON 物件：你的存款、項目，以及語言、佈景和區間設定。預測結果是即時算出來
的，不會被儲存。

- **每次變動就寫入**，開啟頁面時讀回。缺少的欄位會用預設值補上；資料無法讀取時
  會退回空白狀態，而不是讓頁面壞掉。
- **非常小。** 五十筆帶完整中文名稱的項目大約只有 8 KB —— 約佔瀏覽器給每個網站
  的 5 MB 空間的 0.2%，手機上也一樣。
- **綁在單一瀏覽器。** 沒有同步功能。換瀏覽器、換裝置、換 profile 都要重新輸入，
  除非你自己帶一個檔案過去。清除網站資料，或用無痕視窗然後關掉，資料就沒了。
- **不會離開你的裝置。** 這個 App 本身不發出任何網路請求。

**記得備份。** 頁尾的 `匯出` 會把完整狀態寫成 `cashflow-YYYY-MM.json`；`匯入`
則是讀回來，確認之後覆蓋目前的資料。每個欄位在讀入時都會重新驗證，所以檔案被截斷
或手動改壞時只會退回預設值，不會讓程式壞掉，舊版本寫出的檔案也會自動轉換。

這件事在 iOS 上特別重要：Safari 會把你**連續七天沒有造訪**的網站的所有
script 可寫入儲存空間刪掉，localStorage 也在內。一個月才開一次的工具正好踩在
這個規則上。把網站加到主畫面可以避開，平常留一份匯出的檔案也可以。

頁尾的 `清除全部` 會刪掉這個 key，一切重來。

### 隱私與安全

- 沒有後端、沒有帳號、沒有 cookie、沒有分析追蹤、沒有遙測
- 沒有 `eval`、沒有 `innerHTML`，使用者輸入的內容不會被當成標記語言渲染。項目名稱
  只會進到 `<input value>`，所以檔案裡夾帶的指令碼不會被執行
- 匯入的檔案一律當成惡意輸入處理：超過 2 MB 或 1,000 筆項目直接拒絕，每個欄位都
  經過驗證並夾在計算不會溢位的範圍內，而且是逐一讀取欄位組成全新物件，所以 JSON
  裡的 `__proto__` 不會有任何作用
- 正式版建置帶有嚴格的 Content Security Policy：指令碼只能從網站自己的來源載入
- 兩支釘選版本的 jsDelivr 字型樣式表都帶有 Subresource Integrity 雜湊。Google
  Fonts 無法使用 SRI，因為它的 CSS 會依瀏覽器而異 —— 如果想徹底移除這個外部
  相依，可以改成自行架設字型。

### 技術

React · TypeScript · Vite · Tailwind CSS · Recharts

字體是標題用 Archivo Black，介面與金額用 IBM Plex Sans／Mono，中文用霞鶩文楷 TC
—— 來自 jsDelivr 上的 `lxgw-wenkai-tc-webfont` 套件，切成 97 個以 `unicode-range`
區分、每塊約 7 KB 的 woff2 分塊，而不是 Google 每個字重一個未切分的 13 MB TTF。

### 測試

```bash
npm test
```

用原生 `node:assert` 驗證 `src/lib/calc.ts` 裡的純函式 —— 雙向的攤還計算、預測
總額、月份運算、排序、區間重新對齊，以及座標軸刻度的縮減。沒有使用任何測試框架。

### 參與貢獻

歡迎開 issue 和 pull request。送出 PR 前請先跑過 `npm test` 和 `npm run build`，
並且註解請用英文撰寫。

### 授權

MIT —— 詳見 [LICENSE](LICENSE)。
