# European Match & Knockout Ledger — 2026/27 UEFA Champions League

An independent sports editorial web application for the **2026/27 UEFA Champions League** (`CL`) season. The primary landing view displays verified Champions League matches and results (including `LEAGUE_STAGE` fixtures) grouped by calendar date in **Egypt time (`Africa/Cairo`)**, while a dedicated **Knockout** tab in the fixed bottom navigation opens the Round of 16 through Final bracket and central trophy view on demand.

> **Independent Project Notice & Asset Policy:** This project is not affiliated with, sponsored by, or endorsed by UEFA. Although the `football-data.org` payload includes `crest` URLs, API data access does not license third-party club graphics; external club logos are suppressed by `CLUB_CREST_POLICY` (`allowExternalCrests: false`) unless a permitted, licensed origin is explicitly allowlisted, with geometric monograms used as safe fallbacks. The trophy artwork is an original SVG vector illustration authored for this project.

---

## Architecture & Scope

- **Static Frontend:** React, TypeScript, Vite, and Tailwind CSS deployed as static assets (no runtime Node.js server required on GitHub Pages).
- **Primary Landing & On-Demand Bracket:**
  - **Matches (Default Landing):** Groups all verified `2026/27` Champions League fixtures (`LEAGUE_STAGE`, `PLAYOFFS`, and knockout rounds) chronologically by calendar date with Stage, Matchday, Status, and Team Search filters.
  - **Knockout (Bottom-Nav Trophy Tab):** Opened on demand via the fixed bottom navigation (`Matches` / `Knockout`); preserves the inward-flowing bracket and central twin-handled trophy illustration.
- **Competition Scope Guard:** Strictly validates `competition.code === "CL"` and `seasonStartYear === 2026`. Standings tables and other competitions are never fetched or silently added. Knockout bracket ties (`R16` through `Final`) are derived exclusively from `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, and `FINAL` fixtures—never invented from League Stage teams.
- **Egypt Time Default:** Kickoffs default to **Egypt time (`Africa/Cairo`)** using daylight-saving-aware `Intl.DateTimeFormat` conversion, with an optional toggle to viewer local time.
- **Delayed Hourly Updates:** The scheduled GitHub Actions workflow (`.github/workflows/refresh-and-deploy.yml`) runs `scripts/refresh-data.ts` hourly at minute `17` UTC (`17 * * * *`), validates the `football-data.org` v4 response, normalizes all `CL` season matches and knockout ties, builds the static site, and deploys the artifact to GitHub Pages.

### Free-Tier & GitHub Actions Limitations

- **Delayed Data:** `football-data.org`'s free plan supplies delayed schedules and scores. Instantaneous live goal-by-goal updates or guaranteed post-match deadlines are **not** promised.
- **GitHub Actions Schedule Caveats:** Scheduled `cron` workflows may be delayed or skipped during high GitHub Actions load, and GitHub automatically disables scheduled workflows in repositories with no push activity for 60 days.
- **Failure Retention:** If a refresh fails or returns an invalid/mismatched season payload, `scripts/refresh-data.ts` preserves the last valid `public/data/knockout-snapshot.json` rather than overwriting valid data with empty results. Likewise, the frontend retains its last valid snapshot in memory if a background recheck fails.

---

## Setup & Deployment Prerequisites

### 1. Required Repository Secret

Configure the following secret in **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Purpose |
| --- | --- |
| `FOOTBALL_DATA_API_TOKEN` | Server-side API token for `https://api.football-data.org/v4` (`X-Auth-Token` header). |

Never prefix this token with `VITE_` or commit it into `.env`, source files, or workflow logs.

### 2. GitHub Pages Configuration

1. In your GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. The workflow automatically sets `VITE_BASE_PATH=/<repository-name>/` during `npm run build` so assets and `data/knockout-snapshot.json` resolve under project subpaths.

### 3. Local Development & Testing

```bash
npm install
npm run lint
npm test
npm run dev
```

To run the data refresh script locally (never commit real tokens):

```bash
FOOTBALL_DATA_API_TOKEN="<your-token>" npm run refresh-data
```

---

## Failure Recovery & Manual Refresh

1. Open the **Actions** tab in your GitHub repository.
2. Select **Refresh Knockout Snapshot and Deploy Pages**.
3. If the workflow was disabled due to repository inactivity, click **Enable workflow**.
4. Click **Run workflow** (`workflow_dispatch`). Set `strict_refresh` to `true` if you want the job to fail visibly on any provider/validation error.

---

## Changing Seasons or Update Cadence

- **Season:** Update `seasonStartYear` and `seasonLabel` in `src/config/competition.ts` (currently `2026` and `'2026/27'`), and regenerate the baseline empty snapshot before the draw.
- **Cadence:** Edit the `cron` expression in `.github/workflows/refresh-and-deploy.yml` (default `'17 * * * *'`) and keep `COMPETITION_CONFIG.refreshCadenceMinutes` / `refreshScheduleDescription` in sync.

---

## Attribution

Competition data adapter built for [football-data.org](https://www.football-data.org/) (v4 API).
