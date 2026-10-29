import { questions } from '../src/data/index.ts';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pattern-examples-'));
let failures = 0;
try {
  const files: string[] = [];
  for (const q of questions.filter((q) => q.code)) {
    const dir = path.join(root, q.id);
    fs.mkdirSync(dir);
    const file = path.join(dir, 'example.ts');
    fs.writeFileSync(file, q.code!.typescript + '\nexport {};\n');
    files.push(file);
    fs.writeFileSync(path.join(dir, 'Example.java'), q.code!.java);
    const result = spawnSync('javac', ['--release', '17', path.join(dir, 'Example.java')], {
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      console.error(`${q.id} (Java): ${result.error?.message ?? result.stderr}`);
      failures++;
    }
  }
  const config = path.join(root, 'tsconfig.json');
  fs.writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: 'ES2022',
        module: 'ESNext',
        types: [],
        skipLibCheck: true,
      },
      files,
    }),
  );
  const result = spawnSync(
    process.execPath,
    [path.resolve('node_modules/typescript/bin/tsc'), '-p', config],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.error?.message ?? result.stdout + result.stderr);
    failures++;
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
if (failures) process.exitCode = 1;
else console.log('All 66 Java snippets and 66 TypeScript snippets compile successfully.');
