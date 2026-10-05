import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseDocument, stringify } from 'yaml';
import Ajv from 'ajv';

export const packageRoot = fileURLToPath(new URL('../', import.meta.url));
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export const slash = (value) => value.replaceAll('\\', '/');
export const homeDirectory = (value) => {
  const selected = value || process.env.AGENT_WORKSPACE_HOME || path.join(os.homedir(), '.agent-workspace');
  return path.resolve(selected.startsWith('~/') || selected.startsWith('~\\') ? path.join(os.homedir(), selected.slice(2)) : selected);
};
export const expand = (value, base) => path.resolve(value.startsWith('~/') || value.startsWith('~\\') ? path.join(os.homedir(), value.slice(2)) : base, value.startsWith('~/') || value.startsWith('~\\') ? '' : value);

export class WorkspaceError extends Error {
  constructor(code, message, details = []) { super(message); this.code = code; this.details = details; }
}
export function fail(code, message, details) { throw new WorkspaceError(code, message, details); }
export async function exists(file) {
  try { await fs.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
export function inside(root, file) {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

// Reject links at every component, including nonexistent output paths. The CLI
// must never follow a repo-controlled link into an unrelated directory.
export async function safePath(root, relative) {
  if (path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) || relative.startsWith('\\')) fail('UNSAFE_PATH', 'Expected a relative path: ' + relative);
  const target = path.resolve(root, relative);
  if (!inside(root, target)) fail('UNSAFE_PATH', 'Path escapes its root: ' + relative);
  const rootPath = path.resolve(root);
  let current = path.parse(rootPath).root;
  for (const component of path.relative(current, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) fail('UNSAFE_PATH', 'Symbolic links are not allowed for managed files: ' + current);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
export async function writeNew(root, relative, content) {
  const file = await safePath(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  try { await fs.writeFile(file, content, { flag: 'wx' }); return { file, created: true }; }
  catch (error) { if (error.code === 'EEXIST') return { file, created: false }; throw error; }
}
export async function writeManaged(root, relative, content) {
  const file = await safePath(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = await safePath(root, relative + '.' + process.pid + '.tmp');
  try { await fs.writeFile(temporary, content, { flag: 'wx' }); await fs.rename(temporary, file); }
  finally { await fs.rm(temporary, { force: true }); }
  return file;
}
export async function walk(root) {
  if (!(await exists(root))) return [];
  await safePath(root, '');
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) fail('UNSAFE_PATH', 'Managed directories cannot contain symbolic links: ' + file);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  await visit(root);
  return files.sort();
}
export function yaml(text, file = 'input') {
  const document = parseDocument(text, { uniqueKeys: true, version: '1.2' });
  if (document.errors.length) fail('INVALID_YAML', 'Invalid YAML in ' + file, document.errors.map((e) => e.message));
  return document.toJS({ maxAliasCount: 50 });
}
export async function readYaml(file) { return yaml(await fs.readFile(file, 'utf8'), file); }
export async function readJson(file) {
  try { return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')); }
  catch (error) { if (error instanceof SyntaxError) fail('INVALID_JSON', 'Invalid JSON in ' + file, [error.message]); throw error; }
}
export function frontmatter(text, file = 'document') {
  const normalized = text.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(normalized);
  if (!match) return { metadata: {}, body: normalized, text: normalized };
  const metadata = yaml(match[1], file);
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) fail('INVALID_METADATA', 'Frontmatter must be a mapping: ' + file);
  return { metadata, body: normalized.slice(match[0].length), text: normalized };
}
export function markdown(metadata, body) { return '---\n' + stringify(metadata).trimEnd() + '\n---\n\n' + body.trim() + '\n'; }
const ajv = new Ajv({ allErrors: true, strict: true });
const validators = new Map();
export async function validateSchema(name, value) {
  if (!validators.has(name)) validators.set(name, ajv.compile(JSON.parse(await fs.readFile(path.join(packageRoot, 'schemas', name + '.json'), 'utf8'))));
  const validate = validators.get(name);
  if (!validate(value)) fail('SCHEMA_INVALID', name + ' does not satisfy its schema', validate.errors.map((e) => (e.instancePath || '/') + ' ' + e.message));
}
export function requireId(id) {
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id)) fail('INVALID_ID', 'IDs must contain 1–80 letters, numbers, underscores or hyphens.');
  return id;
}
export async function copyTemplates(source, target, transform = (text) => text) {
  const results = [];
  for (const file of await walk(source)) results.push(await writeNew(target, path.relative(source, file), transform(await fs.readFile(file, 'utf8'))));
  return results;
}
