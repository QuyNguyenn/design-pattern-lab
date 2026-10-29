import fs from 'node:fs';
import path from 'node:path';

const errors = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.(ts|tsx|css)$/.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.endsWith('\n')) errors.push(`${file}: missing final newline`);
    if (/^(<<<<<<< |=======\r?$|>>>>>>> )/m.test(text)) errors.push(`${file}: unresolved merge markers`);

  }
}
scan('src');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Source hygiene passed: all source files have final newlines and no merge markers. Strict typecheck also checks unused declarations.');
