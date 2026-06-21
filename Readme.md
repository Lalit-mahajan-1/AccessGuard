# AccessGuard — Platform Roadmap & Technical Blueprint

> **Tagline:** *From broken websites to accessible, performant, carbon-neutral code — automatically.*
> 
> Built for developers who care. Automated for the ones who forget.

---

## Page 1 — What We're Building & Why

### The Problem

Modern web applications silently fail millions of users every day.

| User Group | What breaks for them |
|---|---|
| Visually impaired | Missing alt text, low contrast, no ARIA roles, broken screen reader flow |
| Motor-disabled | Keyboard traps, tiny click targets, no focus indicators |
| Cognitive challenges | Flashing content, inconsistent navigation, wall-of-text layouts |
| All users (hidden) | Slow load times, memory leaks, broken network requests, bloated JS bundles |

Current tools like Lighthouse and axe are run manually, once, and forgotten. No one monitors regressions. No one auto-fixes them.

### What AccessGuard Does

AccessGuard is a two-sided platform:

**Side A — Browser Audit Mode**
A user pastes any public URL into our dashboard. We launch a headless browser, attach DevTools protocol, scrape every signal from every tab (Console, Network, Performance, Memory, Accessibility), and return a prioritized, actionable bug report with suggested fixes.

**Side B — GitHub CI/CD Monitor Mode**
A user connects their repo. We become a persistent watcher — like a second reviewer that never sleeps. On every push or PR, we:
- Run full DevTools audit on the deployed preview URL
- Run static code analysis (accessibility, performance, security smells)
- Compute carbon footprint of the page
- Post a structured GitHub PR comment with findings
- (Optional) Open auto-fix pull requests for qualifying issues

### Who Uses This

- Solo devs who don't have a QA team
- Open source maintainers who want a11y compliance without thinking about it
- Agencies delivering client sites who need audit reports
- Companies under WCAG legal pressure (ADA lawsuits are rising)

---

## Page 2 — DevTools Data Extraction: The Engine

This is the technical core. Everything runs on **Chrome DevTools Protocol (CDP)** via **Puppeteer** or **Playwright** on the backend.

### How CDP Works

```
Our Node.js Server
       │
       ▼
Puppeteer/Playwright launches Chromium
       │
       ▼
CDP WebSocket connection to browser instance
       │
       ▼
We enable domains: Page, Network, Console, Performance, Memory, Accessibility
       │
       ▼
Navigate to target URL
       │
       ▼
Collect signals from all domains in parallel
       │
       ▼
Close browser, return structured JSON
```

### Tab-by-Tab: What We Extract and How

---

#### Console Tab

**What we capture:**
- All `console.error`, `console.warn`, `console.log` entries
- Unhandled JS exceptions (with stack traces)
- Failed resource loads logged to console
- Deprecation warnings from Chrome

**CDP Method:**
```javascript
// Enable the Runtime and Log domains
await client.send('Runtime.enable');
await client.send('Log.enable');

// Listen for console messages
client.on('Runtime.consoleAPICalled', (event) => {
  logs.push({
    type: event.type,          // 'error', 'warning', 'log'
    args: event.args,          // The actual values
    stackTrace: event.stackTrace,
    timestamp: event.timestamp
  });
});

// Listen for uncaught exceptions
client.on('Runtime.exceptionThrown', (event) => {
  exceptions.push({
    message: event.exceptionDetails.text,
    lineNumber: event.exceptionDetails.lineNumber,
    url: event.exceptionDetails.url,
    stack: event.exceptionDetails.stackTrace
  });
});

// Browser-level logs (includes network errors, CSP violations)
client.on('Log.entryAdded', (event) => {
  browserLogs.push(event.entry);
});
```

**What we flag:**
- `TypeError`, `ReferenceError`, `SyntaxError` in production builds
- React/Vue/Angular framework errors (hydration mismatches, missing keys)
- Third-party script errors polluting the console
- CSP violations

---

#### Network Tab

**What we capture:**
- Every request: URL, method, status code, timing, size, initiator
- Failed requests (4xx, 5xx, CORS errors, blocked by CSP)
- Slow requests (> 500ms TTFB)
- Render-blocking resources
- Large resources (images, JS bundles > 200KB uncompressed)
- Missing cache headers
- HTTP vs HTTPS mixed content

**CDP Method:**
```javascript
await client.send('Network.enable');

const requests = new Map();

client.on('Network.requestWillBeSent', (event) => {
  requests.set(event.requestId, {
    url: event.request.url,
    method: event.request.method,
    initiator: event.initiator,
    timestamp: event.timestamp,
    resourceType: event.type
  });
});

client.on('Network.responseReceived', (event) => {
  const req = requests.get(event.requestId);
  if (req) {
    req.status = event.response.status;
    req.mimeType = event.response.mimeType;
    req.responseHeaders = event.response.headers;
    req.encodedDataLength = event.response.encodedDataLength;
    req.timing = event.response.timing; // TTFB, DNS, SSL breakdown
  }
});

client.on('Network.loadingFailed', (event) => {
  failedRequests.push({
    requestId: event.requestId,
    errorText: event.errorText,
    canceled: event.canceled
  });
});
```

**What we flag:**
- 4xx/5xx responses on any resource
- CORS failures
- Resources taking > 1000ms to load
- JS/CSS bundles > 200KB (parsed size)
- Images larger than their display size (waste ratio)
- No `Cache-Control` headers on static assets
- Missing gzip/brotli compression

---

#### Performance Tab

**What we capture:**
- Core Web Vitals: LCP, FID/INP, CLS
- FCP (First Contentful Paint)
- TTI (Time to Interactive)
- TBT (Total Blocking Time)
- Long tasks (> 50ms on main thread)
- JS execution time by script

**CDP Method:**
```javascript
// Use Performance domain for raw metrics
await client.send('Performance.enable');

// Inject PerformanceObserver via page evaluation
await page.evaluate(() => {
  window.__perf_entries = [];
  const observer = new PerformanceObserver((list) => {
    window.__perf_entries.push(...list.getEntries());
  });
  observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift', 'longtask', 'first-input', 'paint'] });
});

// After full page load:
const metrics = await client.send('Performance.getMetrics');
const perfEntries = await page.evaluate(() => window.__perf_entries);

// Trace-based approach for deeper data:
await client.send('Tracing.start', {
  categories: 'devtools.timeline,blink.user_timing',
  transferMode: 'ReturnAsStream'
});
// ... navigate and interact ...
await client.send('Tracing.end');
// parse the trace JSON for full flamegraph data
```

**What we flag:**
- LCP > 2.5s (Poor)
- CLS > 0.1 (Poor)
- INP > 200ms (Poor)
- Any long task blocking the main thread > 100ms
- Scripts with > 500ms parse/compile time

---

#### Memory Tab

**What we capture:**
- JS heap size (used vs total)
- Heap snapshots (diffed before/after interaction)
- Detached DOM nodes
- Memory growth over time (leak detection)
- Garbage collection events

**CDP Method:**
```javascript
await client.send('Memory.enable');
await client.send('HeapProfiler.enable');

// Take snapshot before
await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
const snapshotBefore = heapData; // collected via HeapProfiler.addHeapSnapshotChunk events

// Simulate user interaction (click around, navigate, come back)
await page.click('[data-nav]');
await page.goBack();

// Take snapshot after
await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
const snapshotAfter = heapData;

// Get live memory metrics
const memMetrics = await client.send('Performance.getMetrics');
// Look for: JSHeapUsedSize, JSHeapTotalSize

// Detect detached nodes via query
const detachedNodes = await page.evaluate(() => {
  // Walk the heap for nodes not connected to document
  // This is approximated via JS
});
```

**What we flag:**
- Heap growth > 50MB after a simple navigation round-trip (likely leak)
- Detached DOM nodes count > 50
- Memory not being released after component unmount (SPA issue)

---

#### Accessibility Tab

**What we capture:**
- Full AX tree (Accessibility Tree) from CDP
- ARIA role/label/description correctness
- Focusable element order
- Color contrast ratios
- Missing alt attributes
- Form label associations

**CDP Method:**
```javascript
await client.send('Accessibility.enable');

// Get the full accessibility tree
const { nodes } = await client.send('Accessibility.getFullAXTree');

// Each node has: role, name, description, properties, children
// We walk this tree and check:
nodes.forEach(node => {
  if (node.role.value === 'image' && !node.name?.value) {
    issues.push({ type: 'missing-alt', nodeId: node.nodeId });
  }
  if (node.role.value === 'button' && !node.name?.value) {
    issues.push({ type: 'unlabeled-button', nodeId: node.nodeId });
  }
});

// Augment with axe-core for WCAG rule coverage
await page.addScriptTag({ path: 'axe.min.js' });
const axeResults = await page.evaluate(async () => {
  return await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] }
  });
});
```

**What we flag (mapped to WCAG 2.2 criteria):**
- 1.1.1 — Images with no alt attribute
- 1.3.1 — Form inputs without `<label>`
- 1.4.3 — Color contrast below 4.5:1 (normal text) or 3:1 (large text)
- 2.1.1 — Elements not reachable by keyboard
- 2.4.3 — Illogical focus order
- 2.4.7 — No visible focus indicator (`:focus-visible` absent)
- 4.1.2 — Custom components missing ARIA roles/states

---

## Page 3 — GitHub Integration: CI/CD Monitor Mode

### Architecture

```
User connects GitHub OAuth
        │
        ▼
We register a GitHub App on their repo
        │
        ▼
Webhook fires on: push to main, PR opened, PR updated
        │
        ▼
Our server receives event
        │
        ▼
Fetch the preview URL (Vercel/Netlify auto-deploy URL from PR checks API)
        │
        ▼
Run full DevTools audit + static analysis on that URL
        │
        ▼
Post structured comment on the PR
        │
        ▼
(Optional) Open auto-fix PR if fixable issues found
```

### Step 1: GitHub App Setup

We create a GitHub App (not OAuth App) because it:
- Installs per-repo, not per-user
- Has fine-grained permissions
- Can push commits and open PRs as itself

**Permissions we request:**
- `contents: write` — to push auto-fix commits
- `pull_requests: write` — to open fix PRs and post comments
- `checks: read` — to get preview deployment URLs
- `statuses: write` — to set commit status (pass/fail)

**Webhook events we subscribe to:**
- `pull_request` (opened, synchronize, reopened)
- `push` (to default branch, for main branch monitoring)

### Step 2: Getting the Preview URL

When a PR is opened on a Vercel or Netlify project, they post deployment URLs as GitHub Check Runs.

```javascript
// After receiving PR webhook:
const { data: checks } = await octokit.checks.listForRef({
  owner, repo,
  ref: pull_request.head.sha
});

// Find deployment check
const deployCheck = checks.check_runs.find(r =>
  r.name.includes('Vercel') || r.name.includes('Netlify') || r.name.includes('Preview')
);

const previewUrl = deployCheck?.details_url
  || extractUrlFromCheckOutput(deployCheck?.output?.summary);
```

For repos that don't use Vercel/Netlify, we support:
- User-configured preview URL template: `https://pr-{number}.preview.example.com`
- Self-hosted deployment via webhook callback: user's CI pings us when ready

### Step 3: Run the Audit

We trigger the same DevTools audit engine (Page 2) against the preview URL, but add:

**Static Code Analysis (no browser needed):**
```
Repo clone → Run ESLint with:
  - eslint-plugin-jsx-a11y     (React a11y rules)
  - eslint-plugin-react        (React best practices)
  - @typescript-eslint         (type safety)
  - eslint-plugin-sonarjs      (code smell detection)

Run custom AST traversal for:
  - Hardcoded color values (a11y contrast risk)
  - `onClick` without `onKeyDown` (keyboard trap)
  - `tabIndex > 0` (focus order break)
  - `display: none` without aria-hidden (screen reader confusion)
```

### Step 4: Post the PR Comment

We post a structured, collapsible Markdown comment:

```markdown
## 🛡️ AccessGuard Report — PR #42

**Score: 71/100** | ⬆️ +3 from last scan

| Category | Issues | Severity |
|---|---|---|
| ♿ Accessibility | 4 issues | 🔴 2 Critical, 🟡 2 Warning |
| ⚡ Performance | LCP 3.1s | 🔴 Poor |
| 🌱 Carbon Footprint | 0.8g CO₂/visit | 🟡 Moderate |
| 🐛 Console Errors | 2 JS exceptions | 🔴 Error |
| 🌐 Network | 1 failed request | 🔴 Error |

<details>
<summary>♿ Accessibility Details</summary>

**[Critical] Button missing accessible name** — `src/components/Header.tsx:34`
> `<button onClick={...}>` has no text content, aria-label, or aria-labelledby
> 
> **Fix:** Add `aria-label="Close menu"` or wrap text content

**[Critical] Image missing alt text** — `src/pages/Home.tsx:89`
> `<img src="/hero.jpg">` — screen readers will announce the file path
>
> **Fix:** Add `alt="Hero image describing the main value proposition"`

</details>

<details>
<summary>⚡ Performance Details</summary>

**LCP: 3.1s (Poor)** — Largest element: `<img id="hero-image">`
> Image is 480KB uncompressed, not using next-gen format
> 
> **Fix:** Convert to WebP, add `loading="lazy"` for below-fold images, use `srcset`

**Long Task: 340ms** — `vendor.chunk.js` parse time
> Bundle contains unused code from `lodash` (full import)
>
> **Fix:** Use `import { debounce } from 'lodash'` instead of `import _ from 'lodash'`

</details>

---
🔧 **2 issues are auto-fixable.** [Create fix PR](#) | [View full report](#)
```

### Step 5: Auto-Fix Pull Requests

For issues we can safely fix without semantic understanding:

| Issue Type | Auto-fix approach |
|---|---|
| Missing `alt=""` on decorative images | Add `alt=""` + `role="presentation"` |
| `<img>` with filename as alt | Flag for human; suggest descriptive text via AI |
| `onClick` without `onKeyDown` | Add `onKeyDown` handler mirroring onClick |
| Missing `aria-label` on icon buttons | Detect icon + context, generate label via AI |
| Uncompressed images | Download, convert to WebP, update import/src |
| Full lodash imports | AST transform to named imports |
| Missing `lang` on `<html>` | Detect page language, add attribute |
| `console.log` in production | Remove with AST transform |

**Auto-fix PR flow:**
```javascript
// 1. Clone repo at PR head SHA
// 2. Apply fixes (AST transforms via jscodeshift, or direct file edits)
// 3. Run our audit again on the modified files to verify fix
// 4. Commit: "fix(a11y): add aria-labels to unlabeled buttons [AccessGuard]"
// 5. Open PR targeting the original PR's branch
// 6. Tag original PR author as reviewer
```

---

## Page 4 — Carbon Footprint & Bonus Intelligence Features

### Carbon Footprint Calculation

Every byte transferred = electricity consumed = CO₂ emitted. We calculate per-page carbon using the [Sustainable Web Design model](https://sustainablewebdesign.org/calculating-digital-emissions/).

**Formula:**
```
Total data transferred (KB)
  × Energy per byte (kWh/GB) = 0.81 kWh/GB
  × Grid carbon intensity (gCO₂/kWh) = 442g global avg
  = gCO₂ per page visit

Monthly estimate = gCO₂/visit × estimated monthly visits
```

**What we measure and report:**
- Page weight (total transferred bytes, per resource type)
- Server energy estimate (based on response times and data center type)
- CDN vs origin serving ratio
- Third-party script carbon contribution (Google Analytics alone = ~0.3g/visit)
- Comparison: "Your page emits the equivalent of boiling a kettle X times per 10,000 visits"
- Green hosting check: is the domain hosted on renewable-powered infrastructure? (via Green Web Foundation API)

**Auto-suggestions:**
- Image optimization savings estimate
- Font subsetting savings
- Remove unused CSS (coverage analysis via CDP)
- Switch to green hosting provider (with recommendations)

---

### Bonus Intelligence Features (Beyond the Spec)

These are the "crazy" features that make AccessGuard stand out from every other audit tool:

---

#### 🤖 AI-Powered Fix Descriptions

For every issue we find, instead of pointing to a WCAG reference number, we generate a human explanation:

> *"The hero image on your homepage has no alt text. When a screen reader encounters this image, it will read out the filename `DSC_04821_FINAL_v3.jpg` — which is meaningless and confusing to a blind user who is trying to understand what your product is about. Add a short description of what the image shows."*

We do this by passing the DOM context + issue type to an LLM, getting a plain-English explanation, and caching it per issue fingerprint.

---

#### 📊 Regression Dashboard

We don't just audit once — we store every scan result and show trends:

- Accessibility score over time (per branch, per deploy)
- Performance budget alerts: "LCP went from 1.8s to 3.2s between commit `a3f` and `b7c`"
- Carbon trend: "Your page has gotten 40% heavier over the last 30 days"
- "Which PR introduced this?" — we bisect to the exact commit that caused a regression

---

#### 🎭 Simulation Mode

We simulate your site through the lens of specific disabilities:

- **Vision simulation**: Deuteranopia, Protanopia, Achromatopsia (via CSS filters + CDP screenshot)
- **Motor simulation**: Tab-only navigation recording — we navigate purely via keyboard and record which elements are unreachable
- **Cognitive simulation**: Highlight all animations, moving elements, autoplay media that could cause distraction or seizures
- **Low bandwidth simulation**: CDP Network throttling to 3G — rerun LCP/FCP and show degraded experience

We return annotated screenshots for each simulation.

---

#### 🔍 Third-Party Script Auditor

Most sites load 10–30 third-party scripts they don't fully understand. We break down:

- Which scripts are running
- What permissions they request (camera, geolocation, cookies)
- Their performance cost (blocking time, network bytes)
- Their privacy implications (do they fingerprint users?)
- Whether they're necessary (analytics loaded on every page but only needed on dashboards?)

---

#### 🧪 Visual Regression Diff

On each PR, we screenshot every route we can discover (sitemap.xml + crawling `<a>` tags) and diff against the last main branch screenshot.

- Pixel diff highlighting
- Detects unintentional layout shifts from CSS changes
- Flags new elements that appear/disappear
- Great for catching "worked on my machine" deploy issues

---

#### 📱 Multi-Device Audit

We run every audit on 5 viewports simultaneously:
- Mobile (375px, Moto G4)
- Tablet (768px, iPad)
- Desktop (1440px)
- Large display (2560px)
- Accessibility zoom (1440px at 200% text zoom)

Issues are tagged by which viewport they appear on, since many a11y bugs are mobile-only.

---

## Page 5 — System Architecture & Tech Stack

### Full Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS       │
│                                                             │
│  Pages:                                                     │
│  / (Landing)                                               │
│  /audit (URL input → live audit results)                   │
│  /dashboard (connected repos, history, trends)             │
│  /report/[id] (shareable audit report)                     │
│  /settings (GitHub connection, notifications)              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│                     API LAYER                               │
│  Node.js + Express (or Hono for edge)                      │
│                                                             │
│  POST /api/audit/url      — one-off URL audit              │
│  POST /api/audit/repo     — trigger repo audit             │
│  GET  /api/report/:id     — fetch stored report            │
│  POST /api/webhook/github — receive GitHub events          │
│  GET  /api/repos          — list connected repos           │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
┌──────────▼──────────┐   ┌─────────────▼──────────────────┐
│   AUDIT WORKERS     │   │      GITHUB SERVICE             │
│   (Bull + Redis)    │   │   (Octokit + GitHub App)       │
│                     │   │                                 │
│  Puppeteer cluster  │   │  - Webhook receiver             │
│  CDP extraction     │   │  - PR comment poster            │
│  axe-core runner    │   │  - Auto-fix PR opener           │
│  Lighthouse runner  │   │  - Check status updater         │
│  Carbon calculator  │   │  - Repo file pusher             │
│  Screenshot engine  │   └─────────────────────────────────┘
└──────────┬──────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                       DATA LAYER                            │
│                                                             │
│  PostgreSQL (Supabase)   — users, repos, reports, history  │
│  Redis                   — job queue, session cache         │
│  S3 / Supabase Storage   — screenshots, heap snapshots      │
│  TimescaleDB (optional)  — metrics time series             │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 | App Router, server components, easy Vercel deploy |
| API | Node.js + Hono | Fast, edge-compatible, TypeScript-native |
| Browser automation | Playwright | More stable than Puppeteer, better CDP access |
| Job queue | BullMQ + Redis | Audit jobs can take 30–60s; needs async queue |
| A11y rules | axe-core | Industry standard, maps directly to WCAG criteria |
| Performance | Lighthouse (programmatic) | Google's own scoring; familiar to developers |
| Database | PostgreSQL via Supabase | You're already using this on SahiDawa India |
| Auth | GitHub OAuth → Supabase Auth | Users connect GitHub anyway; single auth flow |
| Storage | Supabase Storage | Screenshots, reports |
| Hosting | Vercel (frontend) + Railway (workers) | Workers need long-running processes, not serverless |
| Static analysis | ESLint + jscodeshift | AST-level transforms for auto-fix PRs |

### Audit Worker: Sequence Diagram

```
Client Request
     │
     ▼
API creates Job in BullMQ → returns jobId to client
     │
     ▼ (async, worker picks up)
Worker: launch Playwright browser
     │
     ├── Enable CDP domains (Network, Console, Performance, Memory, Accessibility)
     │
     ├── Navigate to URL (with timeout: 30s)
     │
     ├── Wait for: networkidle, load event
     │
     ├── Collect all CDP events accumulated during navigation
     │
     ├── Run axe-core via page.evaluate()
     │
     ├── Run Lighthouse programmatically (same Chrome instance)
     │
     ├── Take full-page screenshot
     │
     ├── Simulate keyboard-only navigation (tab through all focusable elements)
     │
     ├── Calculate carbon footprint from network bytes
     │
     └── Assemble structured JSON report
          │
          ▼
     Save to PostgreSQL + Storage
          │
          ▼
     Notify client via WebSocket / SSE (live progress updates)
```

---

## Page 6 — Build Phases & Developer Quickstart

### Phase 1 — Core Audit Engine (Weeks 1–3)

**Goal:** Given a URL, return a structured JSON audit report.

**Tasks:**
1. Set up Playwright + CDP connection wrapper
2. Implement each extractor as a separate module:
   - `extractors/console.ts`
   - `extractors/network.ts`
   - `extractors/performance.ts`
   - `extractors/memory.ts`
   - `extractors/accessibility.ts`
3. Integrate axe-core injection
4. Integrate Lighthouse programmatic API
5. Build report aggregator: merges all extractor outputs, deduplicates, prioritizes by severity
6. Carbon footprint calculator module
7. REST endpoint: `POST /api/audit/url`

**Deliverable:** `curl -X POST localhost:3001/api/audit/url -d '{"url":"https://example.com"}'` returns full JSON report.

---

### Phase 2 — Frontend Dashboard (Weeks 4–5)

**Goal:** Beautiful, usable UI for one-off URL audits.

**Tasks:**
1. Next.js app scaffold
2. URL input page with live progress (SSE stream from audit worker)
3. Report viewer: tabbed interface mirroring DevTools tabs
4. Issue cards: severity badge, code snippet, suggested fix, WCAG reference
5. Score display: overall + per-category
6. Screenshot viewer with annotation overlay
7. Carbon footprint widget
8. Shareable report link (`/report/abc123`)

---

### Phase 3 — GitHub Integration (Weeks 6–8)

**Goal:** Connect a repo, get automatic audits on every PR.

**Tasks:**
1. Register a GitHub App (via GitHub Developer Settings)
2. Implement webhook receiver (`POST /api/webhook/github`)
3. GitHub OAuth login flow (connect user account)
4. Repo connection UI (list their repos, one-click install)
5. Preview URL detection from GitHub Checks API
6. PR comment formatter (Markdown with collapsible sections)
7. Commit status updater (green checkmark / red X on PR)
8. Dashboard: connected repos, recent scans, score history graph

---

### Phase 4 — Auto-Fix PRs (Weeks 9–11)

**Goal:** For qualifying issues, open a fix PR automatically.

**Tasks:**
1. Define fixable issue taxonomy (start with 5–8 safe auto-fixes)
2. Build AST transform pipeline using `jscodeshift`
3. Git operations via `simple-git` or GitHub REST API (no SSH needed for public repos)
4. Auto-fix PR template and commit message conventions
5. Re-audit after fix to verify it actually resolved the issue
6. User settings: opt-in/opt-out per fix category

---

### Phase 5 — Intelligence & Simulation Features (Weeks 12–14)

**Goal:** The features that no other tool has.

**Tasks:**
1. AI-powered fix descriptions (call Claude API per issue, cache by fingerprint)
2. Visual regression diffing pipeline (screenshot → diff → annotated PNG)
3. Multi-device audit runner (5 viewports in parallel)
4. Disability simulation screenshots (CSS filter overlays + CDP screenshots)
5. Third-party script profiler
6. Regression trend dashboard (charts, "which PR caused this?")

---

### Developer Quickstart (Local Setup)

```bash
# Prerequisites: Node 20+, Bun, Docker (for Redis + Postgres)

git clone https://github.com/yourorg/accessguard
cd accessguard

# Start infrastructure
docker compose up -d  # Redis + PostgreSQL

# Install dependencies
bun install

# Environment variables
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY,
#          GITHUB_WEBHOOK_SECRET, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY

# Run database migrations
bun run db:migrate

# Start all services (uses Bun workspaces)
bun run dev
# → Next.js frontend: http://localhost:3000
# → API server:       http://localhost:3001
# → Worker process:   background (BullMQ consumer)

# Test the audit engine directly:
bun run audit:test --url https://example.com
```

**Monorepo structure:**
```
accessguard/
├── apps/
│   ├── web/          (Next.js frontend)
│   └── api/          (Hono API server)
├── packages/
│   ├── audit-engine/ (CDP extractors, axe, Lighthouse)
│   ├── github/       (GitHub App, PR comments, auto-fix)
│   ├── carbon/       (Carbon footprint calculator)
│   ├── worker/       (BullMQ job definitions)
│   └── db/           (Prisma schema, migrations)
├── docker-compose.yml
├── package.json      (Bun workspaces)
└── turbo.json        (Turborepo for build orchestration)
```

---

### Issue Severity Classification

Every issue we find gets one of four levels, shown consistently in the UI, PR comments, and API responses:

| Level | Colour | Meaning | Example |
|---|---|---|---|
| Critical | 🔴 Red | Blocks access completely for a user group | Button unreachable by keyboard |
| Warning | 🟡 Yellow | Degrades experience significantly | Low contrast text |
| Info | 🔵 Blue | Best practice not followed | Missing meta description |
| Pass | 🟢 Green | Audit passed this check | Alt text present |

---

*Built with Playwright · axe-core · Lighthouse · GitHub Apps · Supabase · Next.js*  
*AccessGuard — making accessibility the default, not an afterthought.*
