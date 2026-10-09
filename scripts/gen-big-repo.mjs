// Generate 2,000 files with 50 lines each (100,000 lines) under src/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = 2000, LINES = 50;
for (let f = 0; f < FILES; f++) {
  const dir = join('src', `mod_${String(Math.floor(f / 50)).padStart(3, '0')}`);
  mkdirSync(dir, { recursive: true });
  const body = [];
  for (let l = 0; l < LINES; l++) body.push(`export const value_${f}_${l} = ${(f * LINES + l) % 997}; // line ${l}`);
  writeFileSync(join(dir, `file_${String(f).padStart(4, '0')}.js`), body.join('\n') + '\n');
}
console.log(`generated ${FILES} files, ${FILES * LINES} lines`);
