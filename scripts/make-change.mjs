// Change 20 files with 10 added lines each (200 lines). With --forbidden, one added line
// carries the marker the check refuses.
import { appendFileSync } from 'node:fs';

const forbidden = process.argv.includes('--forbidden');
for (let i = 0; i < 20; i++) {
  const f = i * 97;
  const file = `src/mod_${String(Math.floor(f / 50)).padStart(3, '0')}/file_${String(f).padStart(4, '0')}.js`;
  const lines = [];
  for (let l = 0; l < 10; l++) lines.push(`export const added_${f}_${l} = ${l};`);
  if (forbidden && i === 7) lines[3] = 'export const bad = "FORBIDDEN_MARKER";';
  appendFileSync(file, lines.join('\n') + '\n');
}
console.log(`changed 20 files, 200 lines${forbidden ? ' (with FORBIDDEN_MARKER)' : ''}`);
