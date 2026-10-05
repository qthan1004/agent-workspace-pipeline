import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { frontmatter, validateSchema, walk } from '../src/io.js';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const directory of ['src', 'bin', 'scripts', 'test']) for (const file of await walk(path.join(root, directory))) {
  if (!/\.(m?js)$/.test(file)) continue;
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr);
}
for (const file of await walk(path.join(root, 'templates'))) if (file.endsWith('SKILL.md')) {
  const { metadata, body } = frontmatter(await fs.readFile(file, 'utf8'), file);
  await validateSchema('document', metadata);
  if (!metadata.name || !metadata.description || !body.trim()) throw new Error('Invalid skill: ' + file);
  if (metadata.name !== path.basename(path.dirname(file))) throw new Error('Skill name/folder mismatch: ' + file);
}
console.log('JavaScript syntax and bundled skill manifests passed.');
