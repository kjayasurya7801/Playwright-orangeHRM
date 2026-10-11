# Flaky Test Detection & Mitigation Strategy

A flaky test is one that gives different results on the same code. Flakes destroy trust in the suite, so they are treated as defects to be fixed, not tolerated.

## Detection

| Layer | Mechanism |
|---|---|
| Per run | Playwright marks a test **flaky** when it fails and then passes on retry. `scripts/detect-flaky.js` reads `reports/results.json` and lists them in the CI job summary and `flaky-report.md`. |
| Nightly | The `flaky-hunt` job runs `@smoke` with `--repeat-each=5` and **retries disabled**. Any test with mixed pass/fail outcomes is flagged, which exposes flakes that retries would otherwise hide. |
| Trend | Because the JSON and HTML reports are archived on every run, a test that shows up as flaky repeatedly is easy to spot. Optionally feed `results.json` into a dashboard. |
| Evidence | Traces (`on-first-retry`), screenshots and videos (on failure) and a full-page screenshot + page errors are attached automatically, so a flake can be diagnosed from artifacts alone. |

## Mitigation (in priority order)

1. **Remove the cause, don't mask it**
   - *Smart waits only*: web-first assertions (`expect(locator).toBeVisible()`), `waitForResponse` registered before the triggering click (`actAndWaitForResponse`), loader-gone checks. **No fixed sleeps.**
   - *Hydration races*: wait for async form values before typing (`EmployeeDetailsPage.expectLoaded`).
   - *Stable locators*: roles, placeholders and labels over positional XPath/CSS.
2. **Isolate data**: every test creates uniquely named data via a factory and cleans up in fixture teardown (runs on failure too). No test depends on another's data or order, so `fullyParallel` is safe.
3. **Controlled retries**
   - Test-level retries (`retries: 2` in CI) are a *safety net*; each retried pass is reported as flaky and tracked.
   - Retry with exponential backoff is used only for idempotent, non-assertion operations (API calls on 429/5xx/network errors, cleanup). Assertions are never retried.
4. **Fast API setup/teardown**: the UI is only used for what is under test; preconditions and cleanup go through the API, shrinking the surface area for UI flakes.
5. **Triage SLA**: a flaky test is quarantined (`test.fixme` + ticket) if not fixed within the sprint, so it stops blocking the pipeline without being forgotten.
6. **Environment awareness**: the shared public demo may reset or throttle; concurrency is capped (`workers: 2` in CI) and transient failures are retried at the HTTP layer.
