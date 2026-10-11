#!/usr/bin/env node
/**
 * Flaky-test detector.
 * Reads the Playwright JSON report and flags a test as FLAKY when either:
 *   1. Playwright marked it "flaky" (failed, then passed on retry), or
 *   2. across repeated runs (--repeat-each) it produced mixed pass/fail outcomes.
 *
 * Usage: node scripts/detect-flaky.js [--file=reports/results.json] [--fail-on-flaky]
 * Writes reports/flaky-report.md and appends to $GITHUB_STEP_SUMMARY when present.
 */
const fs = require('fs');
const path = require('path');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const file = arg('file', 'reports/results.json');
const failOnFlaky = process.argv.includes('--fail-on-flaky');

if (!fs.existsSync(file)) {
  console.error(`Report not found: ${file}`);
  process.exit(2);
}
const report = JSON.parse(fs.readFileSync(file, 'utf8'));

const stats = new Map(); // key -> { title, project, outcomes: [], flakyByRetry: bool }

function walk(suite) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const key = `${t.projectName} › ${spec.file} › ${spec.title}`;
      const entry = stats.get(key) || { key, outcomes: [], flakyByRetry: false, retries: 0 };
      const finalResult = t.results[t.results.length - 1];
      entry.outcomes.push(finalResult ? finalResult.status : 'unknown');
      if (t.status === 'flaky') entry.flakyByRetry = true;
      entry.retries += Math.max(0, t.results.length - 1);
      stats.set(key, entry);
    }
  }
  (suite.suites || []).forEach(walk);
}
(report.suites || []).forEach(walk);

const flaky = [];
for (const e of stats.values()) {
  const passes = e.outcomes.filter((o) => o === 'passed').length;
  const fails = e.outcomes.filter((o) => o !== 'passed' && o !== 'skipped').length;
  const mixed = passes > 0 && fails > 0;
  if (e.flakyByRetry || mixed) {
    flaky.push({ ...e, runs: e.outcomes.length, passes, fails, reason: e.flakyByRetry ? 'passed only after retry' : 'mixed results across repeats' });
  }
}

const lines = [];
lines.push('## Flaky test report', '');
lines.push(`Analysed **${stats.size}** tests. Flaky: **${flaky.length}**.`, '');
if (flaky.length) {
  lines.push('| Test | Runs | Pass | Fail | Retries | Reason |', '|---|---|---|---|---|---|');
  flaky.forEach((f) => lines.push(`| ${f.key} | ${f.runs} | ${f.passes} | ${f.fails} | ${f.retries} | ${f.reason} |`));
} else {
  lines.push('No flaky tests detected. ✅');
}
const md = lines.join('\n');

fs.mkdirSync(path.dirname('reports/flaky-report.md'), { recursive: true });
fs.writeFileSync('reports/flaky-report.md', md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
console.log(md);

process.exit(failOnFlaky && flaky.length ? 1 : 0);
