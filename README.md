<div align="center">

# GRCentral

**Continuous Governance, Risk & Compliance — for companies that can't afford to drift.**

</div>

GRCentral watches every official regulatory source (EUR-Lex, EDPB, ENISA,
NIST, CISA, CERT-In, ICO, OWASP, CIS), detects changes at the article / ELI
level, maps them to your internal controls, quantifies a **Risk Drift Score**
over time, and recommends preventive actions with owners and SLAs.

> Pure HTML + CSS + vanilla JS. No build step. Open `index.html` directly,
> run `npm run dev` for a local server, or deploy the folder to Vercel —
> they all work.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [What's inside](#2-whats-inside)
3. [Product Owner view](#3-product-owner-view)
4. [Solution Architect view](#4-solution-architect-view)
5. [Risk Drift formula](#5-risk-drift-formula)
6. [How to add a new regulatory source](#6-how-to-add-a-new-regulatory-source)
7. [Tests](#7-tests)
8. [Push to GitHub](#8-push-to-github)
9. [Deploy to Vercel](#9-deploy-to-vercel)
10. [Roadmap](#10-roadmap)

---

## 1. Quick start

Three equivalent ways to run it:

```bash
# A. Just open the file (works because all deps are CDN)
start index.html        # Windows
open  index.html        # macOS

# B. Local dev server with no-cache headers (recommended)
npm run dev             # → http://localhost:8080
PORT=17080 npm run dev  # → http://localhost:17080

# C. Vercel preview (see section 9)
vercel dev
```

Requirements: Node 18+ (only for the dev server and tests — the app itself
needs nothing but a modern browser).

---

## 2. What's inside

```
grcentral/
├── index.html                  # app shell (sidebar + topbar + view container)
├── README.md
├── package.json                # dev/test scripts
├── vercel.json                 # Vercel deploy config
├── .gitignore
├── assets/
│   ├── css/styles.css          # black + babcom-orange theme, Montserrat
│   └── js/
│       ├── data.js             # mock dataset: 11 regs, 11 sources, 7 personas, etc.
│       ├── risk-engine.js      # the Risk Drift formula
│       ├── components.js       # reusable UI fragments
│       ├── views.js            # one renderer per route + Add-Source modal
│       └── app.js              # router + persona switcher + bootstrap
└── .tests/
    ├── server.js               # tiny no-cache static file server
    ├── e2e.js                  # 28-check end-to-end suite
    ├── ux-check.js             # 28-check UX-round suite
    ├── verifier-check.js       # 19-check Add-Source verifier suite
    └── http-check.js           # 10-check HTTP smoke test
```

**Tech:** Tailwind via CDN, Chart.js 4 via CDN, Lucide icons via CDN, Google
Fonts (Montserrat). No bundler, no transpiler, no `node_modules`.

**Stylistic theme:** pure black background, babcom-orange (`#ff5a1f`)
primary, Montserrat 300–900, subtle radial glow, glass-card surfaces.

**App routes:**

| Route                  | View                  | Highlights                                                                          |
|------------------------|-----------------------|-------------------------------------------------------------------------------------|
| `dashboard`            | Executive overview    | Drift gauge, KPI tiles, gradient trend chart, Risk-by-category donut, Risk Heatmap, Upcoming Reviews, Live Radar, Preventive Actions, Coverage matrix |
| `radar`                | Regulatory Radar      | Live timeline of detected changes, most-active regulations, source health           |
| `regulation/{id}`      | Regulation Detail     | CELEX / ELI metadata, **article-level diff** vs previous snapshot, drift breakdown |
| `drift`                | Risk Drift            | 90-day per-regulation trend, formula card, per-component breakdown table            |
| `gaps`                 | Compliance Gaps       | Risk register with severity / SLA                                                   |
| `actions`              | Preventive Actions    | Kanban (Planned / In progress / Done) with owners and effort                        |
| `controls`             | Controls Library      | Controls mapped to frameworks, with maturity and drift bars                         |
| `evidence`             | Evidence Vault        | Freshness tracking — feeds the Evidence-Aging factor of the formula                 |
| `sources`              | Regulatory Sources    | All 11 feeds with format, polling, ingestion, doc count + **Add source** flow      |
| `team`                 | Team                  | 7 personas: Aarav Mehta (CCO), Priya Sharma, Rohan Iyer, Ananya Reddy, Vikram Singh, Kavya Nair, Aditya Joshi |
| `about`                | About                 | Product brief, formula explainer, drift bands                                       |

---

## 3. Product Owner view

### Problem
A large EU-active enterprise must comply with GDPR, the AI Act
(Regulation 2024/1689), NIS2, DORA, DSA, DMA, eIDAS 2.0, EU Data Act and
the Cyber Resilience Act, plus parallel guidance from EDPB, ENISA, ICO,
NIST, CISA, CERT-In, OWASP and CIS. The texts change constantly through
delegated acts, RTS and advisories. Without automation, by the time anyone
notices, the company is already drifting out of compliance.

### Personas (Indian names)

| Name            | Role                          | Primary view              |
|-----------------|-------------------------------|---------------------------|
| Aarav Mehta     | Chief Compliance Officer      | Executive dashboard       |
| Priya Sharma    | Senior GRC Analyst            | Regulatory Radar          |
| Rohan Iyer      | Risk Manager                  | Risk Drift                |
| Ananya Reddy    | Data Protection Officer       | Compliance Gaps           |
| Vikram Singh    | CISO                          | Evidence Vault            |
| Kavya Nair      | Legal Counsel                 | Regulatory Radar          |
| Aditya Joshi    | Internal Audit Lead           | Evidence Vault            |

Switch personas using the avatar in the top-right.

### Core journeys

1. *"What changed in the AI Act this week?"* → Radar → CELEX 32024R1689 →
   article-level diff vs last snapshot → one-click mapping to controls →
   auto-created remediation tasks.
2. *"Is our risk getting better or worse?"* → Risk Drift → 90-day trend
   per regulation domain → board-ready breakdown.
3. *"Are we ready for the audit?"* → Evidence Vault → expiring evidence →
   renewal workflow.

### KPIs
- Time-to-detect regulatory change (< 24 h)
- Risk drift slope (negative = improving)
- Open compliance gaps by severity
- Evidence freshness %
- MTTR for high-severity gaps

---

## 4. Solution Architect view

### Ingestion strategy
Every source below is reachable today.

| Source                     | Formats                            | Mechanism                  |
|----------------------------|------------------------------------|----------------------------|
| EUR-Lex                    | Akoma Ntoso XML, HTML, PDF · CELEX + ELI | SPARQL + RSS daily delta |
| EDPB                       | HTML + PDF opinions                | RSS + scrape               |
| EC · Digital Strategy      | HTML                               | RSS + scrape               |
| ENISA                      | HTML + PDF                         | RSS + PDF parse            |
| GDPR.eu                    | HTML (interpretive)                | Scrape (informational)     |
| UK ICO                     | HTML + RSS                         | RSS                        |
| NIST CSRC                  | JSON Publications API              | REST                       |
| CISA                       | JSON advisory feed                 | REST                       |
| CERT-In                    | HTML + PDF advisories              | Scrape                     |
| OWASP                      | Git releases + PDFs                | Versioned HTTP             |
| CIS Benchmarks             | Versioned PDFs + JSON              | Versioned HTTP             |

### Change-detection
For each document we store `(identifier, version, contentHash,
articleHashes[])`. On each poll we recompute hashes. An article whose hash
changes is **modified**, new article IDs are **added**, missing ones are
**removed**. ELI versioning lets us trace e.g. AI Act Article 6 through
every consolidated version.

### Logical data model
`Regulation`, `Article`, `Change`, `Control`, `Policy`, `Evidence`,
`RiskItem`, `Action`, `Persona/User`, `BusinessUnit`, `SourceFeed`,
`DriftSnapshot(date, components, score)`.

### Production architecture (not built in this prototype)
- Polling workers per `SourceFeed` (Python + Celery / Temporal).
- Parsers: Akoma Ntoso XML, BeautifulSoup HTML, pdfplumber PDF.
- NLP: obligation extraction (spaCy + LLM), classification, control
  mapping via ISO 27001 / NIST CSF crosswalks.
- Storage: PostgreSQL + pgvector + TimescaleDB + S3-compatible object store.
- API: FastAPI + GraphQL.
- UI: this prototype is the IA blueprint for the Next.js / React build.
- Auth: SSO (SAML / OIDC), RBAC by persona.

---

## 5. Risk Drift formula

Implemented faithfully from spec in `assets/js/risk-engine.js`:

```
DriftScore = (
    0.30 · RegulationImpact
  + 0.25 · CoverageGap
  + 0.20 · ControlDrift
  + 0.10 · EvidenceAging
  + 0.10 · RemediationDelay
  + 0.05 · BusinessCriticality
) × TrendMultiplier
```

| Sub-score             | How it's derived                                                                |
|-----------------------|----------------------------------------------------------------------------------|
| RegulationImpact      | Peak severity of recent changes for this regulation + recency boost              |
| CoverageGap           | `100 − avg(linked control maturity)`                                            |
| ControlDrift          | `3.5 × avg(linked control drift %)`, capped to 100                              |
| EvidenceAging         | % of linked evidence missing or expiring within 30 days                          |
| RemediationDelay      | Severity-weighted share of overdue risks                                         |
| BusinessCriticality   | `max(criticality)` across exposed business units                                 |
| **TrendMultiplier**   | `clamp(1 + slope_30d / 100, 0.7, 1.5)` — least-squares slope of the last 30 days |

**Drift bands:**
`0–25` Stable · `26–50` Elevated · `51–75` High · `76–100` Critical

Enterprise rollup = `0.6 · mean + 0.4 · worst` across regulations.

---

## 6. How to add a new regulatory source

In the app: **Sources → Add source**. The flow is:

1. **Form** — Name, URL, Jurisdiction, Source type (6 options), Output
   format (8 options), Polling interval, Description.
2. **Verify source** — runs four animated steps:
   - Resolving DNS for *{host}*
   - Establishing TLS handshake
   - Fetching HEAD + sample (*{format}*)
   - Parsing structure & extracting documents
3. **Save source** — only enabled after successful verification.

The verifier is defensive by design:

- Trims input + strips zero-width / BOM / NBSP / control chars.
- Auto-prepends `https://` if no scheme is present.
- Distinguishes scheme (`javascript:alert(1)`) from host:port (`localhost:9000`).
- Rejects private / loopback addresses (`127.*`, `192.168.*`, `10.*`,
  `localhost`).
- Rejects hostnames without a TLD.
- Echoes the canonical URL back to the input so the user sees exactly what
  is being checked.

On save, the source is pushed into `DATA.sources` (live, in-memory) and
the grid re-renders with the new card.

---

## 7. Tests

The repo ships with four pure-Node test files. Run them all with:

```bash
npm test
```

Or individually:

| Command                              | Suite                  | Checks                                                                                          |
|--------------------------------------|------------------------|------------------------------------------------------------------------------------------------|
| `node .tests/e2e.js`                 | End-to-end             | Every JS module loads, dataset shape, Risk Drift formula, all 12 views render, chart mounting   |
| `node .tests/ux-check.js`            | UX round               | CIS healed, source enrichment, sources view CTA, chart beautification, Add-Source wiring        |
| `node .tests/verifier-check.js`      | Add-Source verifier    | URL canonicaliser, simulator accepts / rejects, canonical-URL propagation                       |
| `node .tests/http-check.js`          | HTTP smoke             | Every asset 200s with the right MIME, 404 path returns 404                                     |

Current state: **85 / 85 tests passing.**

---

## 8. Push to GitHub

The repo isn't initialised yet. From the project root:

```bash
# 1. Initialise + first commit
git init
git add .
git commit -m "GRCentral: initial prototype"

# 2. Create the GitHub repo (via gh CLI or website)
gh repo create grcentral --public --source . --remote origin --push

# OR if you created the repo on the website:
git branch -M main
git remote add origin https://github.com/<you>/grcentral.git
git push -u origin main
```

After that, `git push` deploys to Vercel automatically (see next section)
or stays as a normal GitHub repo.

---

## 9. Deploy to Vercel

GRCentral is 100% static — it deploys to Vercel with **zero build step**.

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel        # one-time global install
vercel login           # opens browser
vercel                 # first run: 'Set up & deploy' → accept defaults
vercel --prod          # promote to production
```

What Vercel will detect:
- **Framework Preset:** *Other* (static).
- **Build Command:** *(none)*.
- **Output Directory:** `.` (project root — `index.html` is at the root).
- **Install Command:** *(none)*.

The included `vercel.json` already configures:
- Correct MIME for `.js` and `.css`.
- Light caching (`max-age=300, must-revalidate`) for static assets.
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`).

### Option B — Vercel dashboard

1. Push to GitHub (section 8).
2. Go to **vercel.com → Add New → Project**.
3. Import the GitHub repo.
4. Framework Preset: **Other**, Build Command: *(empty)*, Output
   Directory: *(empty — defaults to project root)*.
5. Click **Deploy**.

Every subsequent `git push origin main` auto-deploys to production;
PR branches get preview URLs.

### Option C — drag and drop

vercel.com → **Add New → Project → Drop folder here** → drop the
`grcentral` folder. Done in 10 seconds, no Git needed.

### Custom domain

After the first deploy:

```bash
vercel domains add grcentral.babcom.example
```

Or in the dashboard: **Project → Settings → Domains → Add**.

### Verify the deploy

After deploy, hit `https://<your-project>.vercel.app/` — you should see
the splash, then the Dashboard with Aarav Mehta as the active persona.
Then verify:

```bash
curl -sI https://<your-project>.vercel.app/assets/js/views.js \
  | findstr /R "HTTP/ Content-Type Cache-Control"
```

You should see `200 OK`, `application/javascript; charset=utf-8`,
and `Cache-Control: public, max-age=300, must-revalidate`.

---

## 10. Roadmap

- Real EUR-Lex SPARQL connector + Akoma Ntoso XML parser
- LLM-assisted obligation extraction and auto-mapping to ISO 27001 / NIST CSF
- Multi-tenant + SSO (SAML / OIDC)
- Jira / ServiceNow / Slack action dispatch
- Board-ready PDF export
- Persistent storage for user-added sources (currently in-memory only)
- Real verification step that actually fetches the URL through a serverless function

---

<sub>Built as Product Owner, designed as Solution Architect, implemented as Engineer. All identifiers (CELEX, ELI, regulation titles) are real EU regulatory references; article texts are illustrative.</sub>
