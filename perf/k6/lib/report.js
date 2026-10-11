import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

/** Writes console + HTML + JSON summaries under reports/perf/. */
export function buildSummary(name, data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: false }),
    [`reports/perf/${name}.html`]: htmlReport(data),
    [`reports/perf/${name}.json`]: JSON.stringify(data, null, 2),
  };
}
