# Testing Guide

This repository uses three test layers:

1. Contract tests for interface expectations (node:test)
2. Harness API tests for deterministic fixtures (supertest)
3. Browser interface tests for custom-element behavior (Playwright)

A fourth layer, cross-repo smoke checks, validates known integration anchors in TPEN-interfaces. This layer is required in CI only on the main branch.

## Commands

- `npm run test:contract`: Interface contract checks
- `npm run test:api`: Harness API route checks
- `npm run test:e2e`: Browser interface tests
- `npm run test`: Runs contract + api + e2e
- `npm run test:integration`: Cross-repo TPEN-interfaces smoke checks
- `npm run test:main`: Full stack used for main branch verification
- `npm run coverage`: c8 coverage for node:test contract + api layers
- `npm run coverage:html`: c8 HTML coverage report for node:test layers

## Prerequisites

- Node.js 20+
- Git
- For Playwright tests: run `npm run test:install-browsers` once locally

## Test Layers

## Coverage

Coverage is generated with c8 for node:test suites only (contract + api).

- `npm run coverage` writes text and lcov output.
- `npm run coverage:html` writes an HTML coverage report.

Playwright browser tests are kept separate from c8 in this setup.

### 1) Contract Tests

Contract tests verify that this component still exposes expected integration anchors:

- expected incoming event name (`tpen-active-line-updated`)
- custom element registration (`tpen-line-history`)
- line payload fixture validity

File: `test/contracts/interface-contract.test.js`

### 2) Harness API Tests

The local harness API provides stable fixtures used by tests and debugging.

Routes:
- `/health`
- `/fixtures/annotation-page.json`
- `/fixtures/line.json`

File: `test/api/harness-api.test.js`

### 3) Browser Interface Tests

Playwright tests run against `demo.html` through a local test server and mock external URLs for:

- TPEN module
- line-image component
- RerumHistoryData module
- RERUM annotation page data

This keeps tests deterministic and independent from upstream network drift.

Files:
- `playwright.config.js`
- `e2e/interface.spec.js`
- `test/scripts/start-test-server.js`

### 4) Cross-Repo Integration Smoke

Smoke checks clone TPEN-interfaces and validate split-screen integration anchors in:

- `components/project-tools/index.js`
- `components/simple-transcription/index.js`

By default, it tracks the `main` branch of TPEN-interfaces.

Environment overrides:
- `TPEN_INTERFACES_REMOTE`
- `TPEN_INTERFACES_REF`

File: `test/scripts/run-integration-smoke.js`

## CI Policy

Workflow: `.github/workflows/test.yml`

- `local-tests` job runs on all branches and PRs
- `integration-smoke` job runs only when `github.ref == refs/heads/main`

This keeps branch feedback fast while preserving a stricter integration gate on main.
