import fs from 'node:fs/promises';
import path from 'node:path';
import { hash, packageRoot, readJson, safePath, slash, walk, writeManaged, writeNew } from './io.js';

const normalizedHash = (text) => hash(text.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n'));
let history;

// Refresh only a byte-equivalent shipped default (apart from BOM/line endings).
// Version labels alone are insufficient: users may customize a default in place.
export async function syncTemplate(root, relative, content, key, options = {}) {
  const result = await writeNew(root, relative, content);
  if (result.created || !options.refresh) return result;
  const current = await fs.readFile(await safePath(root, relative), 'utf8');
  const digest = normalizedHash(current);
  if (digest === normalizedHash(content)) return { ...result, updated: false, customized: false };
  history ||= await readJson(path.join(packageRoot, 'templates/default-history.json'));
  if (!(history[key] || []).includes(digest)) return { ...result, updated: false, customized: true };
  await writeManaged(root, relative, content);
  return { ...result, updated: true, customized: false };
}

export async function syncTemplates(source, target, prefix, options = {}) {
  const results = [];
  for (const file of await walk(source)) {
    const relative = path.relative(source, file);
    results.push(await syncTemplate(target, relative, await fs.readFile(file, 'utf8'), prefix + '/' + slash(relative), options));
  }
  return results;
}

export function syncSummary(files, base) {
  return {
    created: files.filter((item) => item.created).length,
    updated: files.filter((item) => item.updated).length,
    preserved: files.filter((item) => !item.created && !item.updated).length,
    customized: files.filter((item) => item.customized).map((item) => slash(path.relative(base, item.file)))
  };
}
