# Testing Guide

This repository prioritizes a **lean, ESM-native testing pyramid** for an embedded Web Component. Local development runs fast contract validation + embedded UI tests. Optional cross-repo compatibility checks run in CI.

## Test Pyramid

```
           Compatibility (optional, CI-only)
         /
        /  Cross-repo integration smoke
       /   (validate TPEN-interfaces anchors)
      /___________________________
     /
    /  Embedded UI Layer
   /   (Playwright: portrait 400×768 viewport)
  /    (mocked TPEN.eventDispatcher, IIIF endpoints)
 /___________________________
/
Contract Layer                (node:test)
Unit & Logic Layer           (node:test)
```

## Commands

**Local Development (Lean):**
- `npm run test:contract` — Interface contract checks (node:test)
- `npm run test:api` — Harness API route checks (node:test)
- `npm run test:e2e` — Embedded UI tests (Playwright, 400×768 portrait viewport)
- `npm run test` — Runs all three above (no integration smoke by default)
- `npm run coverage` / `npm run coverage:html` — Coverage for contract + api layers (c8)

**Optional/CI:**
- `npm run test:compat` — Cross-repo TPEN-interfaces compatibility smoke checks
- `npm run test:ci` — Full pipeline: lean tests + compatibility (used in CI on main)

**Setup:**
- `npm run test:install-browsers` — One-time: install Playwright browsers

## Prerequisites

- Node.js 20+
- Git (optional, only needed for cross-repo compatibility checks)
- For Playwright tests: run `npm run test:install-browsers` once locally

## Test Layers Detailed

### 1) Contract Tests (node:test)

Verifies this component exposes expected integration anchors and is ready to receive shared contract updates from TPEN-interfaces.

**Validates:**
- Component registers as custom element (`tpen-line-history`)
- Custom-event listener setup (`TPEN.eventDispatcher.on()`)
- Line payload fixture conforms to schema (`isLineLikePayload()`)
- **Dual-transport readiness:** handlers exist for both custom-event and postMessage channels

**File:** `test/contracts/interface-contract.test.js`

**When TPEN-interfaces publishes the shared embed contract:**
- This layer will import from `@tpen/embed-contract`
- Tests will enforce channel names, payload shapes, and transport metadata
- Mismatches will fail fast and prevent silent integration drift

### 2) Unit & Internal Logic Tests (node:test)

Covers internal utility functions and business logic independent of harness/embedding context.

**File:** `test/contracts/line-history-utils.test.js`

### 3) Harness API Tests (node:test + supertest)

Validates test server routes that provide deterministic fixtures.

**Routes:**
- `/health` — Health check
- `/fixtures/annotation-page.json` — Mock annotation page
- `/fixtures/line.json` — Mock line data

**File:** `test/api/harness-api.test.js`

### 4) Embedded UI Tests (Playwright)

Runs against `demo.html` in a **portrait 400×768 viewport**, simulating the component embedded in a split-screen interface (portrait third-width of a desktop).

**Mocked external dependencies:**
- `TPEN.eventDispatcher` — Listener setup validated by contract layer
- IIIF manifest endpoints
- RerumHistoryData module
- RERUM annotation page endpoints

**Validates:**
- Component renders in embedded viewport
- Line data flows through component correctly
- User interactions trigger expected event payloads
- Custom event dispatch uses correct channel names (from shared contract)

**Files:**
- `playwright.config.js` — Defines 400×768 portrait viewport as baseline
- `e2e/interface.spec.js` — UI behavior tests
- `test/scripts/start-test-server.js` — Test server for fixture serving

### 5) Cross-Repo Compatibility Smoke (Optional, CI-only)

Validates this component remains integrated with TPEN-interfaces.

**Checks:**
- TPEN-interfaces still references `tpen-line-history` component
- TPEN-interfaces still emits/references the expected event channels
- No silent breakage in split-screen integration points

**File:** `test/scripts/run-integration-smoke.js`

**Run locally (optional):**
```bash
npm run test:compat
```

**Environment overrides:**
- `TPEN_INTERFACES_REMOTE` — Custom GitHub URL
- `TPEN_INTERFACES_REF` — Custom branch/tag

## Shared Integration Contract (TPEN-interfaces)

**Status:** Planned. When TPEN-interfaces publishes an embed integration contract module:

1. The contract defines channel names, payload schemas, and transport metadata
2. This repository imports and tests against that contract
3. Channel changes in TPEN-interfaces fail contract tests here automatically
4. Both repositories stay in sync without cloning the full app

**Expected contract structure:**
```javascript
// @tpen/embed-contract or similar
export const channels = [
  {
    name: 'tpen-active-line-updated',
    transport: 'custom-event',      // or 'postMessage'
    source: 'TPEN.eventDispatcher', // or 'cross-origin window.parent'
    direction: 'inbound',           // component receives
    payloadShape: { /* line data schema */ }
  },
  {
    name: 'tpen-set-line',
    transport: 'custom-event',
    direction: 'outbound',          // component emits
    payloadShape: { /* line data schema */ }
  }
  // postMessage channels may be added here in future
]

export const payloadSchemas = {
  'tpen-active-line-updated': { /* validator */ },
  'tpen-set-line': { /* validator */ }
}
```

## CI Policy

Workflow: `.github/workflows/test.yml` (hypothetical example)

| Branch/Event | `npm run test` | `npm run test:compat` |
|---|---|---|
| PR (any branch) | ✅ Runs (fast) | ❌ Skipped |
| Push to main | ✅ Runs | ✅ Runs |
| Scheduled nightly | ✅ Runs | ✅ Runs |

This keeps branch feedback fast while preserving a stricter integration gate on main.

## Coverage

Coverage reports are generated with c8 for node:test layers only:

```bash
npm run coverage      # Text + lcov output
npm run coverage:html # HTML report
```

Playwright browser tests are tracked separately and not included in c8 reports.

## Troubleshooting

**"Cannot find module @tpen/embed-contract"**
- The shared contract module does not yet exist. Contract consumption tests are placeholders. Once TPEN-interfaces publishes the contract, update `package.json` and import statements.

**Playwright tests fail on CI but pass locally**
- Ensure `npm run test:install-browsers` was run to install Chromium.
- Check viewport size: tests assume 400×768 portrait.

**Integration smoke checks clone a large repo slowly**
- This is expected on first run. Subsequent runs reuse the cached clone.
- Run locally only when needed: `npm run test:compat`
- CI should cache `.tmp/` directory between builds.

**Test server won't start**
- Ensure port 4173 is free: `lsof -i :4173` (macOS/Linux) or `netstat -ano | findstr :4173` (Windows)
- Check Node.js version: requires 20+
