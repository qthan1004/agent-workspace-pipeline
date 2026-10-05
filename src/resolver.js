import fs from 'node:fs/promises';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { fail, frontmatter, hash, readYaml, safePath, slash, validateSchema, walk } from './io.js';
import { loadWorkspace } from './workspace.js';

const stopwords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'must', 'not', 'into', 'when', 'using', 'only', 'before', 'after']);
const terms = (text) => String(text || '').toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter((word) => word.length > 2 && !stopwords.has(word));
export function matchesPath(file, pattern) {
  return minimatch(slash(file).replace(/^\.\//, ''), slash(pattern).replace(/^\.\//, ''), { dot: true, nocase: process.platform === 'win32', nonegate: true });
}
export function queryInput(query = '', options = {}) {
  return { text: query, paths: options.paths || [], symbols: options.symbols || [], tags: options.tags || [], skills: options.skills || [] };
}
export function rank(routing, input) {
  const patterns = routing.paths || routing.scope || [];
  const reasons = [];
  let tier = 0;
  for (const target of input.paths) for (const pattern of patterns) {
    if (slash(target) === slash(pattern)) { tier = Math.max(tier, 5); reasons.push('exact path: ' + target); }
    else if (matchesPath(target, pattern)) { tier = Math.max(tier, 4); reasons.push('path: ' + target + ' matches ' + pattern); }
  }
  for (const symbol of input.symbols) if ((routing.symbols || []).includes(symbol)) { tier = Math.max(tier, 3); reasons.push('symbol: ' + symbol); }
  const queryTerms = new Set(terms(input.text + ' ' + input.tags.join(' ')));
  for (const tag of routing.tags || []) {
    if (input.tags.some((value) => value.toLowerCase() === tag.toLowerCase()) || terms(tag).every((value) => queryTerms.has(value)) && terms(tag).length) {
      tier = Math.max(tier, 2); reasons.push('tag: ' + tag);
    }
  }
  const overlap = [...new Set(terms(routing.description))].filter((word) => queryTerms.has(word));
  if (overlap.length) { tier = Math.max(tier, 1); reasons.push('description: ' + overlap.join(', ')); }
  return { score: tier * 100 + Math.min(reasons.length, 50), reasons };
}
export async function document(file, kind) {
  await safePath(path.dirname(file), path.basename(file));
  const parsed = frontmatter(await fs.readFile(file, 'utf8'), file);
  await validateSchema('document', parsed.metadata);
  if (kind === 'skill' && (!parsed.metadata.name || !parsed.metadata.description)) fail('INVALID_SKILL', 'Skill requires name and description: ' + file);
  return { kind, file, id: parsed.metadata.id || parsed.metadata.name || path.basename(file, '.md'), ...parsed, sha256: hash(parsed.text) };
}
export async function rulesInventory(workspace) {
  const rules = [await document(workspace.globalCore, 'global-core'), await document(workspace.repoCore, 'repo-core')];
  for (const file of await walk(path.join(workspace.repo, '.agent/rules'))) if (file.endsWith('.md')) rules.push(await document(file, 'rule'));
  // Plain repository rules without metadata are mandatory; never silently skip them.
  return rules.map((rule) => ({ ...rule, level: rule.kind.endsWith('core') ? 'core' : rule.metadata.level || 'core' }));
}
export async function wikiInventory(workspace) {
  const map = await readYaml(workspace.wikiMap);
  await validateSchema('wiki-map', map);
  const root = path.dirname(workspace.wikiMap), pages = [];
  for (const [context, entry] of Object.entries(map.contexts)) {
    for (const related of entry.related || []) if (!Object.hasOwn(map.contexts, related)) fail('INVALID_WIKI_MAP', 'Unknown related context: ' + related);
    const file = await safePath(root, entry.file);
    const page = await document(file, 'wiki');
    for (const key of ['id', 'version', 'released_at', 'status', 'owner', 'scope', 'verified_against']) if (!(key in page.metadata)) fail('INVALID_WIKI_PAGE', 'Wiki page requires ' + key + ': ' + file);
    if (page.metadata.status === 'active' && (!page.metadata.released_at || !page.metadata.verified_against)) fail('INVALID_WIKI_PAGE', 'Active wiki needs a release date and verified revision: ' + file);
    pages.push({ ...page, context, routing: entry });
  }
  return pages;
}
export async function skillInventory(workspace) {
  const found = new Map();
  for (const [scope, root] of [['global', workspace.globalSkills], ['local', workspace.localSkills]]) {
    const names = new Set();
    for (const file of await walk(root)) if (path.basename(file) === 'SKILL.md') {
      const skill = await document(file, 'skill');
      if (names.has(skill.id)) fail('DUPLICATE_SKILL', 'Duplicate ' + scope + ' skill: ' + skill.id);
      names.add(skill.id);
      found.set(skill.id, { ...skill, scope, routing: { description: skill.metadata.description, ...skill.metadata.metadata?.agent_workspace } });
    }
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}
function scored(items, input, routing) {
  return items.map((item) => ({ ...item, ...rank(routing(item), input) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export async function resolveContext(workspace, input) {
  const rules = await rulesInventory(workspace);
  for (const rule of rules) if (rule.level === 'core' && rule.metadata.status && rule.metadata.status !== 'active') fail('INACTIVE_MANDATORY_RULE', 'Mandatory rule is not active: ' + rule.file);
  const mandatory = rules.filter((rule) => rule.level === 'core').map((rule) => ({ ...rule, reasons: ['mandatory'] }));
  const matched = scored(rules.filter((rule) => rule.level !== 'core' && (!rule.metadata.status || rule.metadata.status === 'active')), input, (rule) => rule.metadata);
  const pages = await wikiInventory(workspace);
  const wiki = scored(pages.filter((page) => page.metadata.status === 'active'), input, (page) => page.routing);
  const related = new Set(wiki.flatMap((page) => page.routing.related || []));
  for (const page of pages) if (page.metadata.status === 'active' && related.has(page.context) && !wiki.some((p) => p.context === page.context)) wiki.push({ ...page, score: 50, reasons: ['related context'] });
  const allSkills = await skillInventory(workspace);
  const explicit = input.skills.map((name) => {
    const skill = allSkills.find((item) => item.id === name);
    if (!skill) fail('SKILL_NOT_FOUND', 'Unknown requested skill: ' + name);
    return { ...skill, reasons: ['explicit task selection'] };
  });
  const automatic = scored(allSkills.filter((item) => !input.skills.includes(item.id) && item.id !== 'pipeline'), input, (skill) => skill.routing).slice(0, workspace.config.skills.max_auto ?? 3);
  const selectedRules = [...mandatory, ...matched];
  const skills = [...explicit, ...automatic];
  const capabilities = new Set([
    ...Object.entries(workspace.config.tools).filter(([, value]) => value.required).map(([key]) => key),
    ...selectedRules.flatMap((rule) => rule.metadata.capabilities || []),
    ...skills.flatMap((skill) => skill.routing.capabilities || [])
  ]);
  if (input.paths.some((file) => /\.[cm]?tsx?$/i.test(file))) capabilities.add('typescript_semantic');
  return { rules: selectedRules, wiki: wiki.slice(0, workspace.config.wiki.max_pages ?? 3), skills, capabilities: [...capabilities].sort() };
}
export async function resolveQuery(kind, query, options = {}) {
  const workspace = await loadWorkspace(options);
  const input = queryInput(query, { ...options, paths: [...(options.paths || []), query], symbols: [...(options.symbols || []), query] });
  const context = await resolveContext(workspace, input);
  return context[kind];
}
