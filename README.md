# Tax Rookie | Invoice Verify

**報稅菜鳥｜發票驗算工具**

A privacy-first invoice verification tool for accountants, bookkeepers, and finance teams. Paste or import invoice data, verify tax amounts instantly, and spot anomalies — all in your browser.

一款專為會計、記帳及財務人員設計的發票驗算工具。支援貼上或匯入 Excel，快速驗算大量發票並標示異常。所有資料只在瀏覽器本機處理。

**Live demo:** https://sandytai417.github.io/tax-rookie-invoice-verify/

---

## What it does

This is **not** an accounting system, ERP, or tax calculator.

It does one thing well:

> **Verify large volumes of invoice data and find anomalies quickly.**

---

## Features

- Excel-style editable data grid (keyboard-friendly)
- Paste from Excel, Google Sheets, ERP, or accounting software
- Excel import with manual column mapping (`.xlsx`, `.xls`)
- Configurable tax rate (default 5%)
- Tolerance mode: ±0, ±0.01, ±0.5, ±1, custom
- Real-time theoretical tax, difference, and status
- English / 繁體中文
- Light / Dark / Follow System
- **No backend · No database · No data upload · No AI**

---

## Privacy

All invoice data is processed locally in your browser.

- No server upload
- No data storage
- No history or cloud sync

---

## Quick start

```bash
npm install
npm run dev
```

Open: `http://localhost:3000/tax-rookie-invoice-verify/`

```bash
npm run build
```

---

## Deploy to GitHub Pages

1. Create a repository named **`tax-rookie-invoice-verify`** under **sandytai417**
2. Push to the `main` branch:

```bash
git add .
git commit -m "Initial release: Tax Rookie Invoice Verify"
git branch -M main
git remote add origin https://github.com/sandytai417/tax-rookie-invoice-verify.git
git push -u origin main
```

3. Go to **Settings → Pages → Build and deployment**
4. Select **GitHub Actions**
5. After deployment, your site will be available at:

   https://sandytai417.github.io/tax-rookie-invoice-verify/

---

## Tech stack

- Next.js (App Router, static export)
- TypeScript
- Tailwind CSS
- AG Grid
- SheetJS (`xlsx`)

---

## Product principles

- **Speed First** — reduce time to complete verification
- **Office First** — Excel / ERP-style workflow, not SaaS marketing UI
- **Privacy First** — local-only processing
- **Predictability First** — no AI, no auto-guessing, no auto-correction
- **Information Density** — show more data per screen
- **Keyboard First** — optimized for keyboard-heavy workflows
- **One Question Rule** — every feature must speed up verification

---

## License

MIT — see [LICENSE](LICENSE).
