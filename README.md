<div align="center">

# GRCentral

**GRC platform for EU-active companies: tracks regulations, scores risk drift, surfaces the policy section that needs to change.**

</div>

GRCentral polls the official regulatory sources we care about (EUR-Lex,
EDPB, ENISA, NIST, CISA, CERT-In, ICO, OWASP, CIS), detects changes at the
article / ELI level, maps them to your **internal policies** and
**technical controls**, computes a weighted **Risk Drift Score** over time,
and creates the preventive action with an owner and an SLA.

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
7. [Internal Policies & uploads](#7-internal-policies--uploads)
8. [Real-time activity engine](#8-real-time-activity-engine)
9. [Tests](#9-tests)
10. [Push to GitHub](#10-push-to-github)
11. [Deploy to Vercel](#11-deploy-to-vercel)
12. [Roadmap](#12-roadmap)

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

Requirements: Node 18+ (only for the dev server and tests: the app itself
needs nothing but a modern browser).

---

## 2. What's inside

```
grcentral/
├── index.html                  # app shell (sidebar + topbar + view container)
├── README.md
├── package.json                # dev/test scripts + @vercel/blob dependency
├── vercel.json                 # Vercel deploy config + security headers + CSP
├── .gitignore
├── api/
│   ├── _lib/storage.js         # thin wrapper over @vercel/blob (put/list/del +
│   │                           #   validation, 4 MB cap, MIME allow-list)
│   ├── policies.js             # /api/policies — GET (list) + POST (upload)
│   └── policies/[id].js        # /api/policies/<id> — GET (one) + DELETE
├── assets/
│   ├── css/styles.css          # black + babcom-orange theme, Montserrat
│   ├── img/babcom-logo.png     # babcom wordmark (sidebar + splash)
│   └── js/
│       ├── data.js             # mock dataset + localStorage helpers +
│       │                       #   serverPolicies cache + framework controls +
│       │                       #   policy analyzer + compliance scanner
│       ├── cloud-policies.js   # /api/policies client adapter (feature-detect,
│       │                       #   single-flight ping, list/upload/delete)
│       ├── risk-engine.js      # the Risk Drift formula
│       ├── components.js       # reusable UI fragments + htmlEscape / safeUrl
│       ├── live.js             # realtime engine: clock, activity ticker,
│       │                       #   weighted source-event table, hot-event
│       │                       #   injection into DATA.changes, DOM sweep
│       ├── views.js            # one renderer per route + Add-Source modal +
│       │                       #   Upload-Policy modal + Policy-Picker modal
│       └── app.js              # router + persona switcher + bootstrap +
│                               #   Live.start() + cloud hydration on load
└── .tests/
    ├── server.js               # tiny no-cache static file server (dev)
    ├── e2e.js                  # 30-check end-to-end suite
    ├── ux-check.js             # 28-check UX-round suite
    ├── verifier-check.js       # 19-check Add-Source verifier suite
    ├── security-check.js       # 45-check XSS + headers suite
    ├── policies-check.js       # 184-check policies + viewer + analyzer +
    │                           #   framework controls + compliance scan suite
    ├── live-check.js           # 46-check realtime-engine suite
    ├── cloud-check.js          # 57-check Vercel Blob adapter + API handlers
    └── http-check.js           # 12-check HTTP smoke test
```

**Tech:** Tailwind via CDN, Chart.js 4 via CDN, Lucide icons via CDN, Google
Fonts (Montserrat). No bundler, no transpiler, no `node_modules`.

**Stylistic theme:** pure black background, babcom-orange (`#ff5a1f`)
primary, Montserrat 300–900, subtle radial glow, glass-card surfaces.

**App routes:**

| Route                  | View                  | Highlights                                                                          |
|------------------------|-----------------------|-------------------------------------------------------------------------------------|
| `dashboard`            | Executive overview    | Drift gauge, **clickable KPI tiles** (Open Risks → Gaps, Critical → Gaps, Aged Evidence → Evidence, Reg. changes → Radar), gradient trend chart, Risk-by-category donut, Risk Heatmap, Upcoming Reviews, Live Radar, Preventive Actions, Coverage matrix |
| `radar`                | Regulatory Radar      | Live timeline of detected changes, most-active regulations, source health           |
| `regulation/{id}`      | Regulation Detail     | CELEX / ELI metadata, **article-level diff** vs previous snapshot, drift breakdown |
| `drift`                | Risk Drift            | 90-day per-regulation trend, formula card, per-component breakdown table            |
| `gaps`                 | Compliance Gaps       | Risks grouped **by policy** with **Framework** and **Framework control** columns; per-framework filter chips; "Coverage" CTA per group |
| `actions`              | Preventive Actions    | Kanban (Planned / In progress / Done) with owners and effort                        |
| `controls`             | Controls              | **Framework controls** (clauses of every regulation) grouped by framework with cross-policy coverage, **plus** operational controls library with **Linked policy** chip per card |
| `policies`             | Internal Policies     | 6 seeded policies + **Upload policy** flow (PDF/MD/HTML/TXT). Uploads land on **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set (4 MB cap, visible to every visitor) or fall back to `localStorage` (3 MB, this browser only); a banner tells you which mode is live |
| `evidence`             | Evidence Vault        | Audit trail with **Policy + Framework control + Section / snippet** columns; auto-derived from compliant scans; feeds the Evidence-Aging factor |
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
`Regulation` (a.k.a. **framework**), `Article`, `Change`,
**`FrameworkControl`** (a specific clause of a framework — e.g. GDPR
Art. 32, AI Act Annex III, DORA Art. 28 — with `keywords[]` + `severity`),
`Control` (operational / technical), **`InternalPolicy`** (seeded or
user-uploaded, with `mapsToRegulations[]` + `implementedByControls[]`),
`ControlPolicyMap(controlId → policyId)` (user overrides), `Evidence`
(now with `policyId`, `frameworkControlId`, `policySectionRef`,
`snippet`), `RiskItem` (now with `frameworkControlId`, `sourcePolicyId`,
`gapType ∈ {missing, partial}`), `Action`, `Persona/User`,
`BusinessUnit`, `SourceFeed`, `DriftSnapshot(date, components, score)`.

The chain reads top-down:

```
Framework (GDPR)
 └─ Framework control (Art. 32 — Security of processing)
     └─ Internal policy (Encryption Standard v4.1)
         └─ Policy section (§3 — Encryption at rest)
             └─ Operational control (C-DP-014)
                 └─ Evidence (KMS key rotation log)
```

When an internal policy doesn't cover a framework control, that is a
**compliance gap** — exactly what the Compliance Gaps page now shows,
attributed to the originating policy, framework and clause.

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
| **TrendMultiplier**   | `clamp(1 + slope_30d / 100, 0.7, 1.5)`: least-squares slope of the last 30 days |

**Drift bands:**
`0–25` Stable · `26–50` Elevated · `51–75` High · `76–100` Critical

Enterprise rollup = `0.6 · mean + 0.4 · worst` across regulations.

---

## 6. How to add a new regulatory source

In the app: **Sources → Add source**. The flow is:

1. **Form**: Name, URL, Jurisdiction, Source type (6 options), Output
   format (8 options), Polling interval, Description.
2. **Verify source**: runs four animated steps:
   - Resolving DNS for *{host}*
   - Establishing TLS handshake
   - Fetching HEAD + sample (*{format}*)
   - Parsing structure & extracting documents
3. **Save source**: only enabled after successful verification.

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

## 7. Internal Policies & uploads

GRCentral models **internal policies** as a first-class entity: the bridge
between an external regulation ("GDPR Article 32") and a technical control
("encryption at rest on prod datastores"). The app ships with 6 realistic
seeded policies and lets users add more by uploading a file.

### Seeded policies

| Policy                                  | Status     | Maps to                                  | Owner          |
|-----------------------------------------|------------|------------------------------------------|----------------|
| Data Protection Policy v3.2             | Published  | GDPR, EDPB Op. 4/2026                   | Ananya Reddy   |
| Acceptable Use Policy v2.4              | Published  | *(org-wide)*                            | Vikram Singh   |
| Encryption Standard v4.1                | Published  | GDPR Art.32, EDPB Op. 4/2026, NIS2      | Vikram Singh   |
| Responsible AI Use Policy v1.3          | Published  | AI Act (Art. 5, 9, 10, 53)              | Priya Sharma   |
| Incident Response Plan v5.0             | Published  | NIS2, DORA, CERT-In                     | Vikram Singh   |
| Third-Party Risk Management Policy v2.1 | **Draft**  | DORA, NIS2, CRA                         | Rohan Iyer     |

### The Policies view (`/policies`)

- **KPI strip:** total · due in ≤90 days · overdue · attestation completion %.
- **Filters:** status (`all` / `published` / `draft` / `retired`) and source
  (`all` / `seeded` / `uploaded`).
- **Cards** show: status badge, format pill, owner + approver, regulations
  covered, controls implementing it, review-due chip, attestation %,
  a `View` button (opens the in-app viewer: see below), an `Open` button
  (new tab), and `Delete` for uploaded policies.

### View a policy (in-app viewer)

`Views.openPolicyViewer(policyId, opts)` opens a modal with:

- **Header**: title, version, status badge, source badge, format pill.
- **Meta tiles**: owner, approver, effective date, next-review date.
- **Mapped chips**: every regulation and control linked to the policy.
- **Body**, format-dependent:
  - **PDF (uploaded)**: rendered in an `<iframe>` from a `blob:` URL on
    the app's own origin. We sniff the first bytes for the `%PDF-` magic
    header; non-PDF uploads short-circuit to a clear "not a valid PDF"
    warning. An "Open in new tab" CTA sits above the preview so the user
    can always fall back to their browser's standalone viewer.
  - **Markdown (uploaded)**: tokenised and rendered with a *tiny* in-house
    Markdown helper (`_renderMarkdown`). The source is HTML-escaped
    **first**, then a small set of tokens (headings, lists, bold, italic,
    code, paragraphs) is unwrapped: there is no path for raw HTML in a
    `.md` file to reach the DOM as executable markup.
  - **HTML / TXT (uploaded)**: shown inside `<pre>` as escaped text. We
    do not render uploaded HTML.
  - **Seeded policy (no attached file)**: the policy's `sections[]` array
    is rendered as a clean reading view with `§` numbering. Callers can
    pass `opts.highlightSectionId` to scroll-to and flag a specific
    section (useful when an action like "revise §3 for Article 6
    amendment" deep-links into the viewer).
- **Footer**: filename + size, "Open in new tab" (uses `Views.openPolicyDocument()`),
  Done.

The blob URLs created by the viewer are tracked and revoked when the
modal closes, so we never keep object references open.

### Upload a new policy

**Policies → Upload policy**. The modal accepts:

| Field                | Required | Notes                                                      |
|----------------------|:--------:|------------------------------------------------------------|
| File                 |    ◑    | PDF · Markdown · HTML · TXT, ≤ 3 MB (or use external URL) |
| Title                |    ✓    | Free text                                                  |
| Version              |          | Defaults to `1.0`                                          |
| Owner, Approver      |          | Picked from the 7 personas                                 |
| Effective / Review   |          | Date pickers                                               |
| Status               |          | `Published` or `Draft`                                     |
| External URL         |    ◑    | Required if no file (e.g. wiki link); validated by `safeUrl()` |
| Description          |          | Free text                                                  |
| Maps to regulations  |          | Multi-select against all 11 seeded regulations             |
| Implemented by controls |       | Multi-select against all 12 seeded controls: selected controls get auto-linked to this new policy |

The file is read with `FileReader.readAsDataURL()`, stripped to base64, and
persisted to `localStorage` under `grc.policyFile.<id>` (≤ 3 MB cap). The
metadata lives at `grc.userPolicies`. Reopening the app reconstitutes both.
**Nothing is uploaded over the network: it all stays in the browser.**

### Policy verification (on upload)

Every upload runs through an in-browser **policy analyzer** before it lands in
the catalogue. The analyzer answers the only question a GRC platform actually
cares about: _"does this policy add risk, or close it?"_

`DATA.analyzePolicy(meta, base64?, mimeType?)` returns:

```js
{
  findings: [{ id, severity, category, title, detail, recommendation, regImpact }],
  summary:  { total, critical, high, medium, low, opensRisks, worstRegId },
  projectedDriftDelta: { 'reg-gdpr': 8, 'reg-ai-act': 12, ... }
}
```

Heuristics fall into three buckets:

| Bucket          | Examples of what we look for                                                                                   |
|-----------------|---------------------------------------------------------------------------------------------------------------|
| **Metadata**    | missing owner / approver, no description, review date already in the past, draft policies in production paths |
| **Coverage**    | no mapped regulation, no implementing control, title overlaps an existing policy                              |
| **Content**     | body < 150 words; missing the keywords a regulation _must_ reference (e.g. GDPR-mapped policy with no mention of "Article 32" or "encryption", AI-Act-mapped policy with no "high-risk" or "Annex III", DORA with no "third-party" or "concentration risk", CRA with no "SBOM", etc.) |

The upload modal shows the analyzer output as a **Policy verification** panel:
severity chips, the top findings with severity-coloured dots, and a
`Projected drift: +8 on GDPR, +4 on AI Act` line. The **Save** button relabels
itself to `Save & open N risks` so it's obvious what saving will do.

On save, `DATA.applyPolicyFindings(policyId, analysis)` actually materialises
the analysis:

- Every **high** or **critical** finding is opened as a real `Risk` against the
  mapped regulation (severity carries over; `sourcePolicyId` + `sourceFindingId`
  tag the risk so we can trace it back to the upload).
- The linked controls' `drift %` is bumped (capped at +20) so the risk-engine's
  Coverage / Control-Drift sub-scores move on the next render.
- A top-right **toast** confirms what just changed (`"3 risks opened. Drift
  expected to rise on GDPR (+12). Review them in Compliance Gaps."`) with a
  one-click **Open Gaps** CTA.

The user lands back on Policies, sees the new upload at the top, opens the
Dashboard, and the drift gauge has moved.

### Framework-control compliance scan

After the metadata heuristics run, every upload is also scanned against the
**framework controls** (clauses) of the regulations it claims to satisfy.
This is the question an auditor would actually ask: _"which sections of
GDPR does this policy cover, and which does it miss?"_

`DATA.frameworkControls['reg-gdpr']` (and one entry per framework) holds the
seeded clauses:

```js
{ id: 'gdpr-fc-art32', code: 'Art. 32', title: 'Security of processing',
  summary: 'Appropriate technical and organisational measures…',
  keywords: ['encryption', 'art. 32', 'pseudonymisation', 'integrity', ...],
  severity: 'critical' }
```

`DATA.scanPolicyCompliance(policy)` walks every linked framework and, for
each framework control, searches the policy's title, description, tags
and **section bodies** for the control's keywords:

- **compliant** = ≥ 2 keyword hits across sections,
- **partial**   = 1 weak hit,
- **missing**   = no hits.

It returns:

```js
{
  byFramework: [{
    regId, name, total, compliant, partial, missing, coveragePct,
    controls: [{ id, code, title, severity, status,
                 matchedKeywords, evidenceRefs, evidenceSnippets }]
  }, …],
  summary:       { totalControls, compliantControls, partialControls,
                   missingControls, coveragePct, worstFramework },
  evidenceItems: [{ policyId, frameworkControlId, policySectionRef,
                    snippet, matchedKeywords }]
}
```

The upload-modal **Policy verification** panel now renders this as an
expandable per-framework breakdown:

```
GDPR    3/6 compliant   (1 partial, 2 missing)   58%
  ● Art. 5    Principles relating to processing            compliant
  ● Art. 32   Security of processing                       compliant
  ● Art. 30   Records of processing activities             missing
  ● Art. 33   Personal-data breach notification            missing
```

On **Save**, `DATA.applyComplianceGaps(policyId, scan)` materialises the
scan:

- every **missing** framework control opens a `Risk` with the framework
  control's severity (`gapType: 'missing'`),
- every **partial** control opens a `Risk` one severity below
  (`gapType: 'partial'`),
- every **compliant** control creates an `Evidence` entry pointing at the
  policy section that satisfied it (`auto: true`, `snippet` carries a
  140-char window of matched text).

The Compliance Gaps page groups these by **policy**, shows the
**Framework** + **Framework control** columns, and offers framework
filter chips. The Internal Policies card now exposes a **Coverage**
button that opens a focused per-policy coverage modal, and the Evidence
Vault renders the new **Policy / Framework control / Section / snippet**
columns so auditors can read the proof in place.

### Link a policy from Controls

**Controls → any card → Link policy / Change**. Opens a reusable picker
that lists every policy (seeded + uploaded), with search, radio-card
selection, and a *Clear link* option that falls back to the inferred
mapping (each seeded policy declares its `implementedByControls[]`).

Explicit user choices are persisted to `localStorage` under
`grc.controlPolicyMap`, and override the inferred mapping.

### Data API (`DATA.*`)

| Method                                         | What it does                                                  |
|------------------------------------------------|---------------------------------------------------------------|
| `DATA.getAllPolicies()`                        | Seeded + user-uploaded (newest user uploads first)            |
| `DATA.getPolicyById(id)`                       | Lookup by id                                                  |
| `DATA.addUserPolicy(meta, base64?, mimeType?)` | Validates + persists; returns `{ok, policy}` or `{ok:false, error}` |
| `DATA.deleteUserPolicy(id)`                    | Removes policy, file payload, and all control links pointing at it |
| `DATA.getPolicyFile(id)`                       | Returns `{mimeType, base64}` or `null`                        |
| `DATA.linkControlToPolicy(controlId, policyId)`| Sets / clears the explicit mapping                            |
| `DATA.getPolicyForControl(controlId)`          | Explicit map → falls back to inferred → `null`                |
| `DATA.analyzePolicy(meta, base64?, mimeType?)` | Heuristic verification → `{ findings, summary, projectedDriftDelta }` |
| `DATA.applyPolicyFindings(policyId, analysis)` | Opens risks for high/critical findings + bumps linked-control drift; returns `{ openedRisks, driftBumped, perRegulationDelta }` |
| `DATA.frameworkControls`                       | Object keyed by `regId` → array of framework controls (clauses) |
| `DATA.getFrameworkControlsForReg(regId)`       | Copy of the framework's controls                              |
| `DATA.getFrameworkControlById(fcId)`           | Single framework control (with its `regId`)                   |
| `DATA.allFrameworkControls()`                  | Flat list across every framework                              |
| `DATA.scanPolicyCompliance(policy)`            | Section-by-section coverage scan → `{ byFramework, summary, evidenceItems }` |
| `DATA.applyComplianceGaps(policyId, scan)`     | Opens a `Risk` for every `missing` / `partial` framework control and an `Evidence` entry for every `compliant` one |
| `DATA.MAX_POLICY_FILE_BYTES`                   | `3 * 1024 * 1024`: the in-browser cap                        |

### Security posture of the upload flow

- **MIME + extension whitelist:** `.pdf | .md | .markdown | .html | .htm | .txt`
  matched against `application/pdf | text/markdown | text/html | text/plain`.
- **Hard size cap:** 3 MB (before base64 inflation).
- **File content is never injected into the DOM as HTML.** It's stored
  as base64, reconstituted as a `Blob`, and either opened in a new tab
  with `window.open(url, '_blank', 'noopener,noreferrer')` or framed in
  the in-app viewer from a `blob:` URL on our **own** origin. The blob
  URLs are revoked when the modal closes or after 60 seconds for the
  new-tab flow.
- **PDF preview**: the iframe is intentionally unsandboxed because the
  browser's built-in PDF viewer needs scripts to run (toolbar, paging,
  search), and the blob URL is same-origin. The PDF is rendered by the
  browser's PDF engine, not as a web page, so it can't navigate or
  script the parent. `frame-ancestors 'none'` still prevents anyone
  from framing us. If the PDF file doesn't carry the `%PDF-` magic
  header we refuse to render the iframe at all and surface a clear
  "this isn't a valid PDF" warning with an "Open in new tab" CTA.
- **Uploaded Markdown is tokenised, not parsed.** The body is HTML-escaped
  first; only a fixed grammar (headings, bold, italics, code, list items)
  is then re-wrapped in safe tags. `<script>alert(1)</script>` inside a
  `.md` file shows up as literal text, never as a `<script>` element.
- **Uploaded HTML is never rendered**: it's shown inside a `<pre>` as
  escaped text. We do not implement an HTML sanitiser for the policy
  viewer because we don't need to.
- **Every user-controlled string** (title, description, fileName, section
  title, etc.) goes through `UI.htmlEscape()` before being interpolated
  into HTML.
- **External-URL field** is validated by `UI.safeUrl()`, which rejects
  `javascript:`, `data:`, `vbscript:`, `file:`, `about:`, `chrome://`,
  `ftp://` and anything that doesn't parse via the `URL` constructor.
- **CSP keeps `object-src 'none'` and `frame-ancestors 'none'`.** To
  enable the in-app PDF viewer we relaxed `frame-src` to
  `'self' blob:` (and only there). This lets us frame the blob URL we
  generate ourselves from the user's own file: no third-party origin
  can be framed by us, and we still can't be framed (clickjacking
  protection intact).
- The dedicated `.tests/policies-check.js` suite includes an XSS round
  that fires `<img src=x onerror=>` and `"><script>` payloads into every
  uploaded-policy field (including a malicious Markdown body) and asserts
  the rendered Policies view, the Picker view AND the Viewer modal all
  produce zero raw dangerous tags and zero verbatim leaks.

---

## 8. Real-time activity engine

GRCentral doesn't have a backend in this prototype, but it does have a
deterministic in-browser engine that simulates the experience of running
the app on top of live regulatory feeds. You'll see it in three places:

- **Topbar** : a live clock (`HH:MM:SS IST`) next to a pulsing **LIVE**
  pill. It ticks every second.
- **Sidebar** : the **Activity** tile shows the four most-recent poll
  events from the seeded source table, with relative timestamps
  (`12s ago`, `2m ago`) that auto-update every second. New events slide
  in from the top with a brief orange glow.
- **Across the app** : every element annotated with
  `data-live-since="<unix-ms>"` is rewritten every second by the engine's
  DOM sweep. The Radar timeline, Source-health micro-list, Sources cards
  and Dashboard hero subtitle all use it.

### How a tick works

`Live._tick()` runs every 6 to 12 seconds. It picks an entry from a
weighted table of realistic events:

| Tone   | % of ticks | Examples                                              |
|--------|------------|-------------------------------------------------------|
| Quiet  | ~70%       | "EUR-Lex polled, no changes" · "ENISA polled, no changes" |
| Soft   | ~25%       | "CISA: 1 new advisory (KEV catalog)" · "CIS Benchmarks: Kubernetes v1.8.0 published" |
| Hot    | ~5%        | "AI Act Article 53 consolidated version published" · "DORA RTS: ICT third-party concentration thresholds revised" |

Hot events do something extra: they `unshift` a fully-formed `Change`
record into `DATA.changes`, bump the regulation's `lastChange` to now,
and notify every subscriber. If the user is currently on the Dashboard,
Radar, Drift or Regulation-detail view, the bootstrap subscriber
re-renders so the new entry appears at the top of the timeline with a
**NEW** chip and a pulsing dot for the first 60 seconds.

### Sources view countdowns

Every source card carries a `<span data-live-next="<id>">` chip that
counts down to the next simulated poll for that source ("next in 4m 09s").
When the countdown hits zero the chip flips to "polling…" and a new
randomised next-poll time is set. Combined with the small pulsing dot
next to each source, the Sources view feels like an active operations
console.

### Sync now

Clicking **Sync now** in the sidebar calls `Live.syncNow()`, which fires
three back-to-back ticks. You'll see three new rows fly into the Activity
tile, and if any one of them happens to be a hot event you'll see the
Radar grow a new entry.

### Test surface

The engine has its own deterministic suite at `.tests/live-check.js`
(45 assertions). It drives `Live._tick()` directly without timers,
forces a hot event by repeated picking, asserts the DOM sweep updates
`live-clock` / `[data-live-since]` / `[data-live-next]` nodes, and
confirms the Radar timeline renders the **NEW** chip for any change
detected in the last 60 seconds.

---

## 9. Tests

The repo ships with six pure-Node test suites. Run them all with:

```bash
npm test
```

Or individually:

| Command                              | Suite                  | Checks                                                                                          |
|--------------------------------------|------------------------|------------------------------------------------------------------------------------------------|
| `node .tests/e2e.js`                 | End-to-end             | Every JS module loads, dataset shape, Risk Drift formula, all **13** views render, chart mounting |
| `node .tests/ux-check.js`            | UX round               | CIS healed, source enrichment, sources view CTA, chart beautification, Add-Source wiring        |
| `node .tests/verifier-check.js`      | Add-Source verifier    | URL canonicaliser, simulator accepts / rejects, canonical-URL propagation                       |
| `node .tests/security-check.js`      | Security & XSS         | `htmlEscape` / `safeUrl`, OWASP XSS payloads, `rel="noopener noreferrer"`, CSP + Vercel headers |
| `node .tests/policies-check.js`      | Policies + viewer + analyzer | Seeded data, `addUserPolicy` validation, link/unlink, render of policies + upload modal + picker, **viewer (PDF / Markdown / sections / highlight)**, **`analyzePolicy` heuristics + `applyPolicyFindings` opens risks + bumps control drift**, clickable KPI tiles, XSS round |
| `node .tests/live-check.js`          | Real-time engine       | Module surface, formatters, log seeding, deterministic ticks, hot-event injection into `DATA.changes`, DOM sweep, Radar **NEW** chip on fresh items |
| `node .tests/http-check.js`          | HTTP smoke             | Every asset 200s with the right MIME, 404 path returns 404, CSP carries `frame-src 'self' blob:`, index ships `id="live-clock"` |

Current state: **414 / 414 offline tests passing** (e2e 30 + ux 28 + verifier 19 + security 45 + policies 184 + live 46 + cloud 62 = 414), plus 12 HTTP smoke checks when the dev server is running.

`.tests/cloud-check.js` exercises both halves of the server-storage feature:
the in-browser `CloudPolicies` adapter (feature detection, single-flight
ping, upload / delete fetch shapes, DATA hydration + cache mutation) and
the serverless route handlers (`api/policies.js`, `api/policies/[id].js`)
with a stubbed `@vercel/blob` module, asserting validation, error codes
(`TITLE_REQUIRED`, `TOO_LARGE`, `BLOB_NOT_CONFIGURED`, `BAD_ID`),
path-traversal rejection, 4 MB body cap, 503 fallback when the env var
is missing, and end-to-end POST + GET + DELETE round trips.

---

## 10. Push to GitHub

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

## 11. Deploy to Vercel

GRCentral is 100% static: it deploys to Vercel with **zero build step**.

### Option A: Vercel CLI (fastest)

```bash
npm i -g vercel        # one-time global install
vercel login           # opens browser
vercel                 # first run: 'Set up & deploy' → accept defaults
vercel --prod          # promote to production
```

What Vercel will detect:
- **Framework Preset:** *Other* (static).
- **Build Command:** *(none)*.
- **Output Directory:** `.` (project root: `index.html` is at the root).
- **Install Command:** *(none)*.

The included `vercel.json` already configures:
- Correct MIME for `.js` and `.css`.
- Light caching (`max-age=300, must-revalidate`) for static assets.
- Security headers: `Content-Security-Policy` (with `frame-src 'self' blob:`
  for the in-app policy viewer, `frame-ancestors 'none'`, `object-src 'none'`),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
  `Strict-Transport-Security` with `preload`,
  `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin`.

### Option B: Vercel dashboard

1. Push to GitHub (section 8).
2. Go to **vercel.com → Add New → Project**.
3. Import the GitHub repo.
4. Framework Preset: **Other**, Build Command: *(empty)*, Output
   Directory: *(empty: defaults to project root)*.
5. Click **Deploy**.

Every subsequent `git push origin main` auto-deploys to production;
PR branches get preview URLs.

### Option C: drag and drop

vercel.com → **Add New → Project → Drop folder here** → drop the
`grcentral` folder. Done in 10 seconds, no Git needed.

### Custom domain

After the first deploy:

```bash
vercel domains add grcentral.babcom.example
```

Or in the dashboard: **Project → Settings → Domains → Add**.

### Verify the deploy

After deploy, hit `https://<your-project>.vercel.app/`: you should see
the splash, then the Dashboard with Aarav Mehta as the active persona.
Then verify:

```bash
curl -sI https://<your-project>.vercel.app/assets/js/views.js \
  | findstr /R "HTTP/ Content-Type Cache-Control"
```

You should see `200 OK`, `application/javascript; charset=utf-8`,
and `Cache-Control: public, max-age=300, must-revalidate`.

### Cross-user uploads via Vercel Blob

By default GRCentral runs in **local-only mode**: a policy uploaded in
browser A stays in browser A's `localStorage`. To make every upload
visible to every visitor, attach **Vercel Blob** to the project. This
unlocks the `/api/policies` serverless functions and switches the
Internal Policies page into "Server storage active" mode.

```bash
# 1. From the project root, enable Blob for this project.
vercel blob create grcentral-policies
# This creates the store and prints a connection summary.

# 2. Vercel auto-injects BLOB_READ_WRITE_TOKEN into Production + Preview
#    environments. Pull it locally if you want `vercel dev` to talk to Blob.
vercel env pull .env.local
```

Or in the dashboard: **Project -> Storage -> Connect Store -> Blob ->
Create New** -> name it `policies`. Vercel does the env-var wiring.

What you get:

- `/api/policies` (GET = list, POST = upload) and
  `/api/policies/<id>` (GET = single, DELETE = remove) are served by the
  two functions under `api/`.
- Uploaded payloads land at `policies/files/<id>.<ext>` on
  `https://<storeid>.public.blob.vercel-storage.com`.
- Metadata lands at `policies/meta/<id>.json` so the next visitor's
  browser can rehydrate the catalogue on first render.
- File-size cap is 4 MB (Vercel function body limit is 4.5 MB).
- The Policies page shows a **"Server storage active. Visible to every
  visitor."** banner; uploaded cards carry a cyan **"Server"** pill;
  the delete button does a real DELETE (metadata + file).

If the env var is missing, the API returns `503 { available: false }`,
the client transparently flips back to localStorage, and the Policies
page shows a **"Local-only mode"** banner instead. No code branches
required.

Costs: Vercel Blob has a generous free tier (5 GB storage + 100 GB
egress on Hobby, as of writing) which is more than enough for this app
unless a single tenant uploads thousands of policies.

---

## 12. Roadmap

- Real EUR-Lex SPARQL connector + Akoma Ntoso XML parser
- LLM-assisted obligation extraction and auto-mapping to ISO 27001 / NIST CSF
- Multi-tenant + SSO (SAML / OIDC) on top of the Blob storage layer
- Jira / ServiceNow / Slack action dispatch
- Board-ready PDF export
- Server-side persistence for user-added sources (policies are already
  on Vercel Blob; sources are still in `localStorage`)
- Antivirus scan + PII detection in the policy-upload pipeline before persistence
- Policy diffing across versions (same engine as the article-level regulation diff)
- Bulk attestation campaigns + reminders for policies due for review
- Real verification step that actually fetches the source URL through a serverless function

---

<sub>All identifiers (CELEX, ELI, regulation titles) are real EU
regulatory references; article texts and seeded policy sections are
illustrative.</sub>
