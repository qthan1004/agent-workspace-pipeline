import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as api from './index.js';
import { fail, packageRoot, WorkspaceError } from './io.js';
import { loadWorkspace } from './workspace.js';

export const help = [
  'Agent Workspace — strong-model task/plan pipeline (Node.js 22+)',
  'After init, users converse with their agent or supply a plan. The agent manages task records and CLI operations.',
  '',
  'One-time setup:',
  '  See README.md for the current npm/npx installation command.',
  '  init [--with codex,claude,gemini,antigravity|all] [--refresh] [--distribution npm|github]',
  '       default: all four platforms; --repo <dir> and --home <dir> are optional',
  '       --wiki-dir <dir> selects wiki/ or .wiki/ for a new project (default: wiki)',
  '  setup [--home <dir>] [--refresh]  (initialize/update pristine shared templates; preserve custom files)',
  '  bootstrap (alias for init)',
  '  repo init | repo inspect',
  '  adapter install --with <platforms> [--refresh]  (route platforms to shared skills)',
  '  doctor',
  '',
  'Agent internals — tasks:',
  '  task new | show | validate | approve | update | delete | finish <id>',
  '  task list',
  '  task approve <id> --by <authority>',
  '  task update <id> --from <edited-contract.md>  (new draft version)',
  '  prepare <id> [--draft] [--format <harness>] [--brief]',
  '  run <id> --with <harness> [--dry-run]',
  '',
  'Agent/maintainer internals — knowledge:',
  '  rules list | resolve <query> | show <id>',
  '  rules new | update | delete <id> --maintenance --by <maintainer>',
  '  wiki list | resolve <query> | show <id> | check-stale',
  '  wiki new | update | delete <id> --maintenance --by <maintainer>',
  '  rules|wiki request-fix <id-or-path> --reason <text> --evidence <file> --proposed-change <text>',
  '  skills list | show <name> | resolve <query>',
  '',
  'Agent internals — evidence / fresh review:',
  '  evidence init | snapshot | changes | record | validate <id>',
  '  evidence record <id> --kind E1..E5 --artifact <file> --description <text> --result passed',
  '  review prepare <id>',
  '  review record <id> --by <reviewer> --artifact <file> --result passed --source-digest <hash> --contract-sha256 <hash>',
  '  learn collect --task <id> --reason <text> --evidence <file>',
  '  learn propose --category <category> --reason <pattern> --evidence <file> --proposed-change <text>',
  '',
  'All commands accept --repo, --home, --json. Repeat --path/--symbol/--tag/--skill for routing.',
  'Use --file <repo-relative-receipt.json> for an alternate evidence receipt.',
  'See README.md for conversational usage; docs/agent-operations.md covers internal CRUD, artifacts and troubleshooting.'
].join('\n');
const stringFlags = ['repo', 'home', 'format', 'name', 'by', 'from', 'file', 'kind', 'artifact', 'description', 'result', 'entry', 'provider', 'symbol', 'references', 'inspected', 'reason', 'proposed-change', 'type', 'task', 'category', 'source-digest', 'contract-sha256', 'distribution', 'wiki-dir'];
const repeatFlags = ['with', 'path', 'symbol', 'tag', 'skill', 'evidence'];
const booleanFlags = ['help', 'version', 'json', 'draft', 'dry-run', 'maintenance', 'brief', 'refresh'];
const flags = Object.fromEntries([
  ...stringFlags.map((name) => [name, { type: 'string' }]),
  ...repeatFlags.map((name) => [name, { type: 'string', multiple: true }]),
  ...booleanFlags.map((name) => [name, { type: 'boolean' }])
]);
flags.help.short = 'h';
const common = ['repo', 'home', 'json'];
const allowed = {
  bootstrap: ['with', 'name', 'distribution', 'refresh', 'wiki-dir'], init: ['with', 'name', 'distribution', 'refresh', 'wiki-dir'], setup: ['refresh'], doctor: [],
  'repo init': ['with', 'name', 'distribution', 'refresh', 'wiki-dir'], 'repo inspect': [], 'adapter install': ['with', 'refresh'],
  'task new': [], 'task list': [], 'task show': [], 'task validate': ['draft'], 'task approve': ['by'],
  'task update': ['from'], 'task delete': [], 'task finish': ['file'],
  prepare: ['draft', 'format', 'with', 'brief'], run: ['with', 'dry-run'],
  'rules list': [], 'rules show': [], 'rules resolve': ['path', 'symbol', 'tag', 'skill'],
  'rules new': ['maintenance', 'by'], 'rules update': ['from', 'maintenance', 'by'], 'rules delete': ['maintenance', 'by'],
  'rules request-fix': ['reason', 'proposed-change', 'evidence', 'type'],
  'wiki list': [], 'wiki show': [], 'wiki resolve': ['path', 'symbol', 'tag', 'skill'], 'wiki check-stale': [],
  'wiki new': ['maintenance', 'by', 'description'], 'wiki update': ['from', 'maintenance', 'by', 'description', 'tag', 'symbol'],
  'wiki delete': ['maintenance', 'by'], 'wiki request-fix': ['reason', 'proposed-change', 'evidence', 'type'],
  'skills list': [], 'skills show': [], 'skills resolve': ['path', 'symbol', 'tag', 'skill'],
  'evidence init': ['file'], 'evidence snapshot': [], 'evidence changes': [],
  'evidence record': ['file', 'kind', 'artifact', 'description', 'result', 'entry', 'provider', 'symbol', 'references', 'inspected'],
  'evidence validate': ['file'], 'review prepare': ['file'],
  'review record': ['file', 'by', 'artifact', 'result', 'source-digest', 'contract-sha256'],
  'learn collect': ['task', 'reason', 'evidence'], 'learn propose': ['category', 'reason', 'proposed-change', 'evidence']
};
const summary = (item) => ({ id: item.context || item.id, file: item.file, version: item.metadata.version, status: item.metadata.status, level: item.level, scope: item.scope, score: item.score, reasons: item.reasons });
export async function main(argv) {
  let json = argv.includes('--json');
  try {
    const parsed = parseArgs({ args: argv, options: flags, allowPositionals: true, strict: true });
    const values = parsed.values, positional = [...parsed.positionals];
    json = Boolean(values.json);
    if (values.help || !positional.length && !values.version) { process.stdout.write(help + '\n'); return 0; }
    if (values.version) { process.stdout.write(JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8')).version + '\n'); return 0; }
    const first = positional.shift();
    const command = ['repo', 'adapter', 'task', 'rules', 'wiki', 'skills', 'evidence', 'review', 'learn'].includes(first) ? first + ' ' + positional.shift() : first;
    if (!Object.hasOwn(allowed, command)) fail('UNKNOWN_COMMAND', 'Unknown command: ' + command + '. Run --help.');
    for (const name of Object.keys(values)) if (![...common, ...allowed[command]].includes(name)) fail('INVALID_OPTION', '--' + name + ' is not supported by ' + command);
    const queryCommands = ['rules resolve', 'wiki resolve', 'skills resolve'];
    const noTarget = ['bootstrap', 'init', 'setup', 'doctor', 'repo init', 'repo inspect', 'adapter install', 'task list', 'rules list', 'wiki list', 'wiki check-stale', 'skills list', 'learn collect', 'learn propose'];
    if (noTarget.includes(command) && positional.length || !noTarget.includes(command) && !positional.length || !queryCommands.includes(command) && positional.length > 1) fail('INVALID_ARGUMENTS', 'Unexpected/missing arguments for ' + command + '. Run --help.');
    const target = queryCommands.includes(command) ? positional.join(' ') : positional[0];
    const options = { ...values, wikiDir: values['wiki-dir'], dryRun: values['dry-run'], proposedChange: values['proposed-change'], sourceDigest: values['source-digest'], contractSha256: values['contract-sha256'], paths: values.path, symbols: values.symbol, tags: values.tag, skills: values.skill };
    if (['run', 'prepare'].includes(command) && values.with) {
      if (values.with.length !== 1 || values.with[0].includes(',')) fail('INVALID_OPTION', command + ' executes/prepares one harness; use a single --with value.');
      options.with = values.with[0];
    }
    // E1's single symbol flag also participates in query routing elsewhere.
    if (command === 'evidence record') options.symbol = values.symbol?.[0];
    let result;
    switch (command) {
      case 'bootstrap':
      case 'init': result = await api.bootstrap(options); break;
      case 'setup': result = await api.initGlobal(options); break;
      case 'repo init': result = await api.initRepo(options); break;
      case 'repo inspect': result = await api.inspectRepo(options); break;
      case 'adapter install': result = await api.installAdapters((await loadWorkspace(options)).repo, options.with, options); break;
      case 'doctor': result = await api.doctor(options); break;
      case 'task new': result = await api.newTask(target, options); break;
      case 'task list': result = await api.listTasks(options); break;
      case 'task show': result = await api.showTask(target, options); break;
      case 'task validate': result = await api.validateTask(target, options); break;
      case 'task approve': result = await api.approveTask(target, options); break;
      case 'task update': result = await api.updateTask(target, options); break;
      case 'task delete': result = await api.deleteTask(target, options); break;
      case 'task finish': result = await api.finishTask(target, options); break;
      case 'prepare': {
        const prepared = await api.prepare(target, options);
        result = values.brief ? { task: prepared.manifest.task, prompt_file: prepared.promptFile, context: Object.fromEntries(['rules', 'wiki', 'skills'].map((key) => [key, prepared.manifest.context[key].map(summary)])), capabilities: prepared.manifest.capabilities, metrics: prepared.manifest.metrics } : json ? prepared.manifest : prepared.prompt;
        break;
      }
      case 'run': result = await api.runTask(target, options); break;
      case 'rules list': result = (await api.rulesInventory(await loadWorkspace(options))).map(summary); break;
      case 'rules show': result = await api.showRule(target, options); break;
      case 'rules resolve': result = (await api.resolveQuery('rules', target, options)).map(summary); break;
      case 'rules new': result = await api.newRule(target, options); break;
      case 'rules update': result = await api.updateRule(target, options); break;
      case 'rules delete': result = await api.deleteRule(target, options); break;
      case 'rules request-fix': result = await api.requestFix('rule', target, options); break;
      case 'wiki list': result = (await api.wikiInventory(await loadWorkspace(options))).map(summary); break;
      case 'wiki show': result = await api.showWiki(target, options); break;
      case 'wiki resolve': result = (await api.resolveQuery('wiki', target, options)).map(summary); break;
      case 'wiki new': result = await api.newWiki(target, options); break;
      case 'wiki update': result = await api.updateWiki(target, options); break;
      case 'wiki delete': result = await api.deleteWiki(target, options); break;
      case 'wiki check-stale': result = await api.staleWiki(options); break;
      case 'wiki request-fix': result = await api.requestFix('wiki', target, options); break;
      case 'skills list': result = (await api.skillInventory(await loadWorkspace(options))).map(summary); break;
      case 'skills show': {
        const skill = (await api.skillInventory(await loadWorkspace(options))).find((item) => item.id === target);
        if (!skill) fail('SKILL_NOT_FOUND', 'Unknown skill: ' + target);
        result = skill.text; break;
      }
      case 'skills resolve': result = (await api.resolveQuery('skills', target, options)).map(summary); break;
      case 'evidence init': result = await api.evidenceInit(target, options); break;
      case 'evidence snapshot': result = await api.evidenceSnapshot(target, options); break;
      case 'evidence changes': result = await api.evidenceChanges(target, options); break;
      case 'evidence record': result = await api.evidenceRecord(target, options); break;
      case 'evidence validate': result = await api.validateEvidence(target, options); break;
      case 'review prepare': { const review = await api.prepareReview(target, options); result = json ? { ...review, prompt: undefined } : review.prompt; break; }
      case 'review record': result = await api.recordReview(target, options); break;
      case 'learn collect': result = await api.collectLearning(options); break;
      case 'learn propose': result = await api.proposeLearning(options); break;
    }
    process.stdout.write(typeof result === 'string' && !json ? result + (result.endsWith('\n') ? '' : '\n') : JSON.stringify(result, null, 2) + '\n');
    return result?.ok === false ? 2 : 0;
  } catch (error) {
    const known = error instanceof WorkspaceError;
    const result = { error: known ? error.code : error.code || 'UNEXPECTED_ERROR', message: error.message, details: error.details || [] };
    process.stderr.write(json ? JSON.stringify(result) + '\n' : result.error + ': ' + result.message + '\n' + result.details.map((detail) => '- ' + detail + '\n').join(''));
    return 1;
  }
}
