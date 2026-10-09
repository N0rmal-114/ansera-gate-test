// Stand-in for `ansera check --ci`: the same git steps as the step-1 design (16 section 4),
// with the flags that keep them independent of the user's git config, timed one by one.
// Fails when an added line contains FORBIDDEN_MARKER or a commit message is not conventional.
//   node gate-check.mjs                 range: merge base of the PR base and HEAD .. HEAD
//   node gate-check.mjs --staged        range: the index (what a pre-commit hook sees)
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const timings = {};
const timed = (name, fn) => { const t = performance.now(); const r = fn(); timings[name] = Math.round(performance.now() - t); return r; };
const total = performance.now();

let range = ['--cached'];
let base = null;
if (!staged) {
  const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : (process.argv[2] ?? 'origin/main');
  base = timed('mergeBase', () => git('merge-base', baseRef, 'HEAD').trim());
  range = [base, 'HEAD'];
}
const changed = timed('changedFiles', () => git('diff', '--name-status', '-z', '-M', ...range)).split('\0').filter(Boolean);
const diff = timed('addedLines', () => git('diff', '-U0', '--no-color', '--no-ext-diff', '--src-prefix=a/', '--dst-prefix=b/', ...range));
const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
const commits = staged ? [] : timed('commits', () => git('log', '--no-show-signature', '--format=%H%x00%P%x00%B%x1e', `${base}..HEAD`)).split('\x1e').map((s) => s.trim()).filter(Boolean);
timings.total = Math.round(performance.now() - total);

const problems = [];
if (added.some((l) => l.includes('FORBIDDEN_MARKER'))) problems.push('an added line contains FORBIDDEN_MARKER');
for (const c of commits) {
  const [sha, parents, msg] = c.split('\0');
  if (parents.trim().includes(' ')) continue;                       // merge commits are exempt
  const subject = (msg ?? '').split('\n')[0];
  if (!/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: .+/.test(subject)) problems.push(`commit ${sha.slice(0, 7)} is not a conventional commit: "${subject}"`);
}
const report = { mode: staged ? 'staged' : 'pr', changedEntries: changed.length, addedLines: added.length, commits: commits.length, timingsMs: timings, problems };
console.log(JSON.stringify(report));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```json\n' + JSON.stringify(report, null, 2) + '\n```\n');
process.exit(problems.length ? 1 : 0);
