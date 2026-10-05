import fs from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'yaml';
import { copyTemplates, exists, expand, fail, frontmatter, homeDirectory, inside, packageRoot, readYaml, safePath, validateSchema, walk, writeManaged, writeNew } from './io.js';
import { syncSummary, syncTemplate, syncTemplates } from './template-sync.js';

export const harnesses = ['codex', 'claude', 'gemini', 'antigravity', 'generic'];
export const defaultHarnesses = ['codex', 'claude', 'gemini', 'antigravity'];
export function selectHarnesses(value = defaultHarnesses) {
  const values = Array.isArray(value) ? value : [value];
  if (!values.length || values.some((item) => typeof item !== 'string')) fail('UNKNOWN_HARNESS', 'Choose one or more platforms with --with codex,claude,gemini,antigravity, or --with all.');
  const selected = values.flatMap((item) => item.split(',').map((name) => name.trim()));
  if (selected.some((name) => name !== 'all' && !harnesses.includes(name))) fail('UNKNOWN_HARNESS', 'Supported platforms: ' + harnesses.join(', ') + ', all.');
  return [...new Set(selected.flatMap((name) => name === 'all' ? defaultHarnesses : [name]))];
}
async function assertInstallable(repo) {
  if (await exists(await safePath(repo, '.agent/execution.lock'))) fail('EXECUTION_ACTIVE', 'Finish the active execution before installing or refreshing adapters.');
}
export async function initGlobal(options = {}) {
  const home = homeDirectory(options.home);
  if (options.refresh) {
    let repo = options.repo;
    if (!repo) {
      try { repo = await findRepo(options.cwd || process.cwd()); }
      catch (error) { if (error.code !== 'REPO_NOT_INITIALIZED') throw error; }
    }
    if (repo) await assertInstallable(path.resolve(repo));
  }
  const files = await syncTemplates(path.join(packageRoot, 'templates/global'), home, 'global', options);
  files.push(await syncTemplate(home, 'handbook/agent-operations.md', await fs.readFile(path.join(packageRoot, 'docs/agent-operations.md'), 'utf8'), 'global/handbook/agent-operations.md', options));
  files.push(...await copyTemplates(path.join(packageRoot, 'examples'), path.join(home, 'examples')));
  return { home, ...syncSummary(files, home) };
}
export async function findRepo(start) {
  let current = path.resolve(start);
  while (true) {
    if (await exists(path.join(current, '.agent/workspace.yaml'))) return current;
    const parent = path.dirname(current);
    if (current === parent) fail('REPO_NOT_INITIALIZED', 'Run agent-workspace bootstrap --repo <repo>, or agent-workspace repo init.');
    current = parent;
  }
}
export async function loadWorkspace(options = {}) {
  const repo = options.repo ? path.resolve(options.repo) : await findRepo(options.cwd || process.cwd());
  const configPath = await safePath(repo, '.agent/workspace.yaml');
  if (!(await exists(configPath))) fail('REPO_NOT_INITIALIZED', 'Missing .agent/workspace.yaml in ' + repo);
  const config = await readYaml(configPath);
  await validateSchema('workspace', config);
  const home = homeDirectory(options.home || process.env.AGENT_WORKSPACE_HOME || config.workspace_home);
  if (inside(home, repo)) fail('INVALID_WORKSPACE_HOME', 'The global workspace home must not contain the target repo.');
  // An explicit home override makes a checkout portable without rewriting its config.
  const globalCore = options.home || process.env.AGENT_WORKSPACE_HOME ? path.join(home, 'core/CORE.md') : expand(config.policy.global_core, repo);
  const globalSkills = options.home || process.env.AGENT_WORKSPACE_HOME ? path.join(home, 'skills') : expand(config.skills.global, repo);
  const repoCore = await safePath(repo, config.policy.repo_core);
  const wikiMap = await safePath(repo, config.wiki.map);
  const wikiIndex = await safePath(repo, config.wiki.index);
  const localSkills = await safePath(repo, config.skills.local);
  for (const file of [globalCore, repoCore, wikiMap, wikiIndex]) {
    await safePath(path.dirname(file), path.basename(file));
    if (!(await exists(file))) fail('MISSING_CONTEXT', 'Required workspace file is missing: ' + file);
  }
  return { repo, home, config, globalCore, globalSkills, repoCore, wikiMap, wikiIndex, localSkills };
}
export async function installAdapter(repo, harness = 'codex', options = {}) {
  if (!harnesses.includes(harness)) fail('UNKNOWN_HARNESS', 'Supported output adapters: ' + harnesses.join(', '));
  await assertInstallable(repo);
  const filename = { codex: 'AGENTS.md', claude: 'CLAUDE.md', gemini: 'GEMINI.md', antigravity: '.agent/rules/agent-workspace.md', generic: '.agent/ADAPTER.md' }[harness];
  const identity = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  const config = await readYaml(await safePath(repo, '.agent/workspace.yaml'));
  await validateSchema('workspace', config);
  let specifier = identity.name + '@' + identity.version;
  if (config.cli?.distribution === 'github') {
    const repository = identity.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '');
    if (!repository || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repository)) fail('MISSING_DISTRIBUTION', 'The package needs a valid GitHub repository URL for GitHub release installation.');
    const tarball = identity.name.replace(/^@/, '').replace('/', '-') + '-' + identity.version + '.tgz';
    specifier = repository + '/releases/download/v' + identity.version + '/' + tarball;
  }
  const invocation = 'npx --yes --package "' + specifier + '" agent-workspace';
  const inventory = [];
  for (const file of await walk(path.join(packageRoot, 'templates/global/skills'))) if (path.basename(file) === 'SKILL.md') {
    const { metadata } = frontmatter(await fs.readFile(file, 'utf8'));
    inventory.push('- ' + metadata.name + ': ' + metadata.description);
  }
  const block = (await fs.readFile(path.join(packageRoot, 'templates/adapter.md'), 'utf8')).replaceAll('{{HARNESS}}', harness).replaceAll('{{CLI}}', invocation).replaceAll('{{SKILLS}}', inventory.join('\n'));
  const file = await safePath(repo, filename);
  if (!(await exists(file))) {
    const header = harness === 'antigravity' ? '---\ntrigger: always_on\ndescription: Use the Agent Workspace task, context and evidence pipeline.\n---\n\n' : '';
    return writeNew(repo, filename, header + block);
  }
  const original = await fs.readFile(file, 'utf8');
  const startMarker = '<!-- agent-workspace:start -->', endMarker = '<!-- agent-workspace:end -->';
  const start = original.indexOf(startMarker);
  if (start !== -1) {
    if (!options.refresh) return { file, created: false };
    const end = original.indexOf(endMarker, start);
    if (end === -1 || original.indexOf(startMarker, start + startMarker.length) !== -1 || original.indexOf(endMarker, end + endMarker.length) !== -1) fail('INVALID_ADAPTER', 'Expected one complete Agent Workspace router block; inspect ' + filename + ' before refreshing.');
    await writeManaged(repo, filename, original.slice(0, start) + block.trimEnd() + original.slice(end + endMarker.length));
    return { file, created: false, refreshed: true };
  }
  if (original.includes(endMarker)) fail('INVALID_ADAPTER', 'The Agent Workspace router has an end marker without a start marker: ' + filename);
  // Only append our router; preserve all existing user/harness instructions.
  const addition = (original.endsWith('\n') ? '\n' : '\n\n') + block;
  if (harness === 'antigravity' && !original.replace(/^\uFEFF/, '').startsWith('---\n') && !original.replace(/^\uFEFF/, '').startsWith('---\r\n')) {
    await writeManaged(repo, filename, '---\ntrigger: always_on\ndescription: Use the Agent Workspace task, context and evidence pipeline.\n---\n\n' + original + addition);
  } else await fs.appendFile(file, addition);
  return { file, created: true };
}
export async function installAdapters(repo, value, options = {}) {
  const selected = selectHarnesses(value);
  await assertInstallable(repo);
  // All platforms route to the same project workflows; no native copies or links.
  const shared = await installAdapter(repo, 'generic', options);
  const adapters = [];
  for (const harness of selected) adapters.push({ harness, ...(harness === 'generic' ? shared : await installAdapter(repo, harness, options)) });
  const config = await readYaml(await safePath(repo, '.agent/workspace.yaml'));
  const directory = await safePath(repo, config.skills.local);
  const files = await syncTemplates(path.join(packageRoot, 'templates/global/skills'), directory, 'global/skills', options);
  const entrypoints = files.filter((item) => path.basename(item.file) === 'SKILL.md');
  return { platforms: selected, adapters, shared, skills: { directory: config.skills.local, ...syncSummary(entrypoints, repo), customized: syncSummary(files, repo).customized } };
}
export async function initRepo(options = {}) {
  if (options.distribution && !['npm', 'github'].includes(options.distribution)) fail('UNKNOWN_DISTRIBUTION', 'Use --distribution npm or github.');
  const selected = selectHarnesses(options.with);
  const repo = path.resolve(options.repo || options.cwd || process.cwd());
  const home = homeDirectory(options.home);
  if (inside(home, repo)) fail('INVALID_WORKSPACE_HOME', 'The global workspace home must not contain the target repo.');
  await assertInstallable(repo);
  if (options.wikiDir !== undefined) await safePath(repo, options.wikiDir);
  await safePath(repo, '.agent');
  await fs.mkdir(repo, { recursive: true });
  const template = await readYaml(path.join(packageRoot, 'templates/workspace.yaml'));
  template.cli.distribution = options.distribution || 'npm';
  template.project.name = options.name || path.basename(repo);
  if (options.wikiDir !== undefined) {
    template.wiki.index = path.join(options.wikiDir, 'INDEX.md').replaceAll('\\', '/');
    template.wiki.map = path.join(options.wikiDir, 'MAP.yaml').replaceAll('\\', '/');
  }
  if (options.home || process.env.AGENT_WORKSPACE_HOME) {
    template.workspace_home = home;
    template.policy.global_core = path.join(home, 'core/CORE.md').replaceAll('\\', '/');
    template.skills.global = path.join(home, 'skills').replaceAll('\\', '/');
  }
  if (await exists(path.join(repo, 'tsconfig.json'))) template.tools.typescript_semantic.required = true;
  const config = await writeNew(repo, '.agent/workspace.yaml', stringify(template));
  const settings = await readYaml(config.file);
  await validateSchema('workspace', settings);
  const files = await syncTemplates(path.join(packageRoot, 'templates/repo'), repo, 'repo', options);
  // Honor existing wiki paths; initialization never relocates released knowledge.
  const wikiSource = path.join(packageRoot, 'templates/wiki');
  const wikiRoot = path.dirname(await safePath(repo, settings.wiki.map));
  for (const source of await walk(wikiSource)) {
    const relative = path.relative(wikiSource, source);
    const destination = relative === 'INDEX.md' ? settings.wiki.index : relative === 'MAP.yaml' ? settings.wiki.map : path.relative(repo, path.join(wikiRoot, relative));
    files.push(await writeNew(repo, destination, await fs.readFile(source, 'utf8')));
  }
  files.push(await writeNew(repo, '.agent/.gitignore', await fs.readFile(path.join(packageRoot, 'templates/agent-ignore.txt'), 'utf8')));
  for (const directory of ['.agent/rules', '.agent/skills', '.agent/tasks', '.agent/raw', '.agent/change-requests']) await fs.mkdir(await safePath(repo, directory), { recursive: true });
  const integration = await installAdapters(repo, selected, options);
  return { repo, config, adapter: integration.adapters[0], ...integration, wiki: { index: settings.wiki.index, map: settings.wiki.map }, ...syncSummary(files, repo) };
}
export async function bootstrap(options = {}) {
  if (options.distribution && !['npm', 'github'].includes(options.distribution)) fail('UNKNOWN_DISTRIBUTION', 'Use --distribution npm or github.');
  selectHarnesses(options.with);
  if (inside(homeDirectory(options.home), path.resolve(options.repo || options.cwd || process.cwd()))) fail('INVALID_WORKSPACE_HOME', 'The global workspace home must not contain the target repo.');
  await assertInstallable(path.resolve(options.repo || options.cwd || process.cwd()));
  if (options.wikiDir !== undefined) await safePath(path.resolve(options.repo || options.cwd || process.cwd()), options.wikiDir);
  return { global: await initGlobal(options), repo: await initRepo(options) };
}
