# OrangeHRM Employee Lifecycle: Automation Framework

Playwright + TypeScript end-to-end / API framework and a GitHub Actions pipeline for the [OrangeHRM demo](https://opensource-demo.orangehrmlive.com).

**Employee lifecycle covered:** Authentication -> Employee creation (UI) -> Role-based validation (Admin vs ESS) -> Employee update (UI) -> API-level verification -> Employee deletion (UI + backend verification).

---

## 1. Setup

Prerequisites: Node.js 20+

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env        # optional overrides
```

## 2. Execution

| Goal | Command |
|---|---|
| Everything (UI + API) | `npm test` |
| UI only / API only | `npm run test:ui` / `npm run test:api` |
| Smoke | `npm run test:smoke` |
| Full lifecycle | `npm run test:lifecycle` |
| By any tag | `npx playwright test --grep "@rbac"` |
| Headed / debug | `npm run test:headed` / `npx playwright test --debug` |
| Different environment | `TEST_ENV=staging npm test` |
| Open HTML report | `npm run report` |
| Flaky analysis of last run | `npm run flaky:detect` |



### Environments
`config/env.ts` resolves the target from `TEST_ENV` (`demo` default, `staging`). Any value can be overridden with `BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`. Staging values come from `STAGING_URL`, `STAGING_ADMIN_USER`, `STAGING_ADMIN_PASSWORD` (GitHub secrets in CI). Adding an environment = one entry in `PRESETS`.

### Tagging strategy

| Tag | Meaning |
|---|---|
| `@smoke` | Fast, critical-path checks: run on every PR |
| `@regression` | Full functional suite |
| `@lifecycle` | The end-to-end employee journey |
| `@auth`, `@rbac`, `@api` | Feature / layer slices |

Tags are applied with Playwright's native `tag` option and filtered with `--grep`; the CI manual trigger accepts a tag expression.

## 3. Project layout

```
config/env.ts                 environment resolution
src/
  pages/                      Page Objects (BasePage, Login, Dashboard, AddEmployee, EmployeeDetails, Pim)
  api/                        API clients (Auth, Employee, Admin) + retrying HTTP wrapper
  fixtures/test.ts            DI of page objects/API clients, cleanup tracker, failure evidence
  data/                       data factory (unique per call) + role/permission policy table
  utils/                      retry (backoff), smart waits, logger
tests/
  auth.setup.ts               one-time UI login -> storageState
  e2e/                        UI specs (auth, employee lifecycle)
  api/                        API specs (CRUD, negative, unauthenticated)
perf/k6/                      login + employee-creation load tests, shared lib, HTML/JSON reports
scripts/detect-flaky.js       flaky detector (retry-based + repeat-based)
docs/flaky-test-strategy.md   detection & mitigation write-up
.github/workflows/ci.yml      pipeline
```

## 4. CI/CD (GitHub Actions)

`typecheck` -> `e2e` (matrix of 3 shards, 2 workers each) -> `merge-reports`; plus nightly `flaky-hunt` and on-demand/nightly `performance`.

- **Install dependencies**: `npm ci` (cached) + `playwright install`.
- **Execute tests**: sharded across machines (`--shard=i/3`) and parallel within each (workers).
- **Reports**: each shard emits a blob report; `merge-reports` combines them into one HTML report + JSON, plus JUnit per shard.
- **Artifacts**: `html-report`, `test-artifacts-*` (screenshots, videos, traces), `junit-*`, `flaky-report.md`, `k6-reports`.
- **Parallelization**: shards x workers; every test is data-isolated so this is safe.
- Manual runs (`workflow_dispatch`) accept `environment` and `tag`.

## 5. Reporting & observability

- HTML report (merged in CI, `reports/html` locally), JSON, JUnit.
- Screenshots + videos retained **only on failure**; trace on first retry; the auto fixture also attaches a full-page screenshot, URL and browser JS errors.
- Flaky summary is written to the GitHub job summary on every run.
- k6 HTML/JSON dashboards in `reports/perf/`.

## 6. Key design decisions

1. **Playwright + TypeScript**: auto-waiting, built-in parallelism/sharding, trace/video, API testing in the same runner (one toolchain for UI + API).
2. **Layered architecture**: tests -> page objects / API clients -> utils. Tests contain intent and assertions only; selectors live in page objects; HTTP details live in API clients.
3. **Fixtures instead of base classes**: page objects and API clients are injected; the `tracker` fixture guarantees teardown (users before employees) even when a test fails.
4. **API for setup/verification, UI for the behaviour under test**: faster, less brittle, and satisfies the "API-level verification" requirement (it checks the backend agrees with the UI after update and delete).
5. **Role validation is data-driven** (`ROLE_POLICIES`) and checks both UI visibility *and* server-side enforcement (ESS gets a non-2xx from an admin API).
6. **Stable data**: unique employees per test (8-digit id respects OrangeHRM's 10-char limit) so parallel/rerun/shared-demo collisions don't occur.
7. **Stability toolbox** (see `docs/flaky-test-strategy.md`): smart waits (`actAndWaitForResponse`, loader checks, hydration waits), exponential-backoff retry for idempotent HTTP only, CI test retries as a tracked safety net, screenshots/video/trace on failure.
8. **Performance tests are gentle by default** (smoke profile, self-cleaning) because the demo is shared. Thresholds: `http_req_failed < 2%`, `checks > 98%`, p95 login < 3 s, p95 employee create < 2.5 s.


